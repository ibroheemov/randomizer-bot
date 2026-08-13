import { Telegram } from 'telegraf';
import { Channel, ChannelDocument, ChannelType } from '../models/Channel.model';
import { UserDocument } from '../models/User.model';

export interface ResolvedChat {
  chatId: number;
  type: ChannelType;
  title: string;
  username?: string;
}

const CHAT_TYPES: ChannelType[] = ['channel', 'group', 'supergroup'];

/** Resolves a user-provided channel reference (@username, forwarded message, or t.me link) to a chat. */
export async function resolveChatFromInput(
  telegram: Telegram,
  input: { text?: string; forwardChatId?: number },
): Promise<ResolvedChat | null> {
  let identifier: string | number | undefined;

  if (input.forwardChatId) {
    identifier = input.forwardChatId;
  } else if (input.text) {
    const trimmed = input.text.trim();
    const linkMatch = trimmed.match(/t\.me\/([A-Za-z0-9_]+)/);
    if (linkMatch) {
      identifier = `@${linkMatch[1]}`;
    } else if (trimmed.startsWith('@')) {
      identifier = trimmed;
    } else {
      return null;
    }
  }

  if (identifier === undefined) return null;

  try {
    const chat = await telegram.getChat(identifier);
    if (!CHAT_TYPES.includes(chat.type as ChannelType)) {
      return null;
    }
    return {
      chatId: chat.id,
      type: chat.type as ChannelType,
      title: 'title' in chat ? (chat.title as string) : '',
      username: 'username' in chat ? (chat.username as string | undefined) : undefined,
    };
  } catch {
    return null;
  }
}

export async function isBotAdmin(telegram: Telegram, chatId: number): Promise<boolean> {
  try {
    const me = await telegram.getMe();
    const member = await telegram.getChatMember(chatId, me.id);
    return member.status === 'administrator' || member.status === 'creator';
  } catch {
    return false;
  }
}

export async function isUserAdmin(
  telegram: Telegram,
  chatId: number,
  userId: number,
): Promise<boolean> {
  try {
    const member = await telegram.getChatMember(chatId, userId);
    return member.status === 'administrator' || member.status === 'creator';
  } catch {
    return false;
  }
}

export async function upsertChannel(data: {
  ownerTelegramId: number;
  chatId: number;
  type: ChannelType;
  title: string;
  username?: string;
}): Promise<ChannelDocument> {
  const channel = await Channel.findOneAndUpdate(
    { ownerTelegramId: data.ownerTelegramId, chatId: data.chatId },
    { $set: data },
    { upsert: true, new: true },
  );
  return channel as ChannelDocument;
}

export async function listUserChannels(ownerTelegramId: number): Promise<ChannelDocument[]> {
  return Channel.find({ ownerTelegramId }).sort({ addedAt: -1 });
}

/** Superadmin sees every admin's channels; everyone else sees only their own. */
export async function listVisibleChannels(user: UserDocument): Promise<ChannelDocument[]> {
  const filter = user.role === 'superadmin' ? {} : { ownerTelegramId: user.telegramId };
  return Channel.find(filter).sort({ addedAt: -1 });
}

export async function findUserChannelByChatId(
  ownerTelegramId: number,
  chatId: number,
): Promise<ChannelDocument | null> {
  return Channel.findOne({ ownerTelegramId, chatId });
}
