import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context.types';
import { requireRole } from '../services/user.service';
import { BROADCAST_WIZARD_ID } from '../scenes/broadcast.wizard';
import { MAIN_MENU_BUTTONS } from '../keyboards/mainMenu.keyboard';

export function registerBroadcastHandlers(bot: Telegraf<BotContext>): void {
  bot.hears(MAIN_MENU_BUTTONS.NOTIFY_USERS, async (ctx) => {
    const user = await requireRole(ctx, 'superadmin');
    if (!user) return;
    await ctx.scene.enter(BROADCAST_WIZARD_ID);
  });
}
