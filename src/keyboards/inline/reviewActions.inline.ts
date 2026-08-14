import { Markup } from 'telegraf';
import { toggleLabel } from '../../utils/text';
import { CANCEL_ACTION } from './cancel.inline';

export const OPEN_CAPTCHA_INFO_ACTION = 'open_captcha_info';
export const SAVE_CONTEST_ACTION = 'save_contest';

export function reviewActionsKeyboard(useCaptcha: boolean) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(toggleLabel('Captcha ishlatish', useCaptcha), OPEN_CAPTCHA_INFO_ACTION)],
    [
      Markup.button.callback('Konkursni saqlash', SAVE_CONTEST_ACTION),
      Markup.button.callback('Bekor qilish', CANCEL_ACTION),
    ],
  ]);
}
