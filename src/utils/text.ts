import { ContestDraft } from '../types/session.types';
import { formatTashkentDateTime } from './datetime';

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
