import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LogDocument = Log & Document;

@Schema({ collection: 'logs', timestamps: false })
export class Log {
  @Prop({ type: String, required: true })
  projectId: string;

  @Prop({
    type: String,
    required: true,
    enum: ['debug', 'info', 'warn', 'error'],
  })
  level: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;

  @Prop({ type: [Number], default: null })
  embedding: number[] | null;

  @Prop({ type: Date, required: true })
  timestamp: Date;
}

export const LogSchema = SchemaFactory.createForClass(Log);

LogSchema.index({ projectId: 1, level: 1, timestamp: -1 });
LogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 1209600 });
