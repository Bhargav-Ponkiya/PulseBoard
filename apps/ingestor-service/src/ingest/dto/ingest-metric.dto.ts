import { IsString, IsEnum, IsInt, IsOptional, Min, Max, IsUUID } from 'class-validator';

export enum IngestMetricStatus {
  UP = 'UP',
  DOWN = 'DOWN',
}

export class IngestMetricDto {
  @IsUUID()
  monitorId: string;

  @IsEnum(IngestMetricStatus)
  status: IngestMetricStatus;

  @IsInt()
  @Min(0)
  latencyMs: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(599)
  statusCode?: number;

  @IsOptional()
  @IsString()
  errorCode?: string;
}
