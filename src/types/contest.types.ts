export type ContestStatus = 'draft' | 'scheduled' | 'published' | 'completed' | 'cancelled';
export type PublishType = 'now' | 'scheduled';
export type CompletionType = 'by_time' | 'by_participants';
export type MediaType = 'photo' | 'video' | 'animation' | 'document';

export interface RequiredChannel {
  chatId: number;
  title: string;
  username?: string;
}

export interface ContestWinner {
  telegramId: number;
  username?: string;
}
