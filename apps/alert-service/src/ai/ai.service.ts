import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export interface IncidentContext {
  monitor: { name: string; url: string };
  errorCode?: string;
  errorMessage?: string;
  commits: { sha: string; message: string; author: string }[];
  logs: { level: string; message: string; timestamp: Date }[];
}

export interface IncidentReport {
  probable_cause: string;
  evidence: string[];
  immediate_fix: string;
  prevention: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const DEFAULT_REPORT: IncidentReport = {
  probable_cause: 'Manual review needed',
  evidence: [],
  immediate_fix: 'Manual review needed',
  prevention: '',
  severity: 'medium',
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly googleProvider;

  constructor(private readonly configService: ConfigService) {
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (geminiKey) {
      this.googleProvider = createGoogleGenerativeAI({ apiKey: geminiKey });
    }
  }

  /** Generates an AI-powered incident report using Gemini. */
  async generateIncidentReport(
    context: IncidentContext,
  ): Promise<IncidentReport> {
    const prompt = this.buildPrompt(context);

    if (!this.googleProvider) {
      this.logger.warn('Gemini provider not configured');
      return DEFAULT_REPORT;
    }

    try {
      const result = await generateText({
        model: this.googleProvider('gemini-2.5-flash'),
        prompt,
      });
      return this.parseReport(result.text);
    } catch (err) {
      this.logger.error('Gemini AI generation failed', err);
      return DEFAULT_REPORT;
    }
  }

  /** Builds the prompt string for the AI model from incident context. */
  private buildPrompt(context: IncidentContext): string {
    const logLines = context.logs
      .slice(0, 5)
      .map(
        (l) =>
          `[${l.timestamp.toISOString()}] ${l.level.toUpperCase()}: ${l.message}`,
      )
      .join('\n');

    const commitLines = context.commits
      .slice(0, 3)
      .map((c) => `${c.sha} - ${c.message} (${c.author})`)
      .join('\n');

    return [
      `Monitor: ${context.monitor.name} (${context.monitor.url})`,
      context.errorCode ? `Error Code: ${context.errorCode}` : '',
      context.errorMessage ? `Error Message: ${context.errorMessage}` : '',
      '',
      'Recent Error Logs:',
      logLines || '(none)',
      '',
      'Recent Commits:',
      commitLines || '(none)',
      '',
      'Analyze the above and provide an incident report.',
      'Respond with ONLY valid JSON, no markdown fences, no explanation.',
      'JSON format: { "probable_cause": "string", "evidence": ["string"], "immediate_fix": "string", "prevention": "string", "severity": "low|medium|high|critical" }',
    ]
      .filter(Boolean)
      .join('\n');
  }

  /** Parses and validates the AI response into a structured IncidentReport. */
  private parseReport(text: string): IncidentReport {
    try {
      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;
      if (!parsed.probable_cause || typeof parsed.probable_cause !== 'string') {
        this.logger.warn('AI report missing probable_cause, using default');
        return DEFAULT_REPORT;
      }
      return {
        probable_cause: parsed.probable_cause,
        evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
        immediate_fix: typeof parsed.immediate_fix === 'string' ? parsed.immediate_fix : 'Manual review needed',
        prevention: typeof parsed.prevention === 'string' ? parsed.prevention : '',
        severity: ['low', 'medium', 'high', 'critical'].includes(parsed.severity as string) ? parsed.severity as 'low' | 'medium' | 'high' | 'critical' : 'medium',
      };
    } catch {
      return DEFAULT_REPORT;
    }
  }
}
