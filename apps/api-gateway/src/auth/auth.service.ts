import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '@app/database';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /** Register a new user account and return auth tokens */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepository.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    try {
      await this.userRepository.save(user);
    } catch {
      throw new ConflictException('Email already registered');
    }

    const tokens = await this.generateTokenPair(user);
    const refreshHash = await bcrypt.hash(tokens.refreshToken, 12);
    await this.userRepository.update(user.id, { refreshTokenHash: refreshHash });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt?.toISOString(),
      },
    };
  }

  /** Authenticate a user with email and password */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
      select: ['id', 'email', 'name', 'passwordHash', 'refreshTokenHash', 'isActive', 'createdAt'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash ?? '',
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated. Contact support.');
    }

    const tokens = await this.generateTokenPair(user, dto.rememberMe ?? false);

    const refreshHash = await bcrypt.hash(tokens.refreshToken, 12);
    await this.userRepository.update(user.id, { refreshTokenHash: refreshHash });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt?.toISOString(),
      },
    };
  }

  /** Validate and rotate a refresh token, returning a new token pair */
  async refreshToken(token: string): Promise<AuthResponseDto> {
    let payload: { sub: string };

    try {
      payload = await this.jwtService.verifyAsync<{ sub: string }>(token, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: ['id', 'email', 'name', 'refreshTokenHash', 'isActive', 'createdAt'],
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isTokenValid = await bcrypt.compare(token, user.refreshTokenHash);

    if (!isTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const tokens = await this.generateTokenPair(user);
    const refreshHash = await bcrypt.hash(tokens.refreshToken, 12);
    await this.userRepository.update(user.id, { refreshTokenHash: refreshHash });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt?.toISOString(),
      },
    };
  }

  /** Invalidate all refresh tokens for a user */
  async logout(userId: string): Promise<void> {
    await this.userRepository.update(userId, { refreshTokenHash: null });
  }

  /** Generate an access and refresh token pair for the given user */
  private async generateTokenPair(
    user: User,
    rememberMe = false,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email };

    const accessTokenExpiry = this.configService.get<string>('JWT_ACCESS_EXPIRY') ?? '15m';
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: accessTokenExpiry as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const refreshExpiry = rememberMe
      ? (this.configService.get<string>('JWT_REFRESH_EXPIRY_REMEMBER') ?? '30d')
      : (this.configService.get<string>('JWT_REFRESH_EXPIRY') ?? '7d');

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiry as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    return { accessToken, refreshToken };
  }
}
