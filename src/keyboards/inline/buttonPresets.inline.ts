import { Markup } from 'telegraf';
import { BUTTON_TEXT_PRESETS } from '../../config/constants';
import { withCancelRow } from './cancel.inline';

export const PRESET_ACTION_PREFIX = 'btn_preset:';

export const buttonPresetsKeyboard = withCancelRow([
  BUTTON_TEXT_PRESETS.map((preset, index) =>
    Markup.button.callback(preset, `${PRESET_ACTION_PREFIX}${index}`),
  ),
]);
