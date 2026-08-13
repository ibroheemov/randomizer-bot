import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context.types';
import { User } from '../models/User.model';
import { requireRole } from '../services/user.service';
import { env } from '../config/env';

export function registerAdminManagementHandlers(bot: Telegraf<BotContext>): void {
  bot.hears(/^\/new_admin_(\d+)$/, async (ctx) => {
    const user = await requireRole(ctx, 'superadmin');
    if (!user) return;

    const targetId = Number(ctx.match[1]);
    if (targetId === env.SUPERADMIN_TELEGRAM_ID) {
      await ctx.reply('Bu foydalanuvchi allaqachon superadmin.');
      return;
    }

    await User.findOneAndUpdate(
      { telegramId: targetId },
      { $setOnInsert: { telegramId: targetId }, $set: { role: 'admin' } },
      { upsert: true },
    );

    await ctx.reply(`✅ ${targetId} endi admin.`);
    try {
      await ctx.telegram.sendMessage(
        targetId,
        "🎉 Sizga admin huquqi berildi. Menyuni ochish uchun /start deb yozing.",
      );
    } catch {
      // Target hasn't started a chat with the bot yet — nothing to notify.
    }
  });

  bot.hears(/^\/delete_admin_(\d+)$/, async (ctx) => {
    const user = await requireRole(ctx, 'superadmin');
    if (!user) return;

    const targetId = Number(ctx.match[1]);
    const target = await User.findOne({ telegramId: targetId });
    if (!target || target.role !== 'admin') {
      await ctx.reply('Bu foydalanuvchi admin emas.');
      return;
    }

    target.role = 'user';
    await target.save();
    await ctx.reply(`✅ ${targetId} admin huquqidan mahrum qilindi.`);
  });

  bot.hears('/admins', async (ctx) => {
    const user = await requireRole(ctx, 'superadmin');
    if (!user) return;

    const admins = await User.find({ role: 'admin' }).sort({ createdAt: 1 });
    if (admins.length === 0) {
      await ctx.reply("Hozircha adminlar yo'q.");
      return;
    }

    const lines = admins.map(
      (a) => `- ID ${a.telegramId}${a.username ? ` (@${a.username})` : ''}`,
    );
    await ctx.reply(['👥 Adminlar:', ...lines].join('\n'));
  });
}
