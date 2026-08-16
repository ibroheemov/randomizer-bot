import { Telegram } from 'telegraf';
import { Contest } from '../models/Contest.model';
import { Participant } from '../models/Participant.model';
import { RequiredChannel } from '../types/contest.types';
import { BotContext } from '../types/context.types';
import { checkRequiredSubscriptions } from './subscription.service';
import { selectWinners } from './winner.service';
import { getBotUsername } from './botInfo.service';
import { contestPostKeyboard } from '../keyboards/inline/contestPost.inline';
import { joinRecheckKeyboard } from '../keyboards/inline/joinRecheck.inline';
import { getEnabledGlobalRequiredChannels } from './globalChannel.service';

export type JoinResult =
  | { ok: true; alreadyJoined: boolean }
  | { ok: false; reason: 'not_subscribed'; contestId: string; missing: RequiredChannel[] }
  | { ok: false; reason: 'contest_not_active' };

const DUPLICATE_KEY_ERROR_CODE = 11000;
const PARTICIPANT_COUNT_REFRESH_INTERVAL_MS = 3000;
const scheduledCountRefreshes = new Set<string>();

async function refreshParticipantCountOnPost(telegram: Telegram, contestId: string): Promise<void> {
  try {
    const contest = await Contest.findById(contestId);
    if (!contest?.messageId) return;

    const botUsername = await getBotUsername(telegram);
    const keyboard = contestPostKeyboard(
      botUsername,
      contestId,
      contest.buttonText,
      contest.participantsCount,
    );
    await telegram.editMessageReplyMarkup(
      contest.publishChannelId,
      contest.messageId,
      undefined,
      keyboard.reply_markup,
    );
  } catch (err) {
    console.error('[participant.service] failed to refresh participant count on post', err);
  }
}

/**
 * Editing the channel post on every single join means one Telegram API call per join — under
 * a burst (many people tapping Participate within seconds of each other) that blows straight
 * through Telegram's roughly one-edit-per-second-per-message limit, and awaiting it inline
 * would hold every join behind a growing queue of throttled/failing edits. Instead, coalesce a
 * burst for the same contest into at most one edit every few seconds (always reading the
 * freshest count when it actually fires), and never block the caller on it.
 */
function scheduleParticipantCountRefresh(telegram: Telegram, contestId: string): void {
  if (scheduledCountRefreshes.has(contestId)) return;
  scheduledCountRefreshes.add(contestId);

  setTimeout(() => {
    scheduledCountRefreshes.delete(contestId);
    void refreshParticipantCountOnPost(telegram, contestId);
  }, PARTICIPANT_COUNT_REFRESH_INTERVAL_MS);
}

export async function joinContest(
  telegram: Telegram,
  contestId: string,
  user: { telegramId: number; username?: string; firstName?: string; lastName?: string },
): Promise<JoinResult> {
  const contest = await Contest.findById(contestId);
  if (!contest || contest.status !== 'published') {
    return { ok: false, reason: 'contest_not_active' };
  }

  const channelsByChat = new Map<number, RequiredChannel>();
  if (contest.requireSubscription) {
    channelsByChat.set(contest.publishChannelId, {
      chatId: contest.publishChannelId,
      title: contest.publishChannelTitle,
    });
    for (const channel of contest.requiredChannels) channelsByChat.set(channel.chatId, channel);
  }
  // Superadmin's global required channels apply to every contest regardless of that
  // contest's own requireSubscription setting — it's a bot-wide requirement, not one an
  // individual contest can opt out of.
  for (const channel of await getEnabledGlobalRequiredChannels()) channelsByChat.set(channel.chatId, channel);

  if (channelsByChat.size > 0) {
    const { allSubscribed, missing } = await checkRequiredSubscriptions(
      telegram,
      [...channelsByChat.values()],
      user.telegramId,
    );
    if (!allSubscribed) {
      return { ok: false, reason: 'not_subscribed', contestId, missing };
    }
  }

  try {
    await Participant.create({
      contestId: contest._id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
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

  if (updated?.messageId) {
    scheduleParticipantCountRefresh(telegram, String(updated._id));
  }

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

/** Renders a JoinResult as the appropriate chat reply — shared by the direct-join and captcha paths. */
export async function replyJoinResult(ctx: BotContext, result: JoinResult): Promise<void> {
  if (result.ok) {
    await ctx.reply(
      result.alreadyJoined
        ? 'Siz allaqachon ushbu konkursda ishtirok etyapsiz!'
        : "🎉 Endi siz konkurs ishtirokchisisiz! \n❗️Iltimos konkurs yakunlanguncha botni tark etmang",
    );
    return;
  }

  if (result.reason === 'not_subscribed') {
    const list = result.missing.map((c) => (c.username ? `@${c.username}` : c.title)).join(', ');
    await ctx.reply(
      `Iltimos, quyidagilarga obuna bo'ling: ${list}\n\nObuna bo'lgach, "Obuna bo'ldim" tugmasini bosing.`,
      joinRecheckKeyboard(result.contestId),
    );
    return;
  }

  await ctx.reply('Bu konkurs endi faol emas.');
}
