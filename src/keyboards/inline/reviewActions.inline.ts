import { Markup } from 'telegraf';
import { toggleLabel } from '../../utils/text';
import { CANCEL_ACTION } from './cancel.inline';

export const TOGGLE_CAPTCHA_ACTION = 'toggle_captcha';
export const TOGGLE_BOOST_ACTION = 'toggle_boost';
export const SAVE_CONTEST_ACTION = 'save_contest';

export function reviewActionsKeyboard(useCaptcha: boolean, boostForLuck: boolean) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(toggleLabel('Use captcha', useCaptcha), TOGGLE_CAPTCHA_ACTION),
      Markup.button.callback(toggleLabel('Boost for luck', boostForLuck), TOGGLE_BOOST_ACTION),
    ],
    [
      Markup.button.callback('Save contest', SAVE_CONTEST_ACTION),
      Markup.button.callback('Cancel', CANCEL_ACTION),
    ],
  ]);
}
