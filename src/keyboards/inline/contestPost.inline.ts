import { Markup } from 'telegraf';

export const JOIN_PAYLOAD_PREFIX = 'join_';

export function contestJoinDeepLink(botUsername: string, contestId: string): string {
  return `https://t.me/${botUsername}?start=${JOIN_PAYLOAD_PREFIX}${contestId}`;
}

/** Tapping this opens a private chat with the bot and sends "/start join_<contestId>". */
export function contestPostKeyboard(botUsername: string, contestId: string, buttonText: string) {
  return Markup.inlineKeyboard([Markup.button.url(buttonText, contestJoinDeepLink(botUsername, contestId))]);
}
