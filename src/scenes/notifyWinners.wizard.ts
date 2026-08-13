import { Scenes } from 'telegraf';
import { BotContext } from '../types/context.types';
import { NotifyWinnersWizardState } from '../types/session.types';
import { Contest } from '../models/Contest.model';
import { CANCEL_ACTION, cancelInlineKeyboard } from '../keyboards/inline/cancel.inline';
import { sendStartMessage } from '../handlers/start.handler';

export const NOTIFY_WINNERS_WIZARD_ID = 'notifyWinnersWizard';

function getState(ctx: BotContext): NotifyWinnersWizardState {
  return ctx.wizard.state as NotifyWinnersWizardState;
}

export const notifyWinnersWizard = new Scenes.WizardScene<BotContext>(
  NOTIFY_WINNERS_WIZARD_ID,
  async (ctx) => {
    await ctx.reply("G'oliblarga yubormoqchi bo'lgan xabaringizni kiriting.", cancelInlineKeyboard);
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message) || !ctx.from) return;
    const { contestId } = getState(ctx);
    const text = ctx.message.text;

    const contest = await Contest.findById(contestId);
    if (
      !contest ||
      contest.removedAt ||
      contest.status !== 'completed' ||
      contest.ownerTelegramId !== ctx.from.id
    ) {
      await ctx.reply("Bu amal endi mavjud emas.", cancelInlineKeyboard);
      return ctx.scene.leave();
    }

    let sent = 0;
    let failed = 0;
    for (const winner of contest.winners) {
      try {
        await ctx.telegram.sendMessage(winner.telegramId, text);
        sent += 1;
      } catch {
        failed += 1;
      }
    }

    await ctx.reply(`✅ Yuborildi: ${sent}\n❌ Yuborilmadi: ${failed}`);
    return ctx.scene.leave();
  },
);

notifyWinnersWizard.action(CANCEL_ACTION, async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Amal bekor qilindi!');
  return ctx.scene.leave();
});

notifyWinnersWizard.command('start', async (ctx) => {
  await ctx.scene.leave();
  await sendStartMessage(ctx);
});
