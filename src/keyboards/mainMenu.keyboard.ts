import { Markup } from 'telegraf';

export const MAIN_MENU_GREETING =
  "Salom! 😉\nKanalingizda yoki chatingizda konkurs o'tkazmoqchimisiz? Men sizga bunda osongina yordam bera olaman 👌";

export const MAIN_MENU_BUTTONS = {
  CREATE_CONTEST: 'Konkurs yaratish',
  MY_CONTESTS: 'Konkurslarim',
  MY_CHANNELS: 'Kanallarim',
  SUPPORT: 'Yordam',
} as const;

export const mainMenuKeyboard = Markup.keyboard([
  [MAIN_MENU_BUTTONS.CREATE_CONTEST, MAIN_MENU_BUTTONS.MY_CONTESTS],
  [MAIN_MENU_BUTTONS.MY_CHANNELS, MAIN_MENU_BUTTONS.SUPPORT],
])
  .resize()
  .persistent();
