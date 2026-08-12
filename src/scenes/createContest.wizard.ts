import { Scenes } from 'telegraf';
import { BotContext } from '../types/context.types';
import { ContestWizardState, createEmptyContestDraft } from '../types/session.types';
import { MediaType } from '../types/contest.types';
import { BUTTON_TEXT_PRESETS } from '../config/constants';
import { mainMenuKeyboard } from '../keyboards/mainMenu.keyboard';
import { CANCEL_ACTION, cancelInlineKeyboard } from '../keyboards/inline/cancel.inline';
import { PRESET_ACTION_PREFIX, buttonPresetsKeyboard } from '../keyboards/inline/buttonPresets.inline';
import {
  CONTEST_WITHOUT_SUBSCRIPTION_ACTION,
  REQUIRED_CHANNELS_DONE_ACTION,
  SELECT_PUBLISH_CHANNEL_ACTION_PREFIX,
  publishChannelSelectKeyboard,
  requiredChannelsKeyboardFor,
  requiredChannelsPromptKeyboard,
} from '../keyboards/inline/channelsList.inline';
import {
  PUBLISH_NOW_ACTION,
  PUBLISH_SCHEDULED_ACTION,
  publishTimeKeyboard,
} from '../keyboards/inline/publishTime.inline';
import {
  COMPLETE_BY_PARTICIPANTS_ACTION,
  COMPLETE_BY_TIME_ACTION,
  completionTypeKeyboard,
} from '../keyboards/inline/completionType.inline';
import {
  SAVE_CONTEST_ACTION,
  TOGGLE_BOOST_ACTION,
  TOGGLE_CAPTCHA_ACTION,
  reviewActionsKeyboard,
} from '../keyboards/inline/reviewActions.inline';
import {
  resolveChatFromInput,
  listUserChannels,
  findUserChannelByChatId,
  isBotAdmin,
} from '../services/channel.service';
import { createContest } from '../services/contest.service';
import {
  buildDatetimeExamples,
  formatTashkentDateTime,
  isFuture,
  parseTashkentDateTime,
} from '../utils/datetime';
import { buildReviewMessage } from '../utils/text';
import { sendMainMenuOrLoginPrompt } from '../handlers/start.handler';

export const CREATE_CONTEST_WIZARD_ID = 'createContestWizard';

const NOOP_ACTION = 'noop';

function getState(ctx: BotContext): ContestWizardState {
  return ctx.wizard.state as ContestWizardState;
}

type IncomingMessage = NonNullable<BotContext['message']>;

function extractMedia(
  message: IncomingMessage,
): { mediaType?: MediaType; mediaFileId?: string; text?: string } {
  if ('photo' in message && message.photo?.length) {
    return { mediaType: 'photo', mediaFileId: message.photo[message.photo.length - 1].file_id, text: message.caption };
  }
  if ('video' in message && message.video) {
    return { mediaType: 'video', mediaFileId: message.video.file_id, text: message.caption };
  }
  if ('animation' in message && message.animation) {
    return { mediaType: 'animation', mediaFileId: message.animation.file_id, text: message.caption };
  }
  if ('text' in message) {
    return { text: message.text };
  }
  return {};
}

async function promptCompletionType(ctx: BotContext): Promise<void> {
  await ctx.reply('🗓 How to complete the competition?', completionTypeKeyboard);
}

async function promptDatetime(ctx: BotContext, kind: 'publish' | 'complete'): Promise<void> {
  const question =
    kind === 'publish'
      ? '⏰ When should the contest be published? (Specify the time in dd.mm.yy hh:mm format)'
      : '🏁 When do you need to determine the winner? (Enter the time in the format dd.mm.yy hh:mm)';
  const timezoneNote =
    kind === 'publish'
      ? 'The bot operates on Tashkent time (GMT+5), Uzbekistan.'
      : 'The bot lives according to time (GMT+5) Tashkent, Uzbekistan';

  await ctx.reply(question);
  await ctx.reply(timezoneNote);
  await ctx.reply(buildDatetimeExamples());
}

