import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context.types';
import { MAIN_MENU_GREETING, mainMenuKeyboard } from '../keyboards/mainMenu.keyboard';
import { USER_WELCOME_MESSAGE } from '../config/constants';
import { getOrCreateUser, roleAtLeast } from '../services/user.service';
import { joinContest } from '../services/participant.service';
import { JOIN_PAYLOAD_PREFIX } from '../keyboards/inline/contestPost.inline';

export async function sendStartMessage(ctx: BotContext): Promise<void> {
  if (!ctx.from) return;

  const user = await getOrCreateUser(ctx.from);
  if (roleAtLeast(user.role, 'admin')) {
    await ctx.reply(MAIN_MENU_GREETING, mainMenuKeyboard(user.role));
  } else {
    await ctx.reply(USER_WELCOME_MESSAGE);
  }
}

async function handleContestJoinDeepLink(ctx: BotContext, contestId: string): Promise<void> {
  if (!ctx.from) return;

  const result = await joinContest(ctx.telegram, contestId, {
    telegramId: ctx.from.id,
    username: ctx.from.username,
  });

  if (result.ok) {
    await ctx.reply(
      result.alreadyJoined
        ? 'Siz allaqachon ushbu konkursda ishtirok etyapsiz!'
        : "🎉 Endi siz konkurs ishtirokchisisiz! \n❗️Iltimos konkurs yakunlanguncha botni tark etmang",
    );
    return;
  }

  if (result.reason === 'not_subscribed') {
    const list = result.missing.map((c) => (c.username ? `@${c.username}` : c.title)).join(', ');
    await ctx.reply(`Iltimos, quyidagilarga obuna bo'ling: ${list}`);
    return;
  }

  await ctx.reply('Bu konkurs endi faol emas.');
}

export function registerStartHandler(bot: Telegraf<BotContext>): void {
  bot.start(async (ctx) => {
    if (ctx.scene.current) await ctx.scene.leave();

    const payload = ctx.startPayload;
    if (payload?.startsWith(JOIN_PAYLOAD_PREFIX)) {
      await handleContestJoinDeepLink(ctx, payload.slice(JOIN_PAYLOAD_PREFIX.length));
      return;
    }

    await sendStartMessage(ctx);
  });
}
