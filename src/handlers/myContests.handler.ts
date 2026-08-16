import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context.types';
import { MAIN_MENU_BUTTONS } from '../keyboards/mainMenu.keyboard';
import { VIEW_CONTEST_ACTION_PREFIX, myContestsKeyboard } from '../keyboards/inline/myContests.inline';
import {
  END_CONTEST_ACTION_PREFIX,
  NOTIFY_WINNERS_ACTION_PREFIX,
  REMOVE_CONTEST_ACTION_PREFIX,
  contestDetailKeyboard,
} from '../keyboards/inline/contestDetail.inline';
import { listVisibleContests } from '../services/contest.service';
import { selectWinners } from '../services/winner.service';
import { formatTashkentDateTime } from '../utils/datetime';
import { formatWinnerMention } from '../utils/text';
import { Contest, ContestDocument } from '../models/Contest.model';
import { requireRole } from '../services/user.service';
import { NOTIFY_WINNERS_WIZARD_ID } from '../scenes/notifyWinners.wizard';

const STATUS_LABELS: Record<ContestDocument['status'], string> = {
  draft: 'Qoralama',
  scheduled: 'Rejalashtirilgan',
  published: 'Chop etilgan',
  completed: 'Yakunlangan',
  cancelled: 'Bekor qilingan',
};

async function findVisibleContest(
  contestId: string,
  user: { telegramId: number; role: string },
): Promise<ContestDocument | null> {
  const contest = await Contest.findById(contestId);
  if (!contest || contest.removedAt) return null;
  if (user.role !== 'superadmin' && contest.ownerTelegramId !== user.telegramId) return null;
  return contest;
}

export function registerMyContestsHandlers(bot: Telegraf<BotContext>): void {
  bot.hears(MAIN_MENU_BUTTONS.MY_CONTESTS, async (ctx) => {
    const user = await requireRole(ctx, 'admin');
    if (!user) return;
    const contests = await listVisibleContests(user);
    if (contests.length === 0) {
      await ctx.reply('Sizda hali konkurslar yo\'q. Boshlash uchun "Konkurs yaratish" tugmasini bosing.');
      return;
    }
    await ctx.reply('📋 Sizning konkurslaringiz:', myContestsKeyboard(contests));
  });

  bot.action(new RegExp(`^${VIEW_CONTEST_ACTION_PREFIX}([a-f0-9]+)$`), async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireRole(ctx, 'admin');
    if (!user) return;

    const contest = await findVisibleContest(ctx.match[1], user);
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
      lines.push('', "🏆 G'oliblar:", ...contest.winners.map((w) => formatWinnerMention(w)));
    }

    const isOwner = contest.ownerTelegramId === user.telegramId;
    const canManage = isOwner || user.role === 'superadmin';
    const keyboard = contestDetailKeyboard(String(contest._id), {
      canNotify: contest.status === 'completed' && isOwner,
      canRemove: canManage,
      canEnd: contest.status === 'published' && canManage,
    });

    await ctx.reply(lines.join('\n'), { parse_mode: 'HTML', ...keyboard });
  });

  bot.action(new RegExp(`^${NOTIFY_WINNERS_ACTION_PREFIX}([a-f0-9]+)$`), async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireRole(ctx, 'admin');
    if (!user) return;

    const contest = await findVisibleContest(ctx.match[1], user);
    if (!contest || contest.status !== 'completed' || contest.ownerTelegramId !== user.telegramId) {
      await ctx.reply('Bu amal endi mavjud emas.');
      return;
    }

    await ctx.scene.enter(NOTIFY_WINNERS_WIZARD_ID, { contestId: String(contest._id) });
  });

  bot.action(new RegExp(`^${END_CONTEST_ACTION_PREFIX}([a-f0-9]+)$`), async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireRole(ctx, 'admin');
    if (!user) return;

    const contest = await findVisibleContest(ctx.match[1], user);
    if (!contest || contest.status !== 'published' || (contest.ownerTelegramId !== user.telegramId && user.role !== 'superadmin')) {
      await ctx.reply('Bu amal endi mavjud emas.');
      return;
    }

    await selectWinners(ctx.telegram, contest._id);
    await ctx.reply("🏁 Konkurs qo'lda yakunlandi.");
  });

  bot.action(new RegExp(`^${REMOVE_CONTEST_ACTION_PREFIX}([a-f0-9]+)$`), async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireRole(ctx, 'admin');
    if (!user) return;

    const contest = await findVisibleContest(ctx.match[1], user);
    if (!contest || (contest.ownerTelegramId !== user.telegramId && user.role !== 'superadmin')) {
      await ctx.reply('Bu amal endi mavjud emas.');
      return;
    }

    contest.removedAt = new Date();
    await contest.save();
    await ctx.reply("🗑 Konkurs o'chirildi.");
  });
}
