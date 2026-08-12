import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context.types';
import { MAIN_MENU_BUTTONS } from '../keyboards/mainMenu.keyboard';
import { VIEW_CONTEST_ACTION_PREFIX, myContestsKeyboard } from '../keyboards/inline/myContests.inline';
import { listUserContests } from '../services/contest.service';
import { formatTashkentDateTime } from '../utils/datetime';
import { Contest } from '../models/Contest.model';

export function registerMyContestsHandlers(bot: Telegraf<BotContext>): void {
  bot.hears(MAIN_MENU_BUTTONS.MY_CONTESTS, async (ctx) => {
    if (!ctx.from) return;
    const contests = await listUserContests(ctx.from.id);
    if (contests.length === 0) {
      await ctx.reply('You haven\'t created any contests yet. Tap "Create contest" to start one.');
      return;
    }
    await ctx.reply('📋 Your contests:', myContestsKeyboard(contests));
  });

  bot.action(new RegExp(`^${VIEW_CONTEST_ACTION_PREFIX}([a-f0-9]+)$`), async (ctx) => {
    await ctx.answerCbQuery();
    const contest = await Contest.findById(ctx.match[1]);
    if (!contest) return;

    const lines = [
      `Status: ${contest.status}`,
      `Winners: ${contest.winnersCount}`,
      `Participants: ${contest.participantsCount}`,
      contest.completionType === 'by_time' && contest.completeAt
        ? `Ends: ${formatTashkentDateTime(contest.completeAt)}`
        : `Ends at ${contest.participantsThreshold} participants`,
    ];

    if (contest.winners.length > 0) {
      lines.push(
        '',
        '🏆 Winners:',
        ...contest.winners.map((w) => (w.username ? `@${w.username}` : `id ${w.telegramId}`)),
      );
    }

    await ctx.reply(lines.join('\n'));
  });
}
