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
import { handleStartCommand } from '../handlers/start.handler';
import { getOrCreateUser } from '../services/user.service';
import { ADD_CHANNEL_WIZARD_ID } from './wizardIds';

export { ADD_CHANNEL_WIZARD_ID };

function getState(ctx: BotContext): AddChannelWizardState {
  return ctx.wizard.state as AddChannelWizardState;
}

export const addChannelWizard = new Scenes.WizardScene<BotContext>(
  ADD_CHANNEL_WIZARD_ID,
  async (ctx) => {
    const state = getState(ctx);
    const kindLabel = state.kind === 'group' ? 'guruh' : 'kanal';
    await ctx.reply(
      `${kindLabel}ni menga @username formatida yuboring yoki undan xabarni forward qiling (yopiq chatlar uchun: xabarni forward qiling yoki undagi istalgan xabar havolasini yuboring).`,
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
      await ctx.reply("Bunday chat topilmadi. @username yuboring yoki undan xabarni forward qiling.");
      return;
    }

    const expectedTypes = state.kind === 'group' ? ['group', 'supergroup'] : ['channel'];
    if (!expectedTypes.includes(resolved.type)) {
      await ctx.reply(
        state.kind === 'group'
          ? "Bu guruh emas, kanalga o'xshaydi. Iltimos, guruh yuboring yoki \"Kanal qo'shish\"dan foydalaning."
          : "Bu kanal emas, guruhga o'xshaydi. Iltimos, kanal yuboring yoki \"Guruh qo'shish\"dan foydalaning.",
      );
      return;
    }

    const botIsAdmin = await isBotAdmin(ctx.telegram, resolved.chatId);
    if (!botIsAdmin) {
      await ctx.reply(
        "⚠️ Avval meni u yerga xabar joylash huquqiga ega administrator qilib qo'shishingiz kerak. Qo'shgach, qaytadan yuboring.",
      );
      return;
    }

    const userIsAdmin = await isUserAdmin(ctx.telegram, resolved.chatId, ctx.from.id);
    if (!userIsAdmin) {
      await ctx.reply("⚠️ Uni qo'shish uchun siz shu chatning administratori bo'lishingiz kerak.");
      return;
    }

    await upsertChannel({
      ownerTelegramId: ctx.from.id,
      chatId: resolved.chatId,
      type: resolved.type,
      title: resolved.title,
      username: resolved.username,
    });

    const user = await getOrCreateUser(ctx.from);
    await ctx.reply(`✅ "${resolved.title}" qo'shildi.`, mainMenuKeyboard(user.role));
    return ctx.scene.leave();
  },
);

addChannelWizard.command('start', async (ctx) => {
  await ctx.scene.leave();
  await handleStartCommand(ctx);
});
