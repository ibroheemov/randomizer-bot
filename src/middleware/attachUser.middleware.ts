import { BotContext } from '../types/context.types';
import { getOrCreateUser } from '../services/user.service';

/** Ensures every interacting Telegram user has a fresh User/role record. Never blocks. */
export async function attachUser(ctx: BotContext, next: () => Promise<void>): Promise<void> {
  if (ctx.from) {
    try {
      await getOrCreateUser(ctx.from);
    } catch (err) {
      // This runs before every single handler in the bot — if it threw instead of failing
      // open, a DB hiccup would silently kill every interaction with zero reply, since
      // nothing downstream would ever run. Log and let the request through regardless;
      // whichever handler actually needs the DB next has its own error handling.
      console.error('[attachUser] failed to load/create user record', err);
    }
  }
  return next();
}
