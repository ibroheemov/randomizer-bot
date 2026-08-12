import { Document, Schema, model } from 'mongoose';

export interface UserDocument extends Document {
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  isLoggedIn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    telegramId: { type: Number, required: true, unique: true, index: true },
    username: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    isLoggedIn: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const User = model<UserDocument>('User', userSchema);
