import { Markup } from 'telegraf';
import { withCancelRow } from './cancel.inline';

export const COMPLETE_BY_TIME_ACTION = 'complete_by_time';
export const COMPLETE_BY_PARTICIPANTS_ACTION = 'complete_by_participants';

export const completionTypeKeyboard = withCancelRow([
  [
    Markup.button.callback("Vaqt bo'yicha", COMPLETE_BY_TIME_ACTION),
    Markup.button.callback("Ishtirokchilar soni bo'yicha", COMPLETE_BY_PARTICIPANTS_ACTION),
  ],
]);
