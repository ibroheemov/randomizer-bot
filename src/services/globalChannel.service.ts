import { ChannelType } from '../models/Channel.model';
import { GlobalRequiredChannel, GlobalRequiredChannelDocument } from '../models/GlobalRequiredChannel.model';
import { GlobalSettings } from '../models/GlobalSettings.model';
import { RequiredChannel } from '../types/contest.types';

const SETTINGS_KEY = 'global';

export async function isGlobalChannelsEnabled(): Promise<boolean> {
  const settings = await GlobalSettings.findOne({ key: SETTINGS_KEY });
  return settings?.globalChannelsEnabled ?? false;
}

export async function setGlobalChannelsEnabled(enabled: boolean): Promise<boolean> {
  const settings = await GlobalSettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $set: { globalChannelsEnabled: enabled }, $setOnInsert: { key: SETTINGS_KEY } },
    { upsert: true, new: true },
  );
  return settings.globalChannelsEnabled;
}

export async function listGlobalChannels(): Promise<GlobalRequiredChannelDocument[]> {
  return GlobalRequiredChannel.find().sort({ addedAt: -1 });
}

export async function addGlobalChannel(data: {
  chatId: number;
  type: ChannelType;
  title: string;
  username?: string;
  addedBy: number;
}): Promise<GlobalRequiredChannelDocument> {
  const channel = await GlobalRequiredChannel.findOneAndUpdate(
    { chatId: data.chatId },
    { $set: data },
    { upsert: true, new: true },
  );
  return channel as GlobalRequiredChannelDocument;
}

export async function removeGlobalChannel(chatId: number): Promise<void> {
  await GlobalRequiredChannel.deleteOne({ chatId });
}

/** Channels every contest's participants must subscribe to, or [] if the feature is off. */
export async function getEnabledGlobalRequiredChannels(): Promise<RequiredChannel[]> {
  const enabled = await isGlobalChannelsEnabled();
  if (!enabled) return [];

  const channels = await listGlobalChannels();
  return channels.map((c) => ({ chatId: c.chatId, title: c.title, username: c.username }));
}
