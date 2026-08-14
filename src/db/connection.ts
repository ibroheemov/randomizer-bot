import mongoose from 'mongoose';
import { env } from '../config/env';

export async function connectDb(): Promise<void> {
  mongoose.connection.on('connected', () => console.log('[db] connected'));
  mongoose.connection.on('error', (err) => console.error('[db] connection error', err));
  mongoose.connection.on('disconnected', () => console.warn('[db] disconnected'));

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 20000,
    // Default (true) silently queues every query forever if the connection ever drops —
    // that's what turns a transient Mongo hiccup into a 90s Telegraf-level hang across
    // every handler (attachUser hits the DB on literally every update). Failing fast here
    // means the try/catch blocks already in place elsewhere actually get a chance to run.
    bufferCommands: false,
  });
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
