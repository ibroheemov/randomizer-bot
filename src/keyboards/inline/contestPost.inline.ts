import { Markup } from 'telegraf';

export const JOIN_PAYLOAD_PREFIX = 'join_';

export function contestJoinDeepLink(botUsername: string, contestId: string): string {
  return `https://t.me/${botUsername}?start=${JOIN_PAYLOAD_PREFIX}${contestId}`;
}

export function contestJoinButtonLabel(buttonText: string, participantsCount: number): string {
  return participantsCount > 0 ? `${buttonText} (${participantsCount})` : buttonText;
}

/** Tapping this opens a private chat with the bot and sends "/start join_<contestId>". */
export function contestPostKeyboard(
  botUsername: string,
  contestId: string,
  buttonText: string,
  participantsCount = 0,
) {
  return Markup.inlineKeyboard([
    Markup.button.url(contestJoinButtonLabel(buttonText, participantsCount), contestJoinDeepLink(botUsername, contestId)),
  ]);
}
