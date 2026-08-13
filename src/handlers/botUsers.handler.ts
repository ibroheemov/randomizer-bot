import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context.types';
import { MAIN_MENU_BUTTONS } from '../keyboards/mainMenu.keyboard';
import { requireRole } from '../services/user.service';
import { User } from '../models/User.model';

export function registerBotUsersHandler(bot: Telegraf<BotContext>): void {
  bot.hears(MAIN_MENU_BUTTONS.BOT_USERS, async (ctx) => {
    const user = await requireRole(ctx, 'superadmin');
    if (!user) return;

    const [total, blocked] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ blockedAt: { $exists: true } }),
    ]);
    const active = total - blocked;

    await ctx.reply(
      ['👥 Bot foydalanuvchilari', '', `Jami: ${total}`, `Faol: ${active}`, `Bloklagan: ${blocked}`].join('\n'),
    );
  });
}
