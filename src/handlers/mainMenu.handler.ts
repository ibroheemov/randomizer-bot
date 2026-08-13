import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context.types';
import { MAIN_MENU_BUTTONS } from '../keyboards/mainMenu.keyboard';
import { CREATE_CONTEST_WIZARD_ID } from '../scenes/createContest.wizard';
import { requireRole } from '../services/user.service';

export function registerMainMenuHandlers(bot: Telegraf<BotContext>): void {
  bot.hears(MAIN_MENU_BUTTONS.CREATE_CONTEST, async (ctx) => {
    const user = await requireRole(ctx, 'admin');
    if (!user) return;
    await ctx.scene.enter(CREATE_CONTEST_WIZARD_ID);
  });
}
