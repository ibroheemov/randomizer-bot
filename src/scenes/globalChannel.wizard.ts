import { Scenes } from 'telegraf';
import { BotContext } from '../types/context.types';
import { isBotAdmin, resolveChatFromInput } from '../services/channel.service';
import { addGlobalChannel } from '../services/globalChannel.service';
import { mainMenuKeyboard } from '../keyboards/mainMenu.keyboard';
import { handleStartCommand } from '../handlers/start.handler';
import { getOrCreateUser } from '../services/user.service';
import { GLOBAL_CHANNEL_WIZARD_ID } from './wizardIds';

export { GLOBAL_CHANNEL_WIZARD_ID };

export const globalChannelWizard = new Scenes.WizardScene<BotContext>(
  GLOBAL_CHANNEL_WIZARD_ID,
  async (ctx) => {
    await ctx.reply(
      "Majburiy kanal/guruhni menga @username formatida yuboring yoki undan xabarni forward qiling (yopiq chatlar uchun: xabarni forward qiling yoki undagi istalgan xabar havolasini yuboring).",
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
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

    const botIsAdmin = await isBotAdmin(ctx.telegram, resolved.chatId);
    if (!botIsAdmin) {
      await ctx.reply(
        "⚠️ Avval meni u yerga xabar joylash huquqiga ega administrator qilib qo'shishingiz kerak. Qo'shgach, qaytadan yuboring.",
      );
      return;
    }

    await addGlobalChannel({
      chatId: resolved.chatId,
      type: resolved.type,
      title: resolved.title,
      username: resolved.username,
      addedBy: ctx.from.id,
    });

    const user = await getOrCreateUser(ctx.from);
    await ctx.reply(`✅ "${resolved.title}" majburiy kanallar ro'yxatiga qo'shildi.`, mainMenuKeyboard(user.role));
    return ctx.scene.leave();
  },
);

globalChannelWizard.command('start', async (ctx) => {
  await ctx.scene.leave();
  await handleStartCommand(ctx);
});
