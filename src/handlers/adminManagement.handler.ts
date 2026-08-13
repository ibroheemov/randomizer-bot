import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context.types';
import { User } from '../models/User.model';
import { requireRole } from '../services/user.service';
import { env } from '../config/env';
import { MAIN_MENU_BUTTONS } from '../keyboards/mainMenu.keyboard';
import {
  REMOVE_ADMIN_ACTION_PREFIX,
  adminListKeyboard,
  adminListMessage,
} from '../keyboards/inline/adminList.inline';
import { adminInviteDeepLink, createAdminInvite } from '../services/adminInvite.service';

async function replyAdminList(ctx: BotContext): Promise<void> {
  const admins = await User.find({ role: 'admin' }).sort({ createdAt: 1 });
  await ctx.reply(adminListMessage(admins), adminListKeyboard(admins));
}

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

  bot.hears(MAIN_MENU_BUTTONS.ADMINS, async (ctx) => {
    const user = await requireRole(ctx, 'superadmin');
    if (!user) return;
    await replyAdminList(ctx);
  });

  bot.hears(MAIN_MENU_BUTTONS.ADD_ADMIN, async (ctx) => {
    const user = await requireRole(ctx, 'superadmin');
    if (!user) return;

    const token = await createAdminInvite(user.telegramId);
    const me = await ctx.telegram.getMe();
    const link = adminInviteDeepLink(me.username, token);

    await ctx.reply(
      `Ushbu havolani admin qilmoqchi bo'lgan odamga yuboring:\n\n${link}\n\n⏳ Havola 24 soat amal qiladi va faqat bir marta ishlatiladi.`,
    );
  });

  bot.action(new RegExp(`^${REMOVE_ADMIN_ACTION_PREFIX}(\\d+)$`), async (ctx) => {
    const user = await requireRole(ctx, 'superadmin');
    if (!user) {
      await ctx.answerCbQuery();
      return;
    }

    const targetId = Number(ctx.match[1]);
    const target = await User.findOne({ telegramId: targetId, role: 'admin' });
    if (!target) {
      await ctx.answerCbQuery('Bu foydalanuvchi allaqachon admin emas.');
      return;
    }

    target.role = 'user';
    await target.save();
    await ctx.answerCbQuery(`${targetId} admin huquqidan mahrum qilindi.`);

    const admins = await User.find({ role: 'admin' }).sort({ createdAt: 1 });
    await ctx.editMessageText(adminListMessage(admins), adminListKeyboard(admins));
  });
}
