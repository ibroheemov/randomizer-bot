import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context.types';
import { MAIN_MENU_BUTTONS } from '../keyboards/mainMenu.keyboard';
import { SUPPORT_MESSAGE } from '../config/constants';
import { requireRole } from '../services/user.service';

export function registerSupportHandler(bot: Telegraf<BotContext>): void {
  bot.hears(MAIN_MENU_BUTTONS.SUPPORT, async (ctx) => {
    const user = await requireRole(ctx, 'admin');
    if (!user) return;
    await ctx.reply(SUPPORT_MESSAGE);
  });
}