async function sendReviewScreen(ctx: BotContext): Promise<void> {
  const { contest } = getState(ctx);
  const previewExtra = {
    reply_markup: { inline_keyboard: [[{ text: contest.buttonText as string, callback_data: NOOP_ACTION }]] },
  };

  if (contest.mediaType === 'photo' && contest.mediaFileId) {
    await ctx.replyWithPhoto(contest.mediaFileId, { caption: contest.text, ...previewExtra });
  } else if (contest.mediaType === 'video' && contest.mediaFileId) {
    await ctx.replyWithVideo(contest.mediaFileId, { caption: contest.text, ...previewExtra });
  } else if (contest.mediaType === 'animation' && contest.mediaFileId) {
    await ctx.replyWithAnimation(contest.mediaFileId, { caption: contest.text, ...previewExtra });
  } else {
    await ctx.reply(contest.text as string, previewExtra);
  }

  await ctx.reply(buildReviewMessage(contest), reviewActionsKeyboard(contest.useCaptcha, contest.boostForLuck));
}

export const createContestWizard = new Scenes.WizardScene<BotContext>(
  CREATE_CONTEST_WIZARD_ID,
  // Step 0 — entry: prompt for contest text/media.
  async (ctx) => {
    const state = getState(ctx);
    state.contest = createEmptyContestDraft();
    await ctx.reply(
      'Create a contest\n\n✉️ Submit your contest text. You can also submit an image, video, or GIF along with the text, using markup.\n❗️ You can only use one media file.\n\nThe contest bot is completely free and transparent. It will be happy if you include a link to it in your contest post. Thank you. @BestRandom_bot',
      cancelInlineKeyboard,
    );
    return ctx.wizard.next();
  },
  // Step 1 — capture text/media, prompt button text.
  async (ctx) => {
    if (!ctx.message) return;
    const { mediaType, mediaFileId, text } = extractMedia(ctx.message);
    if (!text) {
      await ctx.reply('Please send text (optionally with one photo/video/GIF attached).', cancelInlineKeyboard);
      return;
    }

    const state = getState(ctx);
    state.contest.text = text;
    state.contest.mediaType = mediaType;
    state.contest.mediaFileId = mediaFileId;

    await ctx.reply('✅ Text added');
    await ctx.reply(
      '📰 Submit the text that will appear on the button, or select one of the button options.',
      buttonPresetsKeyboard,
    );
    return ctx.wizard.next();
  },
  // Step 2 — capture button text, prompt required channels.
  async (ctx) => {
    const state = getState(ctx);
    let buttonText: string | undefined;

    if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
      const data = ctx.callbackQuery.data;
      if (data?.startsWith(PRESET_ACTION_PREFIX)) {
        const index = Number(data.slice(PRESET_ACTION_PREFIX.length));
        buttonText = BUTTON_TEXT_PRESETS[index];
        await ctx.answerCbQuery();
      }
    } else if (ctx.message && 'text' in ctx.message) {
      buttonText = ctx.message.text.trim();
    }

    if (!buttonText) {
      await ctx.reply('Please choose a preset or send the button text.', buttonPresetsKeyboard);
      return;
    }

    state.contest.buttonText = buttonText;
    await ctx.reply('✅ Button text saved');
    await ctx.reply(
      '📊 Add channels that users will need to subscribe to in order to participate in the contest.\nSubscription to the channel hosting the contest is required and enabled by default.\n\nTo add a channel:\n1. Add the bot (@BestRandom_bot) to your channel as an administrator (this is necessary so the bot can check whether the user is subscribed to the channel).\n2. Send the channel to the bot in the @channelname format (or forward a message from the channel).\n\n⚠️ If you want to allow users to participate in the contest without subscribing to the channel, click the button below:',
      requiredChannelsPromptKeyboard,
    );
    return ctx.wizard.next();
  },
  // Step 3 — accumulate required channels (loop) until opt-out or done.
  async (ctx) => {
    const state = getState(ctx);

    if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
      const data = ctx.callbackQuery.data;
      if (data === CONTEST_WITHOUT_SUBSCRIPTION_ACTION || data === REQUIRED_CHANNELS_DONE_ACTION) {
        await ctx.answerCbQuery();
        if (data === CONTEST_WITHOUT_SUBSCRIPTION_ACTION) {
          state.contest.requireSubscription = false;
          state.contest.requiredChannels = [];
        }
        await ctx.reply('✅ Saved');
        await ctx.reply('🧮 How many winners should the bot choose?');
        return ctx.wizard.next();
      }
      return;
    }

    if (ctx.message) {
      const forwardChatId =
        'forward_origin' in ctx.message && ctx.message.forward_origin?.type === 'channel'
          ? ctx.message.forward_origin.chat.id
          : undefined;
      const text = 'text' in ctx.message ? ctx.message.text : undefined;

      const resolved = await resolveChatFromInput(ctx.telegram, { text, forwardChatId });
      const currentCount = state.contest.requiredChannels.length;

      if (!resolved) {
        await ctx.reply(
          'I could not find that channel. Send @username or forward a message from it.',
          requiredChannelsKeyboardFor(currentCount),
        );
        return;
      }

      const botIsAdmin = await isBotAdmin(ctx.telegram, resolved.chatId);
      if (!botIsAdmin) {
        await ctx.reply(
          `⚠️ I'm not an administrator in "${resolved.title}". Please add @BestRandom_bot as an administrator there first, then send it again.`,
          requiredChannelsKeyboardFor(currentCount),
        );
        return;
      }

      state.contest.requiredChannels.push({
        chatId: resolved.chatId,
        title: resolved.title,
        username: resolved.username,
      });
      await ctx.reply(
        "✅ The channel has been added. You can add another one (simply keep sending channels) or proceed with creating the contest:\n\nDo not remove the bot's channel administrator rights, otherwise subscription verification will not work!",
        requiredChannelsKeyboardFor(state.contest.requiredChannels.length),
      );
    }
  },
  // Step 4 — capture winners count, prompt publish channel.
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message) || !ctx.from) return;
    const count = Number(ctx.message.text.trim());
    if (!Number.isInteger(count) || count <= 0) {
      await ctx.reply('Please send a valid whole number greater than 0.');
      return;
    }

    const state = getState(ctx);
    state.contest.winnersCount = count;
    await ctx.reply(`✅ Number of winners saved: ${count}`);

    const channels = await listUserChannels(ctx.from.id);
    if (channels.length === 0) {
      await ctx.reply(
        'You have not added any channels yet. Add one from "My channels" first, then start over with "Create contest".',
        mainMenuKeyboard,
      );
      return ctx.scene.leave();
    }

    await ctx.reply('🗓 On which channel will we publish the competition?', publishChannelSelectKeyboard(channels));
    return ctx.wizard.next();
  },
  // Step 5 — capture publish channel, prompt publish time.
  async (ctx) => {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery) || !ctx.from) return;
    const data = ctx.callbackQuery.data;
    if (!data?.startsWith(SELECT_PUBLISH_CHANNEL_ACTION_PREFIX)) return;

    const chatId = Number(data.slice(SELECT_PUBLISH_CHANNEL_ACTION_PREFIX.length));
    const channel = await findUserChannelByChatId(ctx.from.id, chatId);
    if (!channel) {
      await ctx.answerCbQuery('Channel not found, please pick again.');
      return;
    }
    await ctx.answerCbQuery();

    const state = getState(ctx);
    state.contest.publishChannelId = channel.chatId;
    state.contest.publishChannelTitle = channel.title;

    await ctx.reply('⏰ When should I publish the competition?', publishTimeKeyboard);
    return ctx.wizard.next();
  },
  // Step 6 — capture publish-time choice.
  async (ctx) => {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;
    const data = ctx.callbackQuery.data;
    const state = getState(ctx);
    await ctx.answerCbQuery();

    if (data === PUBLISH_NOW_ACTION) {
      state.contest.publishType = 'now';
      await ctx.reply('✅ The publication time has been selected');
      await promptCompletionType(ctx);
      return ctx.wizard.selectStep(8);
    }

    if (data === PUBLISH_SCHEDULED_ACTION) {
      state.contest.publishType = 'scheduled';
      await promptDatetime(ctx, 'publish');
      return ctx.wizard.next();
    }
  },
  // Step 7 — capture scheduled publish datetime.
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    const state = getState(ctx);

    const parsed = parseTashkentDateTime(ctx.message.text);
    if (!parsed || !isFuture(parsed)) {
      await ctx.reply('Please send a valid future date in the format dd.mm.yyyy hh:mm.');
      return;
    }

    state.contest.publishAt = parsed;
    await ctx.reply('✅ The publication time has been selected');
    await promptCompletionType(ctx);
    return ctx.wizard.selectStep(8);
  },
  // Step 8 — capture completion-type choice.
  async (ctx) => {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;
    const data = ctx.callbackQuery.data;
    const state = getState(ctx);
    await ctx.answerCbQuery();

    if (data === COMPLETE_BY_PARTICIPANTS_ACTION) {
      state.contest.completionType = 'by_participants';
      await ctx.reply(
        '🏁 Specify the number of participants for the contest:\n\n❗️ Please note: a "participant" is someone who has actually entered the contest. The selection will be based on the number of participants (those who clicked the contest button), not the channel\'s subscriber count.',
      );
      return ctx.wizard.selectStep(9);
    }

    if (data === COMPLETE_BY_TIME_ACTION) {
      state.contest.completionType = 'by_time';
      await promptDatetime(ctx, 'complete');
      return ctx.wizard.selectStep(10);
    }
  },
  // Step 9 — capture participants threshold, show review.
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    const count = Number(ctx.message.text.trim());
    if (!Number.isInteger(count) || count <= 0) {
      await ctx.reply('Please send a valid whole number greater than 0.');
      return;
    }

    const state = getState(ctx);
    state.contest.participantsThreshold = count;
    await ctx.reply(`✅ Number of participants retained for determining results: ${count}`);
    await sendReviewScreen(ctx);
    return ctx.wizard.selectStep(11);
  },
  // Step 10 — capture completion datetime, show review.
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    const state = getState(ctx);

    const parsed = parseTashkentDateTime(ctx.message.text);
    const publishAt = state.contest.publishType === 'now' ? new Date() : state.contest.publishAt;
    if (!parsed || !isFuture(parsed) || (publishAt && parsed <= publishAt)) {
      await ctx.reply(
        `Please send a valid future date (after the publish time${publishAt ? ` — ${formatTashkentDateTime(publishAt)}` : ''}) in the format dd.mm.yyyy hh:mm.`,
      );
      return;
    }

    state.contest.completeAt = parsed;
    await ctx.reply('✅ Time for summing up the results has been saved');
    await sendReviewScreen(ctx);
    return ctx.wizard.selectStep(11);
  },
  // Step 11 — review: toggle flags or save.
  async (ctx) => {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery) || !ctx.from) return;
    const data = ctx.callbackQuery.data;
    const state = getState(ctx);

    if (data === TOGGLE_CAPTCHA_ACTION || data === TOGGLE_BOOST_ACTION) {
      if (data === TOGGLE_CAPTCHA_ACTION) state.contest.useCaptcha = !state.contest.useCaptcha;
      else state.contest.boostForLuck = !state.contest.boostForLuck;

      await ctx.answerCbQuery();
      await ctx.editMessageReplyMarkup(
        reviewActionsKeyboard(state.contest.useCaptcha, state.contest.boostForLuck).reply_markup,
      );
      return;
    }

    if (data === SAVE_CONTEST_ACTION) {
      await ctx.answerCbQuery();
      await createContest(ctx.from.id, state.contest, ctx.telegram);
      await ctx.reply(
        '✅ The contest has been saved and is being prepared for publication.\n\nTo open the menu, type /start',
      );
      return ctx.scene.leave();
    }
  },
);

createContestWizard.action(CANCEL_ACTION, async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Action cancelled!', mainMenuKeyboard);
  return ctx.scene.leave();
});

// Registered on the scene itself (not the step array), so it interrupts any step.
createContestWizard.command('start', async (ctx) => {
  await ctx.scene.leave();
  await sendMainMenuOrLoginPrompt(ctx);
});

createContestWizard.action(NOOP_ACTION, async (ctx) => {
  await ctx.answerCbQuery();
});
