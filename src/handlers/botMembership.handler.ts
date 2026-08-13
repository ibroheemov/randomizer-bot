import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context.types';
import { User } from '../models/User.model';
import { ChannelType } from '../models/Channel.model';
import { upsertChannel } from '../services/channel.service';
import { roleAtLeast } from '../services/user.service';

const REGISTERABLE_CHAT_TYPES: ChannelType[] = ['channel', 'group', 'supergroup'];

/**
 * Auto-registers a channel/group the moment the bot is promoted to admin there, so admins
 * don't have to separately send @channelname afterward. Only registers it if whoever did the
 * promoting is already an admin/superadmin in our system — a stranger promoting the bot
 * elsewhere doesn't get a free channel entry.
 *
 * Also tracks block/unblock: Telegram reports a user blocking the bot as the bot's own
 * "my_chat_member" status in that private chat flipping to "kicked" (and back to "member"
 * on unblock/restart) — this is the reliable, proactive way to know, rather than only
 * finding out reactively the next time a message send happens to fail.
 */
export function registerBotMembershipHandler(bot: Telegraf<BotContext>): void {
  bot.on('my_chat_member', async (ctx) => {
    const update = ctx.myChatMember;
    const chat = update.chat;
    const newStatus = update.new_chat_member.status;
    const oldStatus = update.old_chat_member.status;

    if (chat.type === 'private') {
      const isBlockedNow = newStatus === 'kicked';
      const wasBlockedBefore = oldStatus === 'kicked';
      if (isBlockedNow !== wasBlockedBefore) {
        await User.findOneAndUpdate(
          { telegramId: chat.id },
          isBlockedNow ? { $set: { blockedAt: new Date() } } : { $unset: { blockedAt: 1 } },
        );
      }
      return;
    }

    // Only react to a fresh promotion to admin, not e.g. a permissions tweak while already admin.
    if (newStatus !== 'administrator' || oldStatus === 'administrator') return;
    if (!REGISTERABLE_CHAT_TYPES.includes(chat.type as ChannelType)) return;

    const promoter = await User.findOne({ telegramId: update.from.id });
    if (!promoter || !roleAtLeast(promoter.role, 'admin')) return;

    const title = 'title' in chat ? chat.title : '';
    const username = 'username' in chat ? chat.username : undefined;

    await upsertChannel({
      ownerTelegramId: promoter.telegramId,
      chatId: chat.id,
      type: chat.type as ChannelType,
      title,
      username,
    });

    try {
      await ctx.telegram.sendMessage(promoter.telegramId, `✅ "${title}" qo'shildi.`);
    } catch {
      // Promoter hasn't opened a private chat with the bot yet — nothing to notify.
    }
  });
}
