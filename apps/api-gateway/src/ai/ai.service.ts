import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { embed } from 'ai';
import { google } from '@ai-sdk/google';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  private readonly geminiApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.geminiApiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');
    if (this.geminiApiKey) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = this.geminiApiKey;
    }
  }

  /** Generate a text embedding vector for a search query using Gemini */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      const { embedding } = await embed({
        model: google.embedding('text-embedding-004'),
        value: query,
      });
      return embedding;
    } catch {
      this.logger.warn('Embedding generation failed, using fallback search');
      return [];
    }
  }
}
