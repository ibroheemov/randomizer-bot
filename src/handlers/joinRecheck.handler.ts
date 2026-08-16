import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context.types';
import { RECHECK_JOIN_ACTION_PREFIX } from '../keyboards/inline/joinRecheck.inline';
import { joinContest, replyJoinResult } from '../services/participant.service';

export function registerJoinRecheckHandler(bot: Telegraf<BotContext>): void {
  bot.action(new RegExp(`^${RECHECK_JOIN_ACTION_PREFIX}([0-9a-fA-F]{24})$`), async (ctx) => {
    await ctx.answerCbQuery();
    if (!ctx.from) return;

    const contestId = ctx.match[1];
    const result = await joinContest(ctx.telegram, contestId, {
      telegramId: ctx.from.id,
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name,
    });
    await replyJoinResult(ctx, result);
  });
}
