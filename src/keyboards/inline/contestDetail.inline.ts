import { Markup } from 'telegraf';

export const NOTIFY_WINNERS_ACTION_PREFIX = 'notify_winners:';
export const REMOVE_CONTEST_ACTION_PREFIX = 'remove_contest:';

export function contestDetailKeyboard(
  contestId: string,
  options: { canNotify: boolean; canRemove: boolean },
) {
  const rows = [];

  if (options.canNotify) {
    rows.push([
      Markup.button.callback(
        "📢 G'oliblarga xabar yuborish",
        `${NOTIFY_WINNERS_ACTION_PREFIX}${contestId}`,
      ),
    ]);
  }

  if (options.canRemove) {
    rows.push([
      Markup.button.callback("🗑 Konkursni o'chirish", `${REMOVE_CONTEST_ACTION_PREFIX}${contestId}`),
    ]);
  }

  return rows.length > 0 ? Markup.inlineKeyboard(rows) : undefined;
}
