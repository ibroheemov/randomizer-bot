import { Markup } from 'telegraf';
import { UserDocument } from '../../models/User.model';

export const REMOVE_ADMIN_ACTION_PREFIX = 'remove_admin:';

function adminLabel(admin: UserDocument): string {
  return admin.username ? `@${admin.username}` : `ID ${admin.telegramId}`;
}

export function adminListMessage(admins: UserDocument[]): string {
  if (admins.length === 0) return "Hozircha adminlar yo'q.";
  return "👤 Adminlar (o'chirish uchun bosing):";
}

export function adminListKeyboard(admins: UserDocument[]) {
  const rows = admins.map((admin) => [
    Markup.button.callback(`🗑 ${adminLabel(admin)}`, `${REMOVE_ADMIN_ACTION_PREFIX}${admin.telegramId}`),
  ]);
  return rows.length > 0 ? Markup.inlineKeyboard(rows) : undefined;
}
