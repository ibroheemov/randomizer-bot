import { ContestDraft } from '../types/session.types';
import { formatTashkentDateTime } from './datetime';

export function buildReviewMessage(contest: ContestDraft): string {
  const endLine =
    contest.completionType === 'by_time' && contest.completeAt
      ? `🔚 Contest ends: ${formatTashkentDateTime(contest.completeAt)}`
      : `🔚 Contest ends: when ${contest.participantsThreshold} participants join`;

  return [
    'Carefully double-check your contest',
    '',
    endLine,
    `🏆 Number of winners: ${contest.winnersCount}`,
  ].join('\n');
}

export function toggleLabel(label: string, active: boolean): string {
  return active ? `✅ ${label}` : label;
}
