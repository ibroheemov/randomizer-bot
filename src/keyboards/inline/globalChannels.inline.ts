import { Markup } from 'telegraf';
import { GlobalRequiredChannelDocument } from '../../models/GlobalRequiredChannel.model';

export const ADD_GLOBAL_CHANNEL_ACTION = 'add_global_channel';
export const TOGGLE_GLOBAL_CHANNELS_ACTION = 'toggle_global_channels';
export const REMOVE_GLOBAL_CHANNEL_ACTION_PREFIX = 'remove_global_channel:';

export function globalChannelsMessage(enabled: boolean, channels: GlobalRequiredChannelDocument[]): string {
  const status = enabled ? '✅ Yoqilgan' : '❌ O\'chirilgan';
  const list =
    channels.length > 0
      ? channels.map((c) => `${c.type === 'channel' ? '📢' : '👥'} ${c.title}`).join('\n')
      : "Hozircha kanal qo'shilmagan.";

  return (
    "🌐 Majburiy kanallar\n\n" +
    "Bu yerga qo'shilgan kanallarga BARCHA konkurslarning barcha ishtirokchilari obuna bo'lishi shart bo'ladi — konkursning o'z sozlamalaridan qat'i nazar.\n\n" +
    `Holat: ${status}\n\n${list}`
  );
}

export function globalChannelsKeyboard(enabled: boolean, channels: GlobalRequiredChannelDocument[]) {
  const removeRows = channels.map((channel) => [
    Markup.button.callback(
      `🗑 ${channel.title}`,
      `${REMOVE_GLOBAL_CHANNEL_ACTION_PREFIX}${channel.chatId}`,
    ),
  ]);

  return Markup.inlineKeyboard([
    [Markup.button.callback(enabled ? "❌ O'chirish" : '✅ Yoqish', TOGGLE_GLOBAL_CHANNELS_ACTION)],
    [Markup.button.callback("➕ Kanal qo'shish", ADD_GLOBAL_CHANNEL_ACTION)],
    ...removeRows,
  ]);
}
