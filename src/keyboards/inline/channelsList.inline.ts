import { Markup } from 'telegraf';
import { ChannelDocument } from '../../models/Channel.model';
import { withCancelRow } from './cancel.inline';

export const ADD_NEW_CHANNEL_ACTION = 'add_new_channel';
export const CHANNEL_INFO_ACTION_PREFIX = 'channel_info:';
export const SELECT_PUBLISH_CHANNEL_ACTION_PREFIX = 'select_publish_channel:';
export const CONTEST_WITHOUT_SUBSCRIPTION_ACTION = 'contest_without_subscription';
export const REQUIRED_CHANNELS_DONE_ACTION = 'required_channels_done';

export function myChannelsKeyboard(channels: ChannelDocument[]) {
  const rows = channels.map((channel) => [
    Markup.button.callback(
      `${channel.type === 'channel' ? '📢' : '👥'} ${channel.title}`,
      `${CHANNEL_INFO_ACTION_PREFIX}${channel.ownerTelegramId}:${channel.chatId}`,
    ),
  ]);

  return Markup.inlineKeyboard([
    [Markup.button.callback("➕ Yangi kanal qo'shish", ADD_NEW_CHANNEL_ACTION)],
    ...rows,
  ]);
}

export function publishChannelSelectKeyboard(channels: ChannelDocument[]) {
  const rows = channels.map((channel) => [
    Markup.button.callback(
      `${channel.type === 'channel' ? '📢' : '👥'} ${channel.title}`,
      `${SELECT_PUBLISH_CHANNEL_ACTION_PREFIX}${channel.chatId}`,
    ),
  ]);

  return withCancelRow(rows);
}

export const requiredChannelsPromptKeyboard = withCancelRow([
  [Markup.button.callback('Obunasiz konkurs', CONTEST_WITHOUT_SUBSCRIPTION_ACTION)],
]);

export const requiredChannelsAddedKeyboard = withCancelRow([
  [Markup.button.callback('Yetarli, davom etamiz', REQUIRED_CHANNELS_DONE_ACTION)],
]);

export function requiredChannelsKeyboardFor(addedCount: number) {
  return addedCount > 0 ? requiredChannelsAddedKeyboard : requiredChannelsPromptKeyboard;
}
