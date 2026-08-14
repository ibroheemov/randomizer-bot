import { Scenes } from 'telegraf';
import { BotContext } from '../types/context.types';
import { User } from '../models/User.model';
import { CANCEL_ACTION, cancelInlineKeyboard } from '../keyboards/inline/cancel.inline';
import { handleStartCommand } from '../handlers/start.handler';
import { BROADCAST_WIZARD_ID } from './wizardIds';

export { BROADCAST_WIZARD_ID };

export const broadcastWizard = new Scenes.WizardScene<BotContext>(
  BROADCAST_WIZARD_ID,
  async (ctx) => {
    await ctx.reply(
      'Xabar matnini yuboring, u barcha oddiy foydalanuvchilarga yuboriladi.',
      cancelInlineKeyboard,
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    const text = ctx.message.text;

    const users = await User.find({ role: 'user' });

    let sent = 0;
    let failed = 0;
    for (const user of users) {
      try {
        await ctx.telegram.sendMessage(user.telegramId, text);
        sent += 1;
      } catch {
        failed += 1;
      }
    }

    await ctx.reply(`✅ Yuborildi: ${sent}\n❌ Yuborilmadi: ${failed}`);
    return ctx.scene.leave();
  },
);

broadcastWizard.action(CANCEL_ACTION, async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Amal bekor qilindi!');
  return ctx.scene.leave();
});

broadcastWizard.command('start', async (ctx) => {
  await ctx.scene.leave();
  await handleStartCommand(ctx);
});
