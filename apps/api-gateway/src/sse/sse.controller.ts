import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Request, Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Public } from '@app/common';
import { Project } from '@app/database';

interface SubscriberEntry {
  redis: Redis;
  responses: Set<Response>;
}

@Controller('sse')
export class SseController {
  private readonly logger = new Logger(SseController.name);
  private readonly jwtSecret: string;
  private readonly redisUrl: string;
  private static readonly subscribers = new Map<string, SubscriberEntry>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {
    this.jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
    this.redisUrl = this.configService.getOrThrow<string>('REDIS_URL');
  }

  private async addSubscriber(channel: string, res: Response): Promise<void> {
    let entry = SseController.subscribers.get(channel);
    if (!entry) {
      const redis = new Redis(this.redisUrl);
      await redis.subscribe(channel);
      
      const responses = new Set<Response>();
      entry = { redis, responses };
      SseController.subscribers.set(channel, entry);

      redis.on('message', (_channel, message) => {
        const clients = SseController.subscribers.get(_channel)?.responses;
        if (!clients) return;

        let eventType = 'METRIC';
        try {
          const parsed = JSON.parse(message);
          if (parsed.type) eventType = parsed.type;
        } catch {}

        const data = `event: ${eventType}\ndata: ${message}\n\n`;
        for (const client of clients) {
          try {
            client.write(data);
          } catch (err) {
            this.logger.error(`Failed to write to client on channel ${_channel}`, err);
          }
        }
      });
    }
    entry.responses.add(res);
  }

  private async removeSubscriber(channel: string, res: Response): Promise<void> {
    const entry = SseController.subscribers.get(channel);
    if (!entry) return;

    entry.responses.delete(res);
    if (entry.responses.size === 0) {
      SseController.subscribers.delete(channel);
      try {
        await entry.redis.unsubscribe(channel);
      } catch (err) {
        this.logger.error(`Error unsubscribing Redis channel ${channel}`, err);
      } finally {
        await entry.redis.quit().catch((err) =>
          this.logger.error(`Error closing Redis connection for ${channel}`, err),
        );
      }
    }
  }

  @Get('token')
  async getSseToken(@Req() req: Request) {
    const user = req.user as { id: string } | undefined;
    if (!user) throw new UnauthorizedException('Authentication required');

    const sseToken = await this.jwtService.signAsync(
      { sub: user.id, type: 'sse' },
      { secret: this.jwtSecret, expiresIn: '60s' },
    );

    return { token: sseToken };
  }

  @Get('live')
  @Public()
  async liveStream(
    @Req() req: Request,
    @Res() res: Response,
    @Query('projectId') projectId: string,
    @Query('token') token: string,
  ) {
    if (!token) throw new UnauthorizedException('Missing token');

    let payload: { sub: string; type?: string };
    try {
      payload = await this.jwtService.verifyAsync(token, { secret: this.jwtSecret });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (payload.type !== 'sse') {
      throw new UnauthorizedException('Invalid token type');
    }

    if (!projectId) {
      res.status(400).json({ error: 'Missing projectId' });
      return;
    }

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['id', 'userId'],
    });

    if (!project || project.userId !== payload.sub) {
      throw new UnauthorizedException('Access denied');
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    res.write('event: connected\ndata: {}\n\n');

    const channel = `live:stream:${projectId}`;
    await this.addSubscriber(channel, res);

    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        clearInterval(heartbeat);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      void this.removeSubscriber(channel, res);
    });
  }
}
