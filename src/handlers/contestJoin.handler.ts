import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context.types';
import { JOIN_CONTEST_ACTION_PREFIX } from '../keyboards/inline/contestPost.inline';
import { joinContest } from '../services/participant.service';

export function registerContestJoinHandler(bot: Telegraf<BotContext>): void {
  bot.action(new RegExp(`^${JOIN_CONTEST_ACTION_PREFIX}([a-f0-9]+)$`), async (ctx) => {
    if (!ctx.from) return;
    const contestId = ctx.match[1];

    const result = await joinContest(ctx.telegram, contestId, {
      telegramId: ctx.from.id,
      username: ctx.from.username,
    });

    if (result.ok) {
      await ctx.answerCbQuery(
        result.alreadyJoined
          ? 'Siz allaqachon ushbu konkursda ishtirok etyapsiz!'
          : "🎉 Siz konkursga qo'shildingiz!",
        { show_alert: true },
      );
      return;
    }

    if (result.reason === 'not_subscribed') {
      const list = result.missing.map((c) => (c.username ? `@${c.username}` : c.title)).join(', ');
      await ctx.answerCbQuery(`Iltimos, quyidagilarga obuna bo'ling: ${list}`, { show_alert: true });
      return;
    }

    await ctx.answerCbQuery('Bu konkurs endi faol emas.', { show_alert: true });
  });
}
