import { Markup, Scenes } from 'telegraf';
import { BotContext } from '../types/context.types';
import { CaptchaJoinWizardState } from '../types/session.types';
import { generateCaptcha } from '../services/captcha.service';
import { joinContest, replyJoinResult } from '../services/participant.service';
import { CANCEL_ACTION } from '../keyboards/inline/cancel.inline';
import { sendStartMessage } from '../services/user.service';

export const CAPTCHA_JOIN_WIZARD_ID = 'captchaJoinWizard';

const REGENERATE_ACTION = 'captcha_regenerate';
const MAX_ATTEMPTS = 3;

function getState(ctx: BotContext): CaptchaJoinWizardState {
  return ctx.wizard.state as CaptchaJoinWizardState;
}

function captchaKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔄 Yangi rasm', REGENERATE_ACTION)],
    [Markup.button.callback('Bekor qilish', CANCEL_ACTION)],
  ]);
}

async function sendCaptchaChallenge(ctx: BotContext, promptText: string): Promise<void> {
  const state = getState(ctx);
  const { imageBuffer, answer } = await generateCaptcha();
  state.expectedAnswer = answer;

  await ctx.replyWithPhoto({ source: imageBuffer }, { caption: promptText, ...captchaKeyboard() });
}

export const captchaJoinWizard = new Scenes.WizardScene<BotContext>(
  CAPTCHA_JOIN_WIZARD_ID,
  // Step 0 — entry: send the first challenge.
  async (ctx) => {
    const state = getState(ctx);
    state.attemptsLeft = MAX_ATTEMPTS;
    await sendCaptchaChallenge(ctx, "Rasmda ko'rsatilgan raqamlarni kiriting.");
    return ctx.wizard.next();
  },
  // Step 1 — capture the answer, or a "new image" tap.
  async (ctx) => {
    const state = getState(ctx);

    if (ctx.callbackQuery && 'data' in ctx.callbackQuery && ctx.callbackQuery.data === REGENERATE_ACTION) {
      await ctx.answerCbQuery();
      await sendCaptchaChallenge(ctx, "Yangi rasm. Rasmda ko'rsatilgan raqamlarni kiriting.");
      return;
    }

    if (!ctx.message || !('text' in ctx.message) || !ctx.from) return;

    const submitted = ctx.message.text.trim();
    if (submitted === state.expectedAnswer) {
      const result = await joinContest(ctx.telegram, state.contestId, {
        telegramId: ctx.from.id,
        username: ctx.from.username,
      });
      await replyJoinResult(ctx, result);
      return ctx.scene.leave();
    }

    state.attemptsLeft -= 1;
    if (state.attemptsLeft <= 0) {
      await ctx.reply(
        "❌ Juda ko'p noto'g'ri urinish. Qaytadan urinish uchun konkurs postidagi tugmani qaytadan bosing.",
      );
      return ctx.scene.leave();
    }

    await sendCaptchaChallenge(
      ctx,
      `❌ Noto'g'ri. Qayta urinib ko'ring (qolgan urinishlar: ${state.attemptsLeft}).`,
    );
  },
);

captchaJoinWizard.action(CANCEL_ACTION, async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Bekor qilindi.');
  await sendStartMessage(ctx);
  return ctx.scene.leave();
});

captchaJoinWizard.command('start', async (ctx) => {
  await ctx.scene.leave();
  await sendStartMessage(ctx);
});
