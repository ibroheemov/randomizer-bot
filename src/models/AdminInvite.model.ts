import { Document, Schema, model } from 'mongoose';

export interface AdminInviteDocument extends Document {
  token: string;
  createdBy: number;
  usedAt?: Date;
  usedBy?: number;
  createdAt: Date;
  updatedAt: Date;
}

const adminInviteSchema = new Schema<AdminInviteDocument>(
  {
    token: { type: String, required: true, unique: true, index: true },
    createdBy: { type: Number, required: true },
    usedAt: { type: Date },
    usedBy: { type: Number },
  },
  { timestamps: true },
);

// Auto-expire unused (and used) invites a day after creation — bearer links shouldn't live forever.
adminInviteSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export const AdminInvite = model<AdminInviteDocument>('AdminInvite', adminInviteSchema);
