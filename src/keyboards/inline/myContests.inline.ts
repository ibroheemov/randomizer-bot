import { Markup } from 'telegraf';
import { ContestDocument } from '../../models/Contest.model';

export const VIEW_CONTEST_ACTION_PREFIX = 'view_contest:';

const STATUS_EMOJI: Record<ContestDocument['status'], string> = {
  draft: '📝',
  scheduled: '⏰',
  published: '📣',
  completed: '✅',
  cancelled: '🚫',
};

export function myContestsKeyboard(contests: ContestDocument[]) {
  const rows = contests.map((contest) => [
    Markup.button.callback(
      `${STATUS_EMOJI[contest.status]} ${contest.text.slice(0, 30)}`,
      `${VIEW_CONTEST_ACTION_PREFIX}${contest._id}`,
    ),
  ]);

  return Markup.inlineKeyboard(rows);
}
