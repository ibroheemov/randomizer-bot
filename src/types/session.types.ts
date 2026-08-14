import { CompletionType, MediaType, MessageEntity, PublishType, RequiredChannel } from './contest.types';

export interface ContestDraft {
  text?: string;
  textEntities?: MessageEntity[];
  mediaType?: MediaType;
  mediaFileId?: string;
  buttonText?: string;
  requiredChannels: RequiredChannel[];
  requireSubscription: boolean;
  winnersCount?: number;
  publishChannelId?: number;
  publishChannelTitle?: string;
  publishType?: PublishType;
  publishAt?: Date;
  completionType?: CompletionType;
  completeAt?: Date;
  participantsThreshold?: number;
  useCaptcha: boolean;
  boostForLuck: boolean;
}

export interface ContestWizardState {
  contest: ContestDraft;
}

export interface AddChannelWizardState {
  kind: 'channel' | 'group';
}

export interface NotifyWinnersWizardState {
  contestId: string;
}

export interface CaptchaJoinWizardState {
  contestId: string;
  expectedAnswer: string;
  attemptsLeft: number;
  /**
   * One-shot flag set only by the ctx.scene.enter() call that starts this wizard. Telegraf
   * re-runs the scene's own middleware (including its `.command('start', ...)` escape hatch)
   * synchronously against the *same* in-flight "/start join_<id>" ctx that triggered entry, so
   * without this the escape hatch would immediately match that same message and recurse back
   * into handleStartCommand -> scene.enter() forever, and step 0 (which sends the captcha)
   * would never run. Consumed and cleared on first read.
   */
  justEntered?: boolean;
}

export function createEmptyContestDraft(): ContestDraft {
  return {
    requiredChannels: [],
    requireSubscription: true,
    useCaptcha: false,
    boostForLuck: false,
  };
}
