// Scene ids live in their own module (not inside each scene file) so that handlers/scenes
// needing to reference *another* scene's id never have to import that scene's own module —
// which is how a genuine circular import snuck in previously (see start.handler.ts).
export const CREATE_CONTEST_WIZARD_ID = 'createContestWizard';
export const ADD_CHANNEL_WIZARD_ID = 'addChannelWizard';
export const NOTIFY_WINNERS_WIZARD_ID = 'notifyWinnersWizard';
export const BROADCAST_WIZARD_ID = 'broadcastWizard';
export const CAPTCHA_JOIN_WIZARD_ID = 'captchaJoinWizard';
export const GLOBAL_CHANNEL_WIZARD_ID = 'globalChannelWizard';
