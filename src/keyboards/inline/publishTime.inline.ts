import { Markup } from 'telegraf';
import { withCancelRow } from './cancel.inline';

export const PUBLISH_NOW_ACTION = 'publish_now';
export const PUBLISH_SCHEDULED_ACTION = 'publish_scheduled';

export const publishTimeKeyboard = withCancelRow([
  [
    Markup.button.callback('Right now', PUBLISH_NOW_ACTION),
    Markup.button.callback('Schedule a publication', PUBLISH_SCHEDULED_ACTION),
  ],
]);
