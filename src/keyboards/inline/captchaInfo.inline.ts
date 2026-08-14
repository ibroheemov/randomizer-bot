import { Markup } from 'telegraf';

export const TOGGLE_CAPTCHA_ACTION = 'toggle_captcha';
export const CAPTCHA_INFO_BACK_ACTION = 'captcha_info_back';

export const CAPTCHA_INFO_TEXT = [
  'ℹ️ CAPTCHA nima?',
  '',
  "CAPTCHA har bir foydalanuvchidan vizual topshiriqni yechishni talab qiladi. Ishtirok etish tugmasi bosilganda, foydalanuvchi botimizga yo'naltiriladi va u yerda rasmda ko'rsatilgan raqamlarni kiritishi so'raladi. To'g'ri raqamlar kiritilgandan so'ng, foydalanuvchi konkurs ishtirokchisiga aylanadi.",
  "Bu funksiya konkursni botlar orqali suiiste'mol qilinishidan himoya qilish uchun mo'ljallangan.",
].join('\n');

export function captchaInfoKeyboard(useCaptcha: boolean) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        useCaptcha ? 'Captchani o\'chirish' : 'Captchani yoqish',
        TOGGLE_CAPTCHA_ACTION,
      ),
    ],
    [Markup.button.callback('⬅️ Orqaga', CAPTCHA_INFO_BACK_ACTION)],
  ]);
}
