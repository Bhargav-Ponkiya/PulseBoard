import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Octokit } from '@octokit/rest';
import { CryptoService } from '../crypto/crypto.service';

export interface GitCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);

  constructor(
    private readonly cryptoService: CryptoService,
    private readonly configService: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  /** Fetches recent commits from GitHub with Redis caching. */
  async getRecentCommits(
    githubRepo: string,
    encryptedToken: string,
  ): Promise<GitCommit[]> {
    try {
      const [owner, repo] = githubRepo.split('/');
      const cacheKey = `cache:github:${owner}:${repo}`;

      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as GitCommit[];
      }

      const token = this.cryptoService.decrypt(encryptedToken);
      const octokit = new Octokit({ auth: token });

      const { data } = await octokit.repos.listCommits({
        owner,
        repo,
        per_page: 3,
      });

      const commits: GitCommit[] = data.map((c) => ({
        sha: c.sha.slice(0, 7),
        message: c.commit.message.split('\n')[0],
        author: c.commit.author?.name ?? 'unknown',
        date: c.commit.author?.date ?? new Date().toISOString(),
      }));

      await this.redis.setex(cacheKey, 600, JSON.stringify(commits));

      return commits;
    } catch (err) {
      this.logger.error(`Failed to fetch commits for ${githubRepo}`, err);
      return [];
    }
  }

  /** Validates a GitHub personal access token by calling the authenticated user endpoint. */
  async validateToken(token: string): Promise<boolean> {
    try {
      const octokit = new Octokit({ auth: token });
      await octokit.users.getAuthenticated();
      return true;
    } catch (err) {
      this.logger.error('GitHub token validation failed', err);
      return false;
    }
  }
}
