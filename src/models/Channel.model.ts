import { Document, Schema, model } from 'mongoose';

export type ChannelType = 'channel' | 'group' | 'supergroup';

export interface ChannelDocument extends Document {
  ownerTelegramId: number;
  chatId: number;
  type: ChannelType;
  title: string;
  username?: string;
  addedAt: Date;
}

const channelSchema = new Schema<ChannelDocument>({
  ownerTelegramId: { type: Number, required: true, index: true },
  chatId: { type: Number, required: true },
  type: { type: String, enum: ['channel', 'group', 'supergroup'], required: true },
  title: { type: String, required: true },
  username: { type: String },
  addedAt: { type: Date, default: Date.now },
});

channelSchema.index({ ownerTelegramId: 1, chatId: 1 }, { unique: true });

export const Channel = model<ChannelDocument>('Channel', channelSchema);
