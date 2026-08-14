import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context.types';
import { MAIN_MENU_BUTTONS } from '../keyboards/mainMenu.keyboard';
import {
  ADD_GLOBAL_CHANNEL_ACTION,
  REMOVE_GLOBAL_CHANNEL_ACTION_PREFIX,
  TOGGLE_GLOBAL_CHANNELS_ACTION,
  globalChannelsKeyboard,
  globalChannelsMessage,
} from '../keyboards/inline/globalChannels.inline';
import {
  isGlobalChannelsEnabled,
  listGlobalChannels,
  removeGlobalChannel,
  setGlobalChannelsEnabled,
} from '../services/globalChannel.service';
import { GLOBAL_CHANNEL_WIZARD_ID } from '../scenes/globalChannel.wizard';
import { requireRole } from '../services/user.service';

async function replyGlobalChannelsScreen(ctx: BotContext): Promise<void> {
  const [enabled, channels] = await Promise.all([isGlobalChannelsEnabled(), listGlobalChannels()]);
  await ctx.reply(globalChannelsMessage(enabled, channels), globalChannelsKeyboard(enabled, channels));
}

async function editGlobalChannelsScreen(ctx: BotContext): Promise<void> {
  const [enabled, channels] = await Promise.all([isGlobalChannelsEnabled(), listGlobalChannels()]);
  await ctx.editMessageText(globalChannelsMessage(enabled, channels), globalChannelsKeyboard(enabled, channels));
}

export function registerGlobalChannelsHandlers(bot: Telegraf<BotContext>): void {
  bot.hears(MAIN_MENU_BUTTONS.GLOBAL_CHANNELS, async (ctx) => {
    const user = await requireRole(ctx, 'superadmin');
    if (!user) return;
    await replyGlobalChannelsScreen(ctx);
  });

  bot.action(TOGGLE_GLOBAL_CHANNELS_ACTION, async (ctx) => {
    const user = await requireRole(ctx, 'superadmin');
    if (!user) {
      await ctx.answerCbQuery();
      return;
    }

    const currentlyEnabled = await isGlobalChannelsEnabled();
    await setGlobalChannelsEnabled(!currentlyEnabled);
    await ctx.answerCbQuery(!currentlyEnabled ? 'Yoqildi' : "O'chirildi");
    await editGlobalChannelsScreen(ctx);
  });

  bot.action(ADD_GLOBAL_CHANNEL_ACTION, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await requireRole(ctx, 'superadmin');
    if (!user) return;
    await ctx.scene.enter(GLOBAL_CHANNEL_WIZARD_ID);
  });

  bot.action(new RegExp(`^${REMOVE_GLOBAL_CHANNEL_ACTION_PREFIX}(-?\\d+)$`), async (ctx) => {
    const user = await requireRole(ctx, 'superadmin');
    if (!user) {
      await ctx.answerCbQuery();
      return;
    }

    const chatId = Number(ctx.match[1]);
    await removeGlobalChannel(chatId);
    await ctx.answerCbQuery("O'chirildi");
    await editGlobalChannelsScreen(ctx);
  });
}
