import { Document, Schema, model } from 'mongoose';
import {
  CompletionType,
  ContestStatus,
  ContestWinner,
  MediaType,
  PublishType,
  RequiredChannel,
} from '../types/contest.types';

export interface ContestDocument extends Document {
  ownerTelegramId: number;
  text: string;
  mediaType?: MediaType;
  mediaFileId?: string;
  buttonText: string;
  requiredChannels: RequiredChannel[];
  requireSubscription: boolean;
  winnersCount: number;
  publishChannelId: number;
  publishChannelTitle: string;
  publishType: PublishType;
  publishAt: Date;
  completionType: CompletionType;
  completeAt?: Date;
  participantsThreshold?: number;
  useCaptcha: boolean;
  boostForLuck: boolean;
  status: ContestStatus;
  messageId?: number;
  participantsCount: number;
  winners: ContestWinner[];
  removedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const requiredChannelSchema = new Schema<RequiredChannel>(
  {
    chatId: { type: Number, required: true },
    title: { type: String, required: true },
    username: { type: String },
  },
  { _id: false },
);

const winnerSchema = new Schema<ContestWinner>(
  {
    telegramId: { type: Number, required: true },
    username: { type: String },
  },
  { _id: false },
);

const contestSchema = new Schema<ContestDocument>(
  {
    ownerTelegramId: { type: Number, required: true, index: true },
    text: { type: String, required: true },
    mediaType: { type: String, enum: ['photo', 'video', 'animation', 'document'] },
    mediaFileId: { type: String },
    buttonText: { type: String, required: true },
    requiredChannels: { type: [requiredChannelSchema], default: [] },
    requireSubscription: { type: Boolean, default: true },
    winnersCount: { type: Number, required: true },
    publishChannelId: { type: Number, required: true },
    publishChannelTitle: { type: String, required: true },
    publishType: { type: String, enum: ['now', 'scheduled'], required: true },
    publishAt: { type: Date, required: true },
    completionType: { type: String, enum: ['by_time', 'by_participants'], required: true },
    completeAt: { type: Date },
    participantsThreshold: { type: Number },
    useCaptcha: { type: Boolean, default: false },
    boostForLuck: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'completed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    messageId: { type: Number },
    participantsCount: { type: Number, default: 0 },
    winners: { type: [winnerSchema], default: [] },
    removedAt: { type: Date },
  },
  { timestamps: true },
);

contestSchema.index({ status: 1, publishAt: 1 });
contestSchema.index({ status: 1, completeAt: 1 });
contestSchema.index({ ownerTelegramId: 1, createdAt: -1 });

export const Contest = model<ContestDocument>('Contest', contestSchema);
