import { BotContext } from '../types/context.types';
import { getOrCreateUser } from '../services/user.service';

/** Ensures every interacting Telegram user has a fresh User/role record. Never blocks. */
export async function attachUser(ctx: BotContext, next: () => Promise<void>): Promise<void> {
  if (ctx.from) {
    await getOrCreateUser(ctx.from);
  }
  return next();
}
