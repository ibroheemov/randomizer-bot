import { Markup } from 'telegraf';

export const MAIN_MENU_GREETING =
  'Hi! 😉\nWant to host a contest on your channel or in the chat? I can easily help you with that 👌';

export const MAIN_MENU_BUTTONS = {
  CREATE_CONTEST: 'Create contest',
  MY_CONTESTS: 'My contests',
  MY_CHANNELS: 'My channels',
  SUPPORT: 'Support',
} as const;

export const mainMenuKeyboard = Markup.keyboard([
  [MAIN_MENU_BUTTONS.CREATE_CONTEST, MAIN_MENU_BUTTONS.MY_CONTESTS],
  [MAIN_MENU_BUTTONS.MY_CHANNELS, MAIN_MENU_BUTTONS.SUPPORT],
])
  .resize()
  .persistent();
