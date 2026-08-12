import { Telegram } from 'telegraf';
import { Contest, ContestDocument } from '../models/Contest.model';
import { ContestDraft } from '../types/session.types';
import { contestPostKeyboard } from '../keyboards/inline/contestPost.inline';
import { schedulePublish, scheduleCompletion } from './scheduler.service';

function draftToContestData(ownerTelegramId: number, draft: ContestDraft) {
  if (
    !draft.text ||
    !draft.buttonText ||
    draft.winnersCount === undefined ||
    draft.publishChannelId === undefined ||
    !draft.publishChannelTitle ||
    !draft.publishType ||
    !draft.completionType
  ) {
    throw new Error('Contest draft is incomplete');
  }

  return {
    ownerTelegramId,
    text: draft.text,
    mediaType: draft.mediaType,
    mediaFileId: draft.mediaFileId,
    buttonText: draft.buttonText,
    requiredChannels: draft.requiredChannels,
    requireSubscription: draft.requireSubscription,
    winnersCount: draft.winnersCount,
    publishChannelId: draft.publishChannelId,
    publishChannelTitle: draft.publishChannelTitle,
    publishType: draft.publishType,
    publishAt: draft.publishType === 'now' ? new Date() : (draft.publishAt as Date),
    completionType: draft.completionType,
    completeAt: draft.completeAt,
    participantsThreshold: draft.participantsThreshold,
    useCaptcha: draft.useCaptcha,
    boostForLuck: draft.boostForLuck,
  };
}

export async function publishContest(telegram: Telegram, contest: ContestDocument): Promise<void> {
  const keyboard = contestPostKeyboard(contest._id as unknown as string, contest.buttonText);
  let messageId: number;

  if (contest.mediaType === 'photo' && contest.mediaFileId) {
    const sent = await telegram.sendPhoto(contest.publishChannelId, contest.mediaFileId, {
      caption: contest.text,
      ...keyboard,
    });
    messageId = sent.message_id;
  } else if (contest.mediaType === 'video' && contest.mediaFileId) {
    const sent = await telegram.sendVideo(contest.publishChannelId, contest.mediaFileId, {
      caption: contest.text,
      ...keyboard,
    });
    messageId = sent.message_id;
  } else if (contest.mediaType === 'animation' && contest.mediaFileId) {
    const sent = await telegram.sendAnimation(contest.publishChannelId, contest.mediaFileId, {
      caption: contest.text,
      ...keyboard,
    });
    messageId = sent.message_id;
  } else {
    const sent = await telegram.sendMessage(contest.publishChannelId, contest.text, keyboard);
    messageId = sent.message_id;
  }

  contest.status = 'published';
  contest.messageId = messageId;
  await contest.save();
}

export async function createContest(
  ownerTelegramId: number,
  draft: ContestDraft,
  telegram: Telegram,
): Promise<ContestDocument> {
  const data = draftToContestData(ownerTelegramId, draft);
  const contest = await Contest.create({ ...data, status: 'scheduled' });

  if (draft.publishType === 'now') {
    await publishContest(telegram, contest);
    if (contest.completionType === 'by_time' && contest.completeAt) {
      await scheduleCompletion(String(contest._id), contest.completeAt);
    }
  } else {
    await schedulePublish(String(contest._id), contest.publishAt);
  }

  return contest;
}

export async function listUserContests(ownerTelegramId: number): Promise<ContestDocument[]> {
  return Contest.find({ ownerTelegramId }).sort({ createdAt: -1 }).limit(50);
}
