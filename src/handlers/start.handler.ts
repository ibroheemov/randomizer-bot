import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context.types';
import { User } from '../models/User.model';
import { MAIN_MENU_GREETING, mainMenuKeyboard } from '../keyboards/mainMenu.keyboard';

const LOGIN_PROMPT = 'Konkurs yaratish uchun tizimga kiring!';

export async function sendMainMenuOrLoginPrompt(ctx: BotContext): Promise<void> {
  if (!ctx.from) return;

  const user = await User.findOne({ telegramId: ctx.from.id }).lean();
  if (user?.isLoggedIn) {
    await ctx.reply(MAIN_MENU_GREETING, mainMenuKeyboard);
  } else {
    await ctx.reply(LOGIN_PROMPT);
  }
}

export function registerStartHandler(bot: Telegraf<BotContext>): void {
  bot.start(async (ctx) => {
    if (ctx.scene.current) await ctx.scene.leave();
    await sendMainMenuOrLoginPrompt(ctx);
  });
}
