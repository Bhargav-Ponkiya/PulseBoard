import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHash } from 'crypto';
import { Log } from '@app/database';
import { AiService } from '../ai/ai.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);

  constructor(
    @InjectModel(Log.name)
    private readonly logModel: Model<Log>,
    private readonly aiService: AiService,
    private readonly cacheService: CacheService,
  ) {}

  private readonly VALID_LEVELS = ['debug', 'info', 'warn', 'error'];

  /** Get paginated logs for a project with optional level, search, and date filters */
  async getLogs(
    projectId: string,
    query: {
      level?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const filter: Record<string, unknown> = { projectId };
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    if (query.level) {
      if (!this.VALID_LEVELS.includes(query.level)) {
        throw new Error(`Invalid level filter: ${query.level}. Must be one of: ${this.VALID_LEVELS.join(', ')}`);
      }
      filter.level = query.level;
    }

    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.message = { $regex: escaped, $options: 'i' };
    }

    if (query.startDate || query.endDate) {
      const timestampFilter: Record<string, unknown> = {};
      if (query.startDate) {
        timestampFilter.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        timestampFilter.$lte = new Date(query.endDate);
      }
      filter.timestamp = timestampFilter;
    }

    const [data, total] = await Promise.all([
      this.logModel
        .find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.logModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** Search logs using semantic embedding or regex fallback, cached in Redis */
  async searchLogs(
    projectId: string,
    searchQuery: string,
  ): Promise<Record<string, unknown>[] | null> {
    if (!searchQuery || searchQuery.trim().length === 0) return null;
    if (searchQuery.length > 200) throw new Error('Search query must be 200 characters or fewer');
    const cacheKey = `search:${projectId}:${createHash('sha256').update(searchQuery).digest('hex')}`;

    const cached =
      await this.cacheService.get<Record<string, unknown>[]>(cacheKey);
    if (cached) {
      return cached;
    }

    let results: Record<string, unknown>[] | null = null;

    const embedding = await this.aiService.generateQueryEmbedding(searchQuery);

    if (embedding && embedding.length > 0) {
      results = await this.semanticSearch(projectId, embedding);
    }

    if (!results || results.length === 0) {
      results = await this.regexSearch(projectId, searchQuery);
    }

    await this.cacheService.set(cacheKey, results, 120);

    return results;
  }

  /** Perform a semantic similarity search using embedding vectors */
  private async semanticSearch(
    projectId: string,
    embedding: number[],
  ): Promise<Record<string, unknown>[] | null> {
    const logsWithEmbeddings = await this.logModel
      .find({
        projectId,
        embedding: { $exists: true, $ne: null },
      })
      .limit(200)
      .lean()
      .exec();

    if (logsWithEmbeddings.length === 0) {
      return null;
    }

    const scored = logsWithEmbeddings
      .filter((log): log is typeof log & { embedding: number[] } => log.embedding != null && Array.isArray(log.embedding))
      .map((log) => ({
        ...log,
        score: this.cosineSimilarity(embedding, log.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    if (scored.length > 0 && scored[0].score > 0.5) {
      return scored;
    }

    return null;
  }

  /** Compute the cosine similarity between two vectors */
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length && i < b.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /** Fallback regex-based search when no semantic results are found */
  private async regexSearch(
    projectId: string,
    searchQuery: string,
  ): Promise<Record<string, unknown>[]> {
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const results = await this.logModel
      .find({
        projectId,
        message: { $regex: escaped, $options: 'i' },
      })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean()
      .exec();

    return results.map((r) => ({
      ...r,
      score: 1,
    }));
  }
}
