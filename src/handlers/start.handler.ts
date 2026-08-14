import { Telegraf } from 'telegraf';
import { BotContext } from '../types/context.types';
import { getOrCreateUser, sendStartMessage } from '../services/user.service';
import { joinContest, replyJoinResult } from '../services/participant.service';
import { JOIN_PAYLOAD_PREFIX } from '../keyboards/inline/contestPost.inline';
import { ADMIN_INVITE_PAYLOAD_PREFIX, consumeAdminInvite } from '../services/adminInvite.service';
import { Contest } from '../models/Contest.model';
import { CAPTCHA_JOIN_WIZARD_ID } from '../scenes/wizardIds';

export { sendStartMessage };

async function handleContestJoinDeepLink(ctx: BotContext, contestId: string): Promise<void> {
  if (!ctx.from) return;

  const contest = await Contest.findById(contestId);
  if (!contest || contest.status !== 'published') {
    await ctx.reply('Bu konkurs endi faol emas.');
    return;
  }

  if (contest.useCaptcha) {
    await ctx.scene.enter(CAPTCHA_JOIN_WIZARD_ID, { contestId });
    return;
  }

  const result = await joinContest(ctx.telegram, contestId, {
    telegramId: ctx.from.id,
    username: ctx.from.username,
  });
  await replyJoinResult(ctx, result);
}

async function handleAdminInviteDeepLink(ctx: BotContext, token: string): Promise<void> {
  if (!ctx.from) return;

  const invite = await consumeAdminInvite(token, ctx.from.id);
  if (!invite) {
    await ctx.reply("Ushbu havola yaroqsiz yoki muddati o'tgan.");
    await sendStartMessage(ctx);
    return;
  }

  const user = await getOrCreateUser(ctx.from);
  if (user.role !== 'superadmin') {
    user.role = 'admin';
    await user.save();
  }

  await ctx.reply('🎉 Siz admin etib tayinlandingiz!');
  await sendStartMessage(ctx);

  try {
    const label = ctx.from.username ? `@${ctx.from.username}` : `ID ${ctx.from.id}`;
    await ctx.telegram.sendMessage(invite.createdBy, `✅ ${label} admin etib qo'shildi.`);
  } catch {
    // Superadmin's chat may be unavailable — nothing to do.
  }
}

/**
 * Telegraf's ctx.startPayload getter is only type-narrowed inside bot.start()'s own callback,
 * not in a plain .command('start', ...) registered directly on a scene (which is how every
 * wizard's escape hatch reaches this function) — so the payload is parsed directly off the
 * message text instead, which works identically in both cases.
 */
function extractStartPayload(ctx: BotContext): string | undefined {
  if (!ctx.message || !('text' in ctx.message)) return undefined;
  const spaceIndex = ctx.message.text.indexOf(' ');
  if (spaceIndex === -1) return undefined;
  return ctx.message.text.slice(spaceIndex + 1).trim();
}

/**
 * The full "/start [payload]" dispatch — deep-link aware. Exported so every wizard scene's
 * own `.command('start', ...)` escape hatch can reuse it instead of unconditionally showing
 * the generic menu: Telegraf's `.command('start', ...)` matches "/start <anything>", so a
 * scene that only called sendStartMessage() there would silently swallow a join_/admin_
 * payload from someone tapping a deep link while still stuck in that scene.
 */
export async function handleStartCommand(ctx: BotContext): Promise<void> {
  const payload = extractStartPayload(ctx);
  if (payload?.startsWith(JOIN_PAYLOAD_PREFIX)) {
    await handleContestJoinDeepLink(ctx, payload.slice(JOIN_PAYLOAD_PREFIX.length));
    return;
  }
  if (payload?.startsWith(ADMIN_INVITE_PAYLOAD_PREFIX)) {
    await handleAdminInviteDeepLink(ctx, payload.slice(ADMIN_INVITE_PAYLOAD_PREFIX.length));
    return;
  }

  await sendStartMessage(ctx);
}

export function registerStartHandler(bot: Telegraf<BotContext>): void {
  bot.start(async (ctx) => {
    if (ctx.scene.current) await ctx.scene.leave();
    await handleStartCommand(ctx);
  });
}
