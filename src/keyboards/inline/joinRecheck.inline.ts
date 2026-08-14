import { Markup } from 'telegraf';

export const RECHECK_JOIN_ACTION_PREFIX = 'recheck_join:';

export function joinRecheckKeyboard(contestId: string) {
  return Markup.inlineKeyboard([
    Markup.button.callback("✅ Obuna bo'ldim", `${RECHECK_JOIN_ACTION_PREFIX}${contestId}`),
  ]);
}
