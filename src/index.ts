import { bot } from './bot';
import { connectDb, disconnectDb } from './db/connection';
import { startScheduler, stopScheduler } from './services/scheduler.service';

async function main(): Promise<void> {
  await connectDb();
  await startScheduler(bot.telegram);
  await bot.launch();
  console.log('[bot] launched');
}

main().catch((err) => {
  console.error('[bot] failed to start', err);
  process.exit(1);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`[bot] received ${signal}, shutting down...`);
  bot.stop(signal);
  await stopScheduler();
  await disconnectDb();
  process.exit(0);
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));
