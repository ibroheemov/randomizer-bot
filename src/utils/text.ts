import { ContestDraft } from '../types/session.types';
import { ContestWinner } from '../types/contest.types';
import { formatTashkentDateTime } from './datetime';

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * @username is already tappable as plain text in Telegram. A winner without one has no such
 * shorthand, so link their name to their profile via a tg://user deep link instead of falling
 * back to a plain, untappable "ID <n>" — requires parse_mode: 'HTML' on the message this is
 * used in.
 */
export function formatWinnerMention(winner: ContestWinner): string {
  if (winner.username) return `@${winner.username}`;

  const name = [winner.firstName, winner.lastName].filter(Boolean).join(' ').trim();
  const label = name || `ID ${winner.telegramId}`;
  return `<a href="tg://user?id=${winner.telegramId}">${escapeHtml(label)}</a>`;
}

export function buildReviewMessage(contest: ContestDraft): string {
  const endLine =
    contest.completionType === 'by_time' && contest.completeAt
      ? `🔚 Konkurs tugaydi: ${formatTashkentDateTime(contest.completeAt)}`
      : `🔚 Konkurs ${contest.participantsThreshold} ishtirokchi qo'shilganda tugaydi`;

  return [
    'Konkursingizni diqqat bilan qayta tekshiring',
    '',
    endLine,
    `🏆 G'oliblar soni: ${contest.winnersCount}`,
  ].join('\n');
}

export function toggleLabel(label: string, active: boolean): string {
  return active ? `✅ ${label}` : `❌ ${label}`;
}
