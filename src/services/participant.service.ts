import { Telegram } from 'telegraf';
import { Contest } from '../models/Contest.model';
import { Participant } from '../models/Participant.model';
import { RequiredChannel } from '../types/contest.types';
import { checkRequiredSubscriptions } from './subscription.service';
import { selectWinners } from './winner.service';

export type JoinResult =
  | { ok: true; alreadyJoined: boolean }
  | { ok: false; reason: 'not_subscribed'; missing: RequiredChannel[] }
  | { ok: false; reason: 'contest_not_active' };

const DUPLICATE_KEY_ERROR_CODE = 11000;

export async function joinContest(
  telegram: Telegram,
  contestId: string,
  user: { telegramId: number; username?: string },
): Promise<JoinResult> {
  const contest = await Contest.findById(contestId);
  if (!contest || contest.status !== 'published') {
    return { ok: false, reason: 'contest_not_active' };
  }

  if (contest.requireSubscription) {
    const channelsToCheck: RequiredChannel[] = [
      { chatId: contest.publishChannelId, title: contest.publishChannelTitle },
      ...contest.requiredChannels,
    ];
    const { allSubscribed, missing } = await checkRequiredSubscriptions(
      telegram,
      channelsToCheck,
      user.telegramId,
    );
    if (!allSubscribed) {
      return { ok: false, reason: 'not_subscribed', missing };
    }
  }

  try {
    await Participant.create({
      contestId: contest._id,
      telegramId: user.telegramId,
      username: user.username,
    });
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'code' in err && err.code === DUPLICATE_KEY_ERROR_CODE) {
      return { ok: true, alreadyJoined: true };
    }
    throw err;
  }

  const updated = await Contest.findOneAndUpdate(
    { _id: contest._id, status: 'published' },
    { $inc: { participantsCount: 1 } },
    { new: true },
  );

  if (
    updated &&
    updated.completionType === 'by_participants' &&
    updated.participantsThreshold !== undefined &&
    updated.participantsCount >= updated.participantsThreshold
  ) {
    await selectWinners(telegram, updated._id);
  }

  return { ok: true, alreadyJoined: false };
}
