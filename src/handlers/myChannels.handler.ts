import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context.types';
import { MAIN_MENU_BUTTONS } from '../keyboards/mainMenu.keyboard';
import { ADD_CHANNEL_TYPE_BUTTONS, addChannelTypeKeyboard } from '../keyboards/addChannelType.keyboard';
import {
  ADD_NEW_CHANNEL_ACTION,
  CHANNEL_INFO_ACTION_PREFIX,
  myChannelsKeyboard,
} from '../keyboards/inline/channelsList.inline';
import { listVisibleChannels } from '../services/channel.service';
import { ADD_CHANNEL_WIZARD_ID } from '../scenes/addChannel.wizard';
import { Channel } from '../models/Channel.model';
import { requireRole } from '../services/user.service';

const ADD_CHANNEL_INSTRUCTIONS =
  "Yo'riqnoma\n\nBotni (@RandomXpro_bot) kanalingiz yoki chatingizga xabar joylash huquqiga ega administrator sifatida qo'shing. Keyin menga kanalni @kanalnomi formatida yuboring. Agar shaxsiy (yopiq) kanal qo'shmoqchi bo'lsangiz, undan xabarni forward qiling yoki shu kanaldagi istalgan xabar havolasini nusxalab yuboring.\n\n⚠️ Botdan guruhda (chatda) foydalanmoqchi bo'lsangiz, unga xabar joylash huquqini berganingizga ishonch hosil qiling.\n\n/start - bosh menyu uchun";

export function registerMyChannelsHandlers(bot: Telegraf<BotContext>): void {
  bot.hears(MAIN_MENU_BUTTONS.MY_CHANNELS, async (ctx) => {
    const user = await requireRole(ctx, 'admin');
    if (!user) return;
    const channels = await listVisibleChannels(user);
    await ctx.reply("ℹ️ Siz qo'shgan kanallar:", myChannelsKeyboard(channels));
  });

  bot.action(ADD_NEW_CHANNEL_ACTION, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireRole(ctx, 'admin');
    if (!user) return;
    await ctx.reply(ADD_CHANNEL_INSTRUCTIONS, addChannelTypeKeyboard);
  });

  bot.action(new RegExp(`^${CHANNEL_INFO_ACTION_PREFIX}(-?\\d+):(-?\\d+)$`), async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireRole(ctx, 'admin');
    if (!user) return;

    const ownerTelegramId = Number(ctx.match[1]);
    const chatId = Number(ctx.match[2]);
    if (ownerTelegramId !== user.telegramId && user.role !== 'superadmin') return;

    const channel = await Channel.findOne({ chatId, ownerTelegramId });
    if (!channel) return;
    await ctx.reply(
      `${channel.type === 'channel' ? '📢' : '👥'} ${channel.title}${
        channel.username ? ` (@${channel.username})` : ''
      }`,
    );
  });

  bot.hears(ADD_CHANNEL_TYPE_BUTTONS.ADD_CHANNEL, async (ctx) => {
    const user = await requireRole(ctx, 'admin');
    if (!user) return;
    await ctx.scene.enter(ADD_CHANNEL_WIZARD_ID, { kind: 'channel' });
  });

  bot.hears(ADD_CHANNEL_TYPE_BUTTONS.ADD_GROUP, async (ctx) => {
    const user = await requireRole(ctx, 'admin');
    if (!user) return;
    await ctx.scene.enter(ADD_CHANNEL_WIZARD_ID, { kind: 'group' });
  });
}
