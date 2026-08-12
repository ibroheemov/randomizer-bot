import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context.types';
import { MAIN_MENU_BUTTONS } from '../keyboards/mainMenu.keyboard';
import { VIEW_CONTEST_ACTION_PREFIX, myContestsKeyboard } from '../keyboards/inline/myContests.inline';
import { listUserContests } from '../services/contest.service';
import { formatTashkentDateTime } from '../utils/datetime';
import { Contest, ContestDocument } from '../models/Contest.model';

const STATUS_LABELS: Record<ContestDocument['status'], string> = {
  draft: 'Qoralama',
  scheduled: 'Rejalashtirilgan',
  published: 'Chop etilgan',
  completed: 'Yakunlangan',
  cancelled: 'Bekor qilingan',
};

export function registerMyContestsHandlers(bot: Telegraf<BotContext>): void {
  bot.hears(MAIN_MENU_BUTTONS.MY_CONTESTS, async (ctx) => {
    if (!ctx.from) return;
    const contests = await listUserContests(ctx.from.id);
    if (contests.length === 0) {
      await ctx.reply('Sizda hali konkurslar yo\'q. Boshlash uchun "Konkurs yaratish" tugmasini bosing.');
      return;
    }
    await ctx.reply('📋 Sizning konkurslaringiz:', myContestsKeyboard(contests));
  });

  bot.action(new RegExp(`^${VIEW_CONTEST_ACTION_PREFIX}([a-f0-9]+)$`), async (ctx) => {
    await ctx.answerCbQuery();
    const contest = await Contest.findById(ctx.match[1]);
    if (!contest) return;

    const lines = [
      `Holati: ${STATUS_LABELS[contest.status]}`,
      `G'oliblar soni: ${contest.winnersCount}`,
      `Ishtirokchilar soni: ${contest.participantsCount}`,
      contest.completionType === 'by_time' && contest.completeAt
        ? `Tugash vaqti: ${formatTashkentDateTime(contest.completeAt)}`
        : `${contest.participantsThreshold} ishtirokchida tugaydi`,
    ];

    if (contest.winners.length > 0) {
      lines.push(
        '',
        "🏆 G'oliblar:",
        ...contest.winners.map((w) => (w.username ? `@${w.username}` : `ID ${w.telegramId}`)),
      );
    }

    await ctx.reply(lines.join('\n'));
  });
}
