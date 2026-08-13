import { Document, Schema, model } from 'mongoose';
import { Role } from '../types/role.types';

export interface UserDocument extends Document {
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    telegramId: { type: Number, required: true, unique: true, index: true },
    username: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user', index: true },
  },
  { timestamps: true },
);

export const User = model<UserDocument>('User', userSchema);
