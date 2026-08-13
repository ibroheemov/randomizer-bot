import { Telegram } from 'telegraf';
import { Contest, ContestDocument } from '../models/Contest.model';
import { Participant } from '../models/Participant.model';
import { sampleWithoutReplacement } from '../utils/random';
import { contestDetailKeyboard } from '../keyboards/inline/contestDetail.inline';

/**
 * Atomically claims the contest (published -> completed) before computing winners, so a
 * scheduled "by_time" job and a "by_participants" threshold trigger can never both process
 * the same contest.
 */
export async function selectWinners(telegram: Telegram, contestId: unknown): Promise<void> {
  const claimed = await Contest.findOneAndUpdate(
    { _id: contestId, status: 'published' },
    { $set: { status: 'completed' } },
  );
  if (!claimed) return;

  const participants = await Participant.find({ contestId: claimed._id });
  const winners = sampleWithoutReplacement(participants, claimed.winnersCount).map((p) => ({
    telegramId: p.telegramId,
    username: p.username,
  }));

  const updated = await Contest.findByIdAndUpdate(claimed._id, { $set: { winners } }, { new: true });
  if (updated) await announceResults(telegram, updated);
}

function buildResultsLines(contest: ContestDocument): string[] {
  const lines = ["🏆 Konkurs natijalari e'lon qilindi!", ''];

  if (contest.winners.length === 0) {
    lines.push('Bu konkursda hech kim ishtirok etmadi.');
  } else {
    lines.push(
      ...contest.winners.map(
        (w, i) => `${i + 1}. ${w.username ? '@' + w.username : `ID ${w.telegramId}`}`,
      ),
    );
  }

  return lines;
}

async function announceResults(telegram: Telegram, contest: ContestDocument): Promise<void> {
  const lines = buildResultsLines(contest);

  try {
    await telegram.sendMessage(contest.publishChannelId, lines.join('\n'));
  } catch (err) {
    console.error('[winner.service] failed to announce results in channel', err);
  }

  try {
    const ownerLines = [`🏁 "${contest.text.slice(0, 40)}" konkursi yakunlandi.`, '', ...lines];
    const keyboard = contestDetailKeyboard(String(contest._id), {
      canNotify: contest.winners.length > 0,
      canRemove: false,
    });
    await telegram.sendMessage(contest.ownerTelegramId, ownerLines.join('\n'), keyboard);
  } catch (err) {
    console.error('[winner.service] failed to notify contest owner', err);
  }
}
