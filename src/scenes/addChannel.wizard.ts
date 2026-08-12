import { Scenes } from 'telegraf';
import { BotContext } from '../types/context.types';
import { AddChannelWizardState } from '../types/session.types';
import {
  isBotAdmin,
  isUserAdmin,
  resolveChatFromInput,
  upsertChannel,
} from '../services/channel.service';
import { mainMenuKeyboard } from '../keyboards/mainMenu.keyboard';
import { sendMainMenuOrLoginPrompt } from '../handlers/start.handler';

export const ADD_CHANNEL_WIZARD_ID = 'addChannelWizard';

function getState(ctx: BotContext): AddChannelWizardState {
  return ctx.wizard.state as AddChannelWizardState;
}

export const addChannelWizard = new Scenes.WizardScene<BotContext>(
  ADD_CHANNEL_WIZARD_ID,
  async (ctx) => {
    const state = getState(ctx);
    const kindLabel = state.kind === 'group' ? 'group' : 'channel';
    await ctx.reply(
      `Send me the ${kindLabel} in the @username format, or forward a message from it (for private chats: forward a message, or send a link to any message from it).`,
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    const state = getState(ctx);
    if (!ctx.message || !ctx.from) return;

    const forwardChatId =
      'forward_origin' in ctx.message &&
      ctx.message.forward_origin?.type === 'channel'
        ? ctx.message.forward_origin.chat.id
        : undefined;
    const text = 'text' in ctx.message ? ctx.message.text : undefined;

    const resolved = await resolveChatFromInput(ctx.telegram, { text, forwardChatId });
    if (!resolved) {
      await ctx.reply('I could not find that chat. Send @username or forward a message from it.');
      return;
    }

    const expectedTypes = state.kind === 'group' ? ['group', 'supergroup'] : ['channel'];
    if (!expectedTypes.includes(resolved.type)) {
      await ctx.reply(
        state.kind === 'group'
          ? 'That looks like a channel, not a group. Please send a group instead, or use "Add channel".'
          : 'That looks like a group, not a channel. Please send a channel instead, or use "Add group".',
      );
      return;
    }

    const botIsAdmin = await isBotAdmin(ctx.telegram, resolved.chatId);
    if (!botIsAdmin) {
      await ctx.reply(
        '⚠️ I need to be an administrator there with posting permissions first. Add me, then send it again.',
      );
      return;
    }

    const userIsAdmin = await isUserAdmin(ctx.telegram, resolved.chatId, ctx.from.id);
    if (!userIsAdmin) {
      await ctx.reply('⚠️ You need to be an administrator of that chat to add it.');
      return;
    }

    await upsertChannel({
      ownerTelegramId: ctx.from.id,
      chatId: resolved.chatId,
      type: resolved.type,
      title: resolved.title,
      username: resolved.username,
    });

    await ctx.reply(`✅ "${resolved.title}" has been added.`, mainMenuKeyboard);
    return ctx.scene.leave();
  },
);

addChannelWizard.command('start', async (ctx) => {
  await ctx.scene.leave();
  await sendMainMenuOrLoginPrompt(ctx);
});
