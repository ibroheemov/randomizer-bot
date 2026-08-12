import { Markup } from 'telegraf';

export const ADD_CHANNEL_TYPE_BUTTONS = {
  ADD_CHANNEL: "Kanal qo'shish",
  ADD_GROUP: "Guruh qo'shish",
} as const;

export const addChannelTypeKeyboard = Markup.keyboard([
  [ADD_CHANNEL_TYPE_BUTTONS.ADD_CHANNEL, ADD_CHANNEL_TYPE_BUTTONS.ADD_GROUP],
])
  .resize()
  .persistent();
