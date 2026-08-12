import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context.types';
import { User } from '../models/User.model';
import { MAIN_MENU_GREETING, mainMenuKeyboard } from '../keyboards/mainMenu.keyboard';
import { JOIN_CONTEST_ACTION_PREFIX } from '../keyboards/inline/contestPost.inline';

const LOGIN_PROMPT = 'Please login to create a contest!';

/** Registers the literal "/admin-<telegramid>" login command. */
export function registerAuthHandlers(bot: Telegraf<BotContext>): void {
  // Telegram's command parser rejects hyphens, so this is matched as raw text via `hears`.
  bot.hears(/^\/admin-(\d+)$/, async (ctx) => {
    const claimedId = Number(ctx.match[1]);
    if (!ctx.from || claimedId !== ctx.from.id) return;

    await User.findOneAndUpdate(
      { telegramId: ctx.from.id },
      {
        telegramId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        isLoggedIn: true,
      },
      { upsert: true },
    );

    await ctx.reply(MAIN_MENU_GREETING, mainMenuKeyboard);
  });
}

/**
 * DB-backed login gate so it survives restarts independent of session storage. The public
 * "join contest" button (tapped by arbitrary channel members, not bot admins) is exempt.
 */
export async function authGate(ctx: BotContext, next: () => Promise<void>): Promise<void> {
  if (
    ctx.callbackQuery &&
    'data' in ctx.callbackQuery &&
    ctx.callbackQuery.data?.startsWith(JOIN_CONTEST_ACTION_PREFIX)
  ) {
    return next();
  }

  const text = ctx.message && 'text' in ctx.message ? ctx.message.text : undefined;
  if (text === '/start' || (typeof text === 'string' && /^\/admin-\d+$/.test(text))) {
    return next();
  }

  if (!ctx.from) return next();

  const user = await User.findOne({ telegramId: ctx.from.id }).lean();
  if (!user?.isLoggedIn) {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('Please login first. Send /start.');
    } else {
      await ctx.reply(LOGIN_PROMPT);
    }
    return;
  }

  return next();
}
