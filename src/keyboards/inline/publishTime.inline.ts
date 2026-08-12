import { Markup } from 'telegraf';
import { withCancelRow } from './cancel.inline';

export const PUBLISH_NOW_ACTION = 'publish_now';
export const PUBLISH_SCHEDULED_ACTION = 'publish_scheduled';

export const publishTimeKeyboard = withCancelRow([
  [
    Markup.button.callback('Hozir', PUBLISH_NOW_ACTION),
    Markup.button.callback('Nashrni rejalashtirish', PUBLISH_SCHEDULED_ACTION),
  ],
]);
