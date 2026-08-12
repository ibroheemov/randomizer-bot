import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context.types';
import { MAIN_MENU_BUTTONS } from '../keyboards/mainMenu.keyboard';
import { CREATE_CONTEST_WIZARD_ID } from '../scenes/createContest.wizard';

export function registerMainMenuHandlers(bot: Telegraf<BotContext>): void {
  bot.hears(MAIN_MENU_BUTTONS.CREATE_CONTEST, async (ctx) => {
    await ctx.scene.enter(CREATE_CONTEST_WIZARD_ID);
  });
}
