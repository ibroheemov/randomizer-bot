import { Markup, Scenes } from 'telegraf';
import { BotContext } from '../types/context.types';
import { CaptchaJoinWizardState } from '../types/session.types';
import { generateCaptcha } from '../services/captcha.service';
import { joinContest, replyJoinResult } from '../services/participant.service';
import { CANCEL_ACTION } from '../keyboards/inline/cancel.inline';
import { sendStartMessage } from '../services/user.service';
import { handleStartCommand } from '../handlers/start.handler';
import { CAPTCHA_JOIN_WIZARD_ID } from './wizardIds';

export { CAPTCHA_JOIN_WIZARD_ID };

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

/** Returns false if the image couldn't be generated/sent — never throws. */
async function sendCaptchaChallenge(ctx: BotContext, promptText: string): Promise<boolean> {
  const state = getState(ctx);
  try {
    const { imageBuffer, answer } = await generateCaptcha();
    state.expectedAnswer = answer;
    await ctx.replyWithPhoto({ source: imageBuffer }, { caption: promptText, ...captchaKeyboard() });
    return true;
  } catch (err) {
    console.error('[captchaJoin.wizard] failed to generate/send captcha image', err);
    return false;
  }
}

/**
 * A broken image pipeline must never be able to block participation entirely — if we can't
 * even render a challenge, join the person directly instead of leaving them stuck in silence.
 */
async function joinWithoutCaptcha(ctx: BotContext): Promise<void> {
  const state = getState(ctx);
  await ctx.reply("⚠️ Captcha rasmini yaratib bo'lmadi. Sizni captchasiz ishtirokchi sifatida qo'shyapmiz.");
  if (!ctx.from) return;
  const result = await joinContest(ctx.telegram, state.contestId, {
    telegramId: ctx.from.id,
    username: ctx.from.username,
  });
  await replyJoinResult(ctx, result);
}

export const captchaJoinWizard = new Scenes.WizardScene<BotContext>(
  CAPTCHA_JOIN_WIZARD_ID,
  // Step 0 — entry: send the first challenge.
  async (ctx) => {
    const state = getState(ctx);
    state.attemptsLeft = MAX_ATTEMPTS;

    const sent = await sendCaptchaChallenge(ctx, "Rasmda ko'rsatilgan raqamlarni kiriting.");
    if (!sent) {
      await joinWithoutCaptcha(ctx);
      return ctx.scene.leave();
    }
    return ctx.wizard.next();
  },
  // Step 1 — capture the answer, or a "new image" tap.
  async (ctx) => {
    const state = getState(ctx);

    if (ctx.callbackQuery && 'data' in ctx.callbackQuery && ctx.callbackQuery.data === REGENERATE_ACTION) {
      await ctx.answerCbQuery();
      const sent = await sendCaptchaChallenge(ctx, "Yangi rasm. Rasmda ko'rsatilgan raqamlarni kiriting.");
      if (!sent) {
        await joinWithoutCaptcha(ctx);
        return ctx.scene.leave();
      }
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

    const sent = await sendCaptchaChallenge(
      ctx,
      `❌ Noto'g'ri. Qayta urinib ko'ring (qolgan urinishlar: ${state.attemptsLeft}).`,
    );
    if (!sent) {
      await joinWithoutCaptcha(ctx);
      return ctx.scene.leave();
    }
  },
);

captchaJoinWizard.action(CANCEL_ACTION, async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Bekor qilindi.');
  await sendStartMessage(ctx);
  return ctx.scene.leave();
});

captchaJoinWizard.command('start', async (ctx, next) => {
  const state = getState(ctx);
  // handleContestJoinDeepLink() enters this scene mid-dispatch of the very "/start join_<id>"
  // message that's still current — Telegraf re-runs this scene's middleware (this handler
  // included) against that same ctx before wizard step 0 gets a turn. Let that one pass fall
  // through to step 0 instead of treating it as a genuine new /start; any later "/start" while
  // this wizard is active is a real escape and should still leave + redispatch.
  if (state.justEntered) {
    delete state.justEntered;
    return next();
  }
  await ctx.scene.leave();
  await handleStartCommand(ctx);
});
