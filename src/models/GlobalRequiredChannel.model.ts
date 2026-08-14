import { Document, Schema, model } from 'mongoose';
import { ChannelType } from './Channel.model';

export interface GlobalRequiredChannelDocument extends Document {
  chatId: number;
  type: ChannelType;
  title: string;
  username?: string;
  addedBy: number;
  addedAt: Date;
}

const globalRequiredChannelSchema = new Schema<GlobalRequiredChannelDocument>({
  chatId: { type: Number, required: true, unique: true },
  type: { type: String, enum: ['channel', 'group', 'supergroup'], required: true },
  title: { type: String, required: true },
  username: { type: String },
  addedBy: { type: Number, required: true },
  addedAt: { type: Date, default: Date.now },
});

export const GlobalRequiredChannel = model<GlobalRequiredChannelDocument>(
  'GlobalRequiredChannel',
  globalRequiredChannelSchema,
);
