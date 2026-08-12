import { Document, Schema, model, Types } from 'mongoose';

export interface ParticipantDocument extends Document {
  contestId: Types.ObjectId;
  telegramId: number;
  username?: string;
  joinedAt: Date;
}

const participantSchema = new Schema<ParticipantDocument>({
  contestId: { type: Schema.Types.ObjectId, ref: 'Contest', required: true, index: true },
  telegramId: { type: Number, required: true },
  username: { type: String },
  joinedAt: { type: Date, default: Date.now },
});

participantSchema.index({ contestId: 1, telegramId: 1 }, { unique: true });

export const Participant = model<ParticipantDocument>('Participant', participantSchema);
