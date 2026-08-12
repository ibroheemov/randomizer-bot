import { Markup } from 'telegraf';
import { toggleLabel } from '../../utils/text';
import { CANCEL_ACTION } from './cancel.inline';

export const TOGGLE_CAPTCHA_ACTION = 'toggle_captcha';
export const TOGGLE_BOOST_ACTION = 'toggle_boost';
export const SAVE_CONTEST_ACTION = 'save_contest';

export function reviewActionsKeyboard(useCaptcha: boolean, boostForLuck: boolean) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(toggleLabel('Captcha ishlatish', useCaptcha), TOGGLE_CAPTCHA_ACTION),
      Markup.button.callback(toggleLabel('Omad uchun boost', boostForLuck), TOGGLE_BOOST_ACTION),
    ],
    [
      Markup.button.callback('Konkursni saqlash', SAVE_CONTEST_ACTION),
      Markup.button.callback('Bekor qilish', CANCEL_ACTION),
    ],
  ]);
}
