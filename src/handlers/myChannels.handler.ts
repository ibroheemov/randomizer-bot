import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context.types';
import { MAIN_MENU_BUTTONS } from '../keyboards/mainMenu.keyboard';
import { ADD_CHANNEL_TYPE_BUTTONS, addChannelTypeKeyboard } from '../keyboards/addChannelType.keyboard';
import {
  ADD_NEW_CHANNEL_ACTION,
  CHANNEL_INFO_ACTION_PREFIX,
  myChannelsKeyboard,
} from '../keyboards/inline/channelsList.inline';
import { listUserChannels } from '../services/channel.service';
import { ADD_CHANNEL_WIZARD_ID } from '../scenes/addChannel.wizard';
import { Channel } from '../models/Channel.model';

const ADD_CHANNEL_INSTRUCTIONS =
  'Instructions\n\nAdd the bot (@BestRandom_bot) to your channel or chat as an administrator with posting permissions. Then send me the channel in the @channelname format. If you want to add a private channel, forward a message from it, or copy and send the bot a link to any message from the private channel.\n\n⚠️ If you want to use the bot in a group (chat), be sure to grant it posting permissions.\n\n/start - for the main menu';

export function registerMyChannelsHandlers(bot: Telegraf<BotContext>): void {
  bot.hears(MAIN_MENU_BUTTONS.MY_CHANNELS, async (ctx) => {
    if (!ctx.from) return;
    const channels = await listUserChannels(ctx.from.id);
    await ctx.reply("ℹ️ Channels you've added:", myChannelsKeyboard(channels));
  });

  bot.action(ADD_NEW_CHANNEL_ACTION, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(ADD_CHANNEL_INSTRUCTIONS, addChannelTypeKeyboard);
  });

  bot.action(new RegExp(`^${CHANNEL_INFO_ACTION_PREFIX}(-?\\d+)$`), async (ctx) => {
    await ctx.answerCbQuery();
    if (!ctx.from) return;
    const chatId = Number(ctx.match[1]);
    const channel = await Channel.findOne({ chatId, ownerTelegramId: ctx.from.id });
    if (!channel) return;
    await ctx.reply(
      `${channel.type === 'channel' ? '📢' : '👥'} ${channel.title}${
        channel.username ? ` (@${channel.username})` : ''
      }`,
    );
  });

  bot.hears(ADD_CHANNEL_TYPE_BUTTONS.ADD_CHANNEL, async (ctx) => {
    await ctx.scene.enter(ADD_CHANNEL_WIZARD_ID, { kind: 'channel' });
  });

  bot.hears(ADD_CHANNEL_TYPE_BUTTONS.ADD_GROUP, async (ctx) => {
    await ctx.scene.enter(ADD_CHANNEL_WIZARD_ID, { kind: 'group' });
  });
}
