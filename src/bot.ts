import { Scenes, Telegraf } from 'telegraf';
import { env } from './config/env';
import { BotContext } from './types/context.types';
import { sessionMiddleware } from './middleware/session.middleware';
import { authGate, registerAuthHandlers } from './middleware/auth.middleware';
import { createContestWizard } from './scenes/createContest.wizard';
import { addChannelWizard } from './scenes/addChannel.wizard';
import { registerStartHandler } from './handlers/start.handler';
import { registerMainMenuHandlers } from './handlers/mainMenu.handler';
import { registerMyChannelsHandlers } from './handlers/myChannels.handler';
import { registerMyContestsHandlers } from './handlers/myContests.handler';
import { registerSupportHandler } from './handlers/support.handler';
import { registerContestJoinHandler } from './handlers/contestJoin.handler';

export const bot = new Telegraf<BotContext>(env.BOT_TOKEN);

const stage = new Scenes.Stage<BotContext>([createContestWizard, addChannelWizard]);

bot.use(sessionMiddleware);

// Must run before any handler touches ctx.scene/ctx.wizard (including /start, which
// calls ctx.scene.leave()). When a scene is active this also dispatches the update
// straight into it; otherwise it calls next() and falls through to the handlers below.
bot.use(stage.middleware());

// Must run before the login gate: /start and /admin-<id> are reachable pre-login.
registerAuthHandlers(bot);
registerStartHandler(bot);

bot.use(authGate);

// The public join button is exempt from the gate (handled inside authGate itself).
registerContestJoinHandler(bot);
registerMainMenuHandlers(bot);
registerMyChannelsHandlers(bot);
registerMyContestsHandlers(bot);
registerSupportHandler(bot);

bot.catch((err, ctx) => {
  console.error(`[bot] error while handling update ${ctx.updateType}`, err);
});
