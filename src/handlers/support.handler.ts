import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context.types';
import { MAIN_MENU_BUTTONS } from '../keyboards/mainMenu.keyboard';
import { SUPPORT_MESSAGE } from '../config/constants';

export function registerSupportHandler(bot: Telegraf<BotContext>): void {
  bot.hears(MAIN_MENU_BUTTONS.SUPPORT, async (ctx) => {
    await ctx.reply(SUPPORT_MESSAGE);
  });
}
