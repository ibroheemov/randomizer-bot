import { User, UserDocument } from '../models/User.model';
import { env } from '../config/env';
import { Role } from '../types/role.types';
import { BotContext } from '../types/context.types';
import { ACCESS_DENIED_MESSAGE, USER_WELCOME_MESSAGE } from '../config/constants';
import { MAIN_MENU_GREETING, mainMenuKeyboard } from '../keyboards/mainMenu.keyboard';

const ROLE_RANK: Record<Role, number> = { user: 0, admin: 1, superadmin: 2 };

export function roleAtLeast(role: Role, min: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

interface TelegramFrom {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

/** Upserts the User record for this Telegram id, self-healing the configured superadmin's role. */
export async function getOrCreateUser(from: TelegramFrom): Promise<UserDocument> {
  const existing = await User.findOne({ telegramId: from.id });

  if (existing) {
    existing.username = from.username;
    existing.firstName = from.first_name;
    existing.lastName = from.last_name;
    if (from.id === env.SUPERADMIN_TELEGRAM_ID && existing.role !== 'superadmin') {
      existing.role = 'superadmin';
    }
    await existing.save();
    return existing;
  }

  const role: Role = from.id === env.SUPERADMIN_TELEGRAM_ID ? 'superadmin' : 'user';
  return User.create({
    telegramId: from.id,
    username: from.username,
    firstName: from.first_name,
    lastName: from.last_name,
    role,
  });
}

export async function sendStartMessage(ctx: BotContext): Promise<void> {
  if (!ctx.from) return;

  try {
    const user = await getOrCreateUser(ctx.from);
    if (roleAtLeast(user.role, 'admin')) {
      await ctx.reply(MAIN_MENU_GREETING, mainMenuKeyboard(user.role));
    } else {
      await ctx.reply(USER_WELCOME_MESSAGE);
    }
  } catch (err) {
    console.error('[user.service] sendStartMessage failed', err);
    await ctx.reply("❌ Nimadir xato ketdi. Iltimos, birozdan so'ng qaytadan urinib ko'ring.");
  }
}

/** Fetches/creates the user, checks their role, and replies with a denial if they fall short. */
export async function requireRole(ctx: BotContext, min: Role): Promise<UserDocument | null> {
  if (!ctx.from) return null;

  try {
    const user = await getOrCreateUser(ctx.from);
    if (!roleAtLeast(user.role, min)) {
      await ctx.reply(ACCESS_DENIED_MESSAGE);
      return null;
    }
    return user;
  } catch (err) {
    console.error('[user.service] requireRole failed', err);
    await ctx.reply("❌ Nimadir xato ketdi. Iltimos, birozdan so'ng qaytadan urinib ko'ring.");
    return null;
  }
}
