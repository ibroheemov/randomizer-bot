import { Scenes } from 'telegraf';
import { BotContext } from '../types/context.types';
import { ContestWizardState, createEmptyContestDraft } from '../types/session.types';
import { MediaType, MessageEntity } from '../types/contest.types';
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
import { OPEN_CAPTCHA_INFO_ACTION, SAVE_CONTEST_ACTION, reviewActionsKeyboard } from '../keyboards/inline/reviewActions.inline';
import {
  CAPTCHA_INFO_BACK_ACTION,
  CAPTCHA_INFO_TEXT,
  TOGGLE_CAPTCHA_ACTION,
  captchaInfoKeyboard,
} from '../keyboards/inline/captchaInfo.inline';
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
import { sendStartMessage } from '../handlers/start.handler';
import { getOrCreateUser } from '../services/user.service';

export const CREATE_CONTEST_WIZARD_ID = 'createContestWizard';

const NOOP_ACTION = 'noop';

function getState(ctx: BotContext): ContestWizardState {
  return ctx.wizard.state as ContestWizardState;
}

type IncomingMessage = NonNullable<BotContext['message']>;

function extractMedia(
  message: IncomingMessage,
): { mediaType?: MediaType; mediaFileId?: string; text?: string; textEntities?: MessageEntity[] } {
  if ('photo' in message && message.photo?.length) {
    return {
      mediaType: 'photo',
      mediaFileId: message.photo[message.photo.length - 1].file_id,
      text: message.caption,
      textEntities: message.caption_entities,
    };
  }
  if ('video' in message && message.video) {
    return {
      mediaType: 'video',
      mediaFileId: message.video.file_id,
      text: message.caption,
      textEntities: message.caption_entities,
    };
  }
  if ('animation' in message && message.animation) {
    return {
      mediaType: 'animation',
      mediaFileId: message.animation.file_id,
      text: message.caption,
      textEntities: message.caption_entities,
    };
  }
  if ('document' in message && message.document) {
    return {
      mediaType: 'document',
      mediaFileId: message.document.file_id,
      text: message.caption,
      textEntities: message.caption_entities,
    };
  }
  if ('text' in message) {
    return { text: message.text, textEntities: message.entities };
  }
  return {};
}

function isApkDocument(message: IncomingMessage): boolean {
  if (!('document' in message) || !message.document) return true;
  const fileName = message.document.file_name ?? '';
  return fileName.toLowerCase().endsWith('.apk');
}

async function promptCompletionType(ctx: BotContext): Promise<void> {
  await ctx.reply('🗓 Konkurs qanday yakunlansin?', completionTypeKeyboard);
}

async function promptDatetime(ctx: BotContext, kind: 'publish' | 'complete'): Promise<void> {
  const question =
    kind === 'publish'
      ? "⏰ Konkurs qachon e'lon qilinsin? (Vaqtni dd.mm.yy hh:mm formatida kiriting)"
      : "🏁 G'olibni qachon aniqlash kerak? (Vaqtni dd.mm.yy hh:mm formatida kiriting)";
  const timezoneNote =
    kind === 'publish'
      ? "Bot Toshkent vaqti (GMT+5), O'zbekiston bo'yicha ishlaydi."
      : "Bot Toshkent (GMT+5), O'zbekiston vaqti bo'yicha ishlaydi";

  await ctx.reply(question);
  await ctx.reply(timezoneNote);
  await ctx.reply(buildDatetimeExamples());
}

async function sendReviewScreen(ctx: BotContext): Promise<void> {
  const { contest } = getState(ctx);
  const buttonRow = { inline_keyboard: [[{ text: contest.buttonText as string, callback_data: NOOP_ACTION }]] };
  const captionExtra = {
    reply_markup: buttonRow,
    caption_entities: contest.textEntities,
  };

  if (contest.mediaType === 'photo' && contest.mediaFileId) {
    await ctx.replyWithPhoto(contest.mediaFileId, { caption: contest.text, ...captionExtra });
  } else if (contest.mediaType === 'video' && contest.mediaFileId) {
    await ctx.replyWithVideo(contest.mediaFileId, { caption: contest.text, ...captionExtra });
  } else if (contest.mediaType === 'animation' && contest.mediaFileId) {
    await ctx.replyWithAnimation(contest.mediaFileId, { caption: contest.text, ...captionExtra });
  } else if (contest.mediaType === 'document' && contest.mediaFileId) {
    await ctx.replyWithDocument(contest.mediaFileId, { caption: contest.text, ...captionExtra });
  } else {
    await ctx.reply(contest.text as string, { reply_markup: buttonRow, entities: contest.textEntities });
  }

  await ctx.reply(buildReviewMessage(contest), reviewActionsKeyboard(contest.useCaptcha));
}

