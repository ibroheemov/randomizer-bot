import { Markup } from 'telegraf';
import { withCancelRow } from './cancel.inline';

export const COMPLETE_BY_TIME_ACTION = 'complete_by_time';
export const COMPLETE_BY_PARTICIPANTS_ACTION = 'complete_by_participants';

export const completionTypeKeyboard = withCancelRow([
  [
    Markup.button.callback('By time', COMPLETE_BY_TIME_ACTION),
    Markup.button.callback('By number of participants', COMPLETE_BY_PARTICIPANTS_ACTION),
  ],
]);
