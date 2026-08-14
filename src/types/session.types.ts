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
}

export function createEmptyContestDraft(): ContestDraft {
  return {
    requiredChannels: [],
    requireSubscription: true,
    useCaptcha: false,
    boostForLuck: false,
  };
}
