import {
  IsEnum,
  IsString,
  MaxLength,
  IsOptional,
  IsObject,
} from 'class-validator';

export enum IngestLogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export class IngestLogDto {
  @IsEnum(IngestLogLevel)
  level: IngestLogLevel;

  @IsString()
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
