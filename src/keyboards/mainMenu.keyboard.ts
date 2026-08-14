import { Markup } from 'telegraf';
import { Role } from '../types/role.types';

export const MAIN_MENU_GREETING =
  "Salom! 😉\nKanalingizda yoki chatingizda konkurs o'tkazmoqchimisiz? Men sizga bunda osongina yordam bera olaman 👌";

export const MAIN_MENU_BUTTONS = {
  CREATE_CONTEST: 'Konkurs yaratish 🎲',
  MY_CONTESTS: 'Konkurslarim 🗃',
  MY_CHANNELS: 'Kanallarim 📂',
  SUPPORT: 'Yordam 💬',
  NOTIFY_USERS: 'Xabar Yuborish 📢',
  BOT_USERS: 'Foydalanuvchilar 👥',
  ADMINS: 'Adminlar 👤',
  ADD_ADMIN: "Admin qo'shish ➕",
  GLOBAL_CHANNELS: 'Majburiy kanallar ⚙️',
} as const;

export function mainMenuKeyboard(role: Role) {
  const rows: string[][] = [
    [MAIN_MENU_BUTTONS.CREATE_CONTEST, MAIN_MENU_BUTTONS.MY_CONTESTS],
    [MAIN_MENU_BUTTONS.MY_CHANNELS, MAIN_MENU_BUTTONS.SUPPORT],
  ];

  if (role === 'superadmin') {
    rows.push([MAIN_MENU_BUTTONS.NOTIFY_USERS, MAIN_MENU_BUTTONS.BOT_USERS]);
    rows.push([MAIN_MENU_BUTTONS.ADMINS, MAIN_MENU_BUTTONS.ADD_ADMIN]);
    rows.push([MAIN_MENU_BUTTONS.GLOBAL_CHANNELS]);
  }

  return Markup.keyboard(rows).resize().persistent();
}
