import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MetricDocument = Metric & Document;

@Schema({ collection: 'metrics', timestamps: false })
export class Metric {
  @Prop({ type: String, required: true })
  monitorId: string;

  @Prop({ type: String, required: true })
  projectId: string;

  @Prop({ type: String, required: true, enum: ['UP', 'DOWN'] })
  status: string;

  @Prop({ type: Number, default: null })
  statusCode: number | null;

  @Prop({ type: Number, required: true })
  latencyMs: number;

  @Prop({ type: String, default: null })
  errorCode: string | null;

  @Prop({ type: String, default: null })
  errorMessage: string | null;

  @Prop({ type: Date, required: true })
  timestamp: Date;
}

export const MetricSchema = SchemaFactory.createForClass(Metric);

MetricSchema.index({ monitorId: 1, timestamp: -1 });
MetricSchema.index({ projectId: 1, timestamp: -1 });
MetricSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });
