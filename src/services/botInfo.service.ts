import { Telegram } from 'telegraf';

let cachedUsername: string | undefined;

/** The bot's own @username never changes at runtime, so fetch it once and reuse it. */
export async function getBotUsername(telegram: Telegram): Promise<string> {
  if (!cachedUsername) {
    const me = await telegram.getMe();
    cachedUsername = me.username;
  }
  return cachedUsername;
}
