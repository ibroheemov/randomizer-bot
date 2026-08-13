import { Scenes, Telegraf } from 'telegraf';
import { env } from './config/env';
import { BotContext } from './types/context.types';
import { sessionMiddleware } from './middleware/session.middleware';
import { attachUser } from './middleware/attachUser.middleware';
import { createContestWizard } from './scenes/createContest.wizard';
import { addChannelWizard } from './scenes/addChannel.wizard';
import { notifyWinnersWizard } from './scenes/notifyWinners.wizard';
import { broadcastWizard } from './scenes/broadcast.wizard';
import { registerStartHandler } from './handlers/start.handler';
import { registerMainMenuHandlers } from './handlers/mainMenu.handler';
import { registerMyChannelsHandlers } from './handlers/myChannels.handler';
import { registerMyContestsHandlers } from './handlers/myContests.handler';
import { registerSupportHandler } from './handlers/support.handler';
import { registerAdminManagementHandlers } from './handlers/adminManagement.handler';
import { registerBroadcastHandlers } from './handlers/broadcast.handler';
import { registerBotMembershipHandler } from './handlers/botMembership.handler';
import { registerBotUsersHandler } from './handlers/botUsers.handler';

export const bot = new Telegraf<BotContext>(env.BOT_TOKEN);

const stage = new Scenes.Stage<BotContext>([
  createContestWizard,
  addChannelWizard,
  notifyWinnersWizard,
  broadcastWizard,
]);

bot.use(sessionMiddleware);

// Must run before any handler touches ctx.scene/ctx.wizard (including /start, which
// calls ctx.scene.leave()). When a scene is active this also dispatches the update
// straight into it; otherwise it calls next() and falls through to the handlers below.
bot.use(stage.middleware());

// Ensures every interacting user has a fresh User/role record. Never blocks — authorization
// is enforced per-handler via requireRole(), not centrally here.
bot.use(attachUser);

// Contest joining now happens via a deep link ("/start join_<id>"), handled inside
// registerStartHandler — there's no separate public-join callback handler anymore.
registerStartHandler(bot);

registerMainMenuHandlers(bot);
registerMyChannelsHandlers(bot);
registerMyContestsHandlers(bot);
registerSupportHandler(bot);
registerAdminManagementHandlers(bot);
registerBroadcastHandlers(bot);
registerBotMembershipHandler(bot);
registerBotUsersHandler(bot);

bot.catch((err, ctx) => {
  console.error(`[bot] error while handling update ${ctx.updateType}`, err);
});