export const createContestWizard = new Scenes.WizardScene<BotContext>(
  CREATE_CONTEST_WIZARD_ID,
  // Step 0 — entry: prompt for contest text/media.
  async (ctx) => {
    const state = getState(ctx);
    state.contest = createEmptyContestDraft();
    await ctx.reply(
      "Konkurs yaratish\n\n✉️ Konkurs matningizni yuboring. Matn bilan birga rasm, video, GIF yoki .apk fayl ham yuborishingiz mumkin, formatlashdan foydalanib.\n❗️ Faqat bitta media fayldan foydalanishingiz mumkin.\n\nKonkurs boti butunlay bepul va shaffof ishlaydi. Konkurs postingizga bot havolasini qo'shsangiz, xursand bo'lamiz. Rahmat. @BestRandom_bot",
      cancelInlineKeyboard,
    );
    return ctx.wizard.next();
  },
  // Step 1 — capture text/media, prompt button text.
  async (ctx) => {
    if (!ctx.message) return;

    if (!isApkDocument(ctx.message)) {
      await ctx.reply(
        'Hujjat sifatida faqat .apk fayllarni yuborishingiz mumkin.',
        cancelInlineKeyboard,
      );
      return;
    }

    const { mediaType, mediaFileId, text, textEntities } = extractMedia(ctx.message);
    if (!text) {
      await ctx.reply(
        "Iltimos, matn yuboring (xohlasangiz bitta rasm/video/GIF yoki .apk fayl biriktirishingiz mumkin).",
        cancelInlineKeyboard,
      );
      return;
    }

    const state = getState(ctx);
    state.contest.text = text;
    state.contest.textEntities = textEntities;
    state.contest.mediaType = mediaType;
    state.contest.mediaFileId = mediaFileId;

    await ctx.reply("✅ Matn qo'shildi");
    await ctx.reply(
      "📰 Tugmada ko'rinadigan matnni yuboring yoki quyidagi variantlardan birini tanlang.",
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
      await ctx.reply('Iltimos, tayyor variantni tanlang yoki tugma matnini yuboring.', buttonPresetsKeyboard);
      return;
    }

    state.contest.buttonText = buttonText;
    await ctx.reply('✅ Tugma matni saqlandi');
    await ctx.reply(
      "📊 Konkursda ishtirok etish uchun foydalanuvchilar obuna bo'lishi kerak bo'lgan kanallarni qo'shing.\nKonkurs joylashtirilgan kanalga obuna bo'lish shart va bu sozlama sukut bo'yicha yoqilgan.\n\nKanal qo'shish uchun:\n1. Botni (@BestRandom_bot) kanalingizga administrator sifatida qo'shing (bu foydalanuvchining kanalga obuna bo'lgan-bo'lmaganini tekshirish uchun zarur).\n2. Kanalni botga @kanalnomi formatida yuboring (yoki kanaldagi xabarni forward qiling).\n\n⚠️ Agar foydalanuvchilarga kanalga obuna bo'lmasdan ham konkursda ishtirok etishga ruxsat bermoqchi bo'lsangiz, quyidagi tugmani bosing:",
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
        await ctx.reply('✅ Saqlandi');
        await ctx.reply("🧮 Bot nechta g'olibni tanlashi kerak?");
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
          "Bunday kanal topilmadi. @username yuboring yoki undan xabarni forward qiling.",
          requiredChannelsKeyboardFor(currentCount),
        );
        return;
      }

      const botIsAdmin = await isBotAdmin(ctx.telegram, resolved.chatId);
      if (!botIsAdmin) {
        await ctx.reply(
          `⚠️ Men "${resolved.title}" kanalida administrator emasman. Iltimos, avval @BestRandom_bot ni u yerga administrator qilib qo'shing, so'ng qaytadan yuboring.`,
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
        "✅ Kanal qo'shildi. Yana bittasini qo'shishingiz mumkin (kanallarni yuborishda davom eting) yoki konkurs yaratishni davom ettiring:\n\nBotning kanaldagi administrator huquqlarini olib tashlamang, aks holda obunani tekshirib bo'lmaydi!",
        requiredChannelsKeyboardFor(state.contest.requiredChannels.length),
      );
    }
  },
  // Step 4 — capture winners count, prompt publish channel.
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message) || !ctx.from) return;
    const count = Number(ctx.message.text.trim());
    if (!Number.isInteger(count) || count <= 0) {
      await ctx.reply('Iltimos, 0 dan katta butun son yuboring.');
      return;
    }

    const state = getState(ctx);
    state.contest.winnersCount = count;
    await ctx.reply(`✅ G'oliblar soni saqlandi: ${count}`);

    const channels = await listUserChannels(ctx.from.id);
    if (channels.length === 0) {
      const user = await getOrCreateUser(ctx.from);
      await ctx.reply(
        'Sizda hali kanallar yo\'q. Avval "Kanallarim" bo\'limidan kanal qo\'shing, so\'ng "Konkurs yaratish"ni qaytadan boshlang.',
        mainMenuKeyboard(user.role),
      );
      return ctx.scene.leave();
    }

    await ctx.reply("🗓 Konkursni qaysi kanalda e'lon qilamiz?", publishChannelSelectKeyboard(channels));
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
      await ctx.answerCbQuery('Kanal topilmadi, qaytadan tanlang.');
      return;
    }
    await ctx.answerCbQuery();

    const state = getState(ctx);
    state.contest.publishChannelId = channel.chatId;
    state.contest.publishChannelTitle = channel.title;

    await ctx.reply("⏰ Konkursni qachon e'lon qilay?", publishTimeKeyboard);
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
      await ctx.reply("✅ E'lon qilish vaqti tanlandi");
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
      await ctx.reply('Iltimos, dd.mm.yyyy hh:mm formatida haqiqiy kelajakdagi sanani yuboring.');
      return;
    }

    state.contest.publishAt = parsed;
    await ctx.reply("✅ E'lon qilish vaqti tanlandi");
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
        '🏁 Konkurs uchun ishtirokchilar sonini belgilang:\n\n❗️ E\'tibor bering: "ishtirokchi" — bu konkursga haqiqatan ham qo\'shilgan kishi. Tanlov ishtirokchilar soniga (konkurs tugmasini bosganlar) asoslanadi, kanal obunachilari soniga emas.',
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
      await ctx.reply('Iltimos, 0 dan katta butun son yuboring.');
      return;
    }

    const state = getState(ctx);
    state.contest.participantsThreshold = count;
    await ctx.reply(`✅ Natijalarni aniqlash uchun ishtirokchilar soni saqlandi: ${count}`);
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
        `Iltimos, dd.mm.yyyy hh:mm formatida haqiqiy kelajakdagi sanani yuboring (e'lon qilish vaqtidan${publishAt ? ` — ${formatTashkentDateTime(publishAt)}` : ''} keyin bo'lishi kerak).`,
      );
      return;
    }

    state.contest.completeAt = parsed;
    await ctx.reply('✅ Natijalarni yakunlash vaqti saqlandi');
    await sendReviewScreen(ctx);
    return ctx.wizard.selectStep(11);
  },
  // Step 11 — review: drill into captcha info, toggle it there, or save.
  async (ctx) => {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery) || !ctx.from) return;
    const data = ctx.callbackQuery.data;
    const state = getState(ctx);

    if (data === OPEN_CAPTCHA_INFO_ACTION) {
      await ctx.answerCbQuery();
      await ctx.editMessageText(CAPTCHA_INFO_TEXT, captchaInfoKeyboard(state.contest.useCaptcha));
      return;
    }

    if (data === TOGGLE_CAPTCHA_ACTION) {
      state.contest.useCaptcha = !state.contest.useCaptcha;
      await ctx.answerCbQuery();
      await ctx.editMessageReplyMarkup(captchaInfoKeyboard(state.contest.useCaptcha).reply_markup);
      return;
    }

    if (data === CAPTCHA_INFO_BACK_ACTION) {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        buildReviewMessage(state.contest),
        reviewActionsKeyboard(state.contest.useCaptcha),
      );
      return;
    }

    if (data === SAVE_CONTEST_ACTION) {
      await ctx.answerCbQuery();
      await createContest(ctx.from.id, state.contest, ctx.telegram);
      await ctx.reply(
        "✅ Konkurs saqlandi va e'lon qilishga tayyorlanmoqda.\n\nMenyuni ochish uchun /start deb yozing",
      );
      return ctx.scene.leave();
    }
  },
);

createContestWizard.action(CANCEL_ACTION, async (ctx) => {
  await ctx.answerCbQuery();
  const role = ctx.from ? (await getOrCreateUser(ctx.from)).role : 'user';
  await ctx.reply('Amal bekor qilindi!', mainMenuKeyboard(role));
  return ctx.scene.leave();
});

// Registered on the scene itself (not the step array), so it interrupts any step.
createContestWizard.command('start', async (ctx) => {
  await ctx.scene.leave();
  await sendStartMessage(ctx);
});

createContestWizard.action(NOOP_ACTION, async (ctx) => {
  await ctx.answerCbQuery();
});
