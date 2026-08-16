import { Telegram } from 'telegraf';
import { RequiredChannel } from '../types/contest.types';

const NOT_SUBSCRIBED_STATUSES = new Set(['left', 'kicked']);

export async function isSubscribed(
  telegram: Telegram,
  chatId: number,
  userId: number,
): Promise<boolean> {
  try {
    const member = await telegram.getChatMember(chatId, userId);
    return !NOT_SUBSCRIBED_STATUSES.has(member.status);
  } catch {
    return false;
  }
}

export async function checkRequiredSubscriptions(
  telegram: Telegram,
  channels: RequiredChannel[],
  userId: number,
): Promise<{ allSubscribed: boolean; missing: RequiredChannel[] }> {
  // Each check is its own Telegram API round trip — under a join burst, checking channels
  // one at a time serializes that latency per user on top of everyone else's. Parallelizing
  // just the calls for a single user's own channel list cuts each join's latency down to the
  // slowest single channel check instead of their sum.
  const results = await Promise.all(
    channels.map(async (channel) => ({
      channel,
      subscribed: await isSubscribed(telegram, channel.chatId, userId),
    })),
  );

  const missing = results.filter((r) => !r.subscribed).map((r) => r.channel);
  return { allSubscribed: missing.length === 0, missing };
}
