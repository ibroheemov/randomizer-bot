import { Markup } from 'telegraf';

export const ADD_CHANNEL_TYPE_BUTTONS = {
  ADD_CHANNEL: 'Add channel',
  ADD_GROUP: 'Add group',
} as const;

export const addChannelTypeKeyboard = Markup.keyboard([
  [ADD_CHANNEL_TYPE_BUTTONS.ADD_CHANNEL, ADD_CHANNEL_TYPE_BUTTONS.ADD_GROUP],
])
  .resize()
  .persistent();
