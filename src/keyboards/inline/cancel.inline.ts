import { Markup } from 'telegraf';

export const CANCEL_ACTION = 'wizard_cancel';

export const cancelInlineKeyboard = Markup.inlineKeyboard([
  Markup.button.callback('Cancel', CANCEL_ACTION),
]);

export function withCancelRow(rows: ReturnType<typeof Markup.button.callback>[][]) {
  return Markup.inlineKeyboard([...rows, [Markup.button.callback('Cancel', CANCEL_ACTION)]]);
}
