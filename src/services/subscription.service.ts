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
  const missing: RequiredChannel[] = [];

  for (const channel of channels) {
    const subscribed = await isSubscribed(telegram, channel.chatId, userId);
    if (!subscribed) missing.push(channel);
  }

  return { allSubscribed: missing.length === 0, missing };
}
