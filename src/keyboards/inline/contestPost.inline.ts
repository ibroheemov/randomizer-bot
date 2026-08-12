import { Markup } from 'telegraf';
import { Types } from 'mongoose';

export const JOIN_CONTEST_ACTION_PREFIX = 'join_contest:';

export function contestPostKeyboard(contestId: Types.ObjectId | string, buttonText: string) {
  return Markup.inlineKeyboard([
    Markup.button.callback(buttonText, `${JOIN_CONTEST_ACTION_PREFIX}${contestId}`),
  ]);
}
