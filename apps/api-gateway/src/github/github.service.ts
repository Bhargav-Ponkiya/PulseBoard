import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@app/database';
import { CryptoService } from '../crypto/crypto.service';
import { Octokit } from '@octokit/rest';

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cryptoService: CryptoService,
  ) {}

  /** Validate a GitHub token by calling the authenticated user API */
  async validateToken(token: string): Promise<boolean> {
    try {
      const octokit = new Octokit({ auth: token });
      await octokit.users.getAuthenticated();
      return true;
    } catch {
      return false;
    }
  }

  /** Encrypt and save a GitHub token for the given user, including their username */
  async saveToken(userId: string, token: string): Promise<void> {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.users.getAuthenticated();
    
    const encrypted = this.cryptoService.encrypt(token);
    await this.userRepository.update(userId, { 
      githubAccessToken: encrypted,
      githubUsername: data.login 
    });
    this.logger.log(`GitHub token saved for user ${userId} (@${data.login})`);
  }

  /** Get the GitHub connection status and username for the user */
  async getStatus(
    userId: string,
  ): Promise<{ connected: boolean; username: string | null }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'githubAccessToken', 'githubUsername'],
    });

    return {
      connected: !!user?.githubAccessToken,
      username: user?.githubUsername ?? null,
    };
  }

  /** Delete the saved GitHub token for the given user */
  async deleteToken(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      githubAccessToken: null,
      githubUsername: null,
    });
    this.logger.log(`GitHub token cleared for user ${userId}`);
  }
}
