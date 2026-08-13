import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  TIMEZONE: z.string().default('Asia/Tashkent'),
  SUPERADMIN_TELEGRAM_ID: z.coerce.number().int().positive(),
});

export const env = envSchema.parse(process.env);
