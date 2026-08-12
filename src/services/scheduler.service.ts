import Agenda, { Job } from 'agenda';
import { Telegram } from 'telegraf';
import { env } from '../config/env';
import { Contest } from '../models/Contest.model';
import { publishContest } from './contest.service';
import { selectWinners } from './winner.service';

const PUBLISH_JOB = 'publish-contest';
const COMPLETE_JOB = 'complete-contest';

interface JobData {
  contestId: string;
}

export const agenda = new Agenda({
  db: { address: env.MONGODB_URI, collection: 'agendaJobs' },
});

let telegramRef: Telegram | null = null;

agenda.define(PUBLISH_JOB, async (job: Job<JobData>) => {
  if (!telegramRef) return;
  const { contestId } = job.attrs.data;
  const contest = await Contest.findById(contestId);
  if (!contest || contest.status !== 'scheduled') return;

  await publishContest(telegramRef, contest);

  if (contest.completionType === 'by_time' && contest.completeAt) {
    await agenda.schedule(contest.completeAt, COMPLETE_JOB, { contestId });
  }
});

agenda.define(COMPLETE_JOB, async (job: Job<JobData>) => {
  if (!telegramRef) return;
  const { contestId } = job.attrs.data;
  const contest = await Contest.findById(contestId);
  if (!contest || contest.status !== 'published') return;
  await selectWinners(telegramRef, contest._id);
});

export async function schedulePublish(contestId: string, publishAt: Date): Promise<void> {
  await agenda.schedule(publishAt, PUBLISH_JOB, { contestId });
}

export async function scheduleCompletion(contestId: string, completeAt: Date): Promise<void> {
  await agenda.schedule(completeAt, COMPLETE_JOB, { contestId });
}

export async function startScheduler(telegram: Telegram): Promise<void> {
  telegramRef = telegram;
  await agenda.start();
  await reconcileMissedJobs(telegram);
}

export async function stopScheduler(): Promise<void> {
  await agenda.stop();
}

/** Defensive belt-and-suspenders pass in case Agenda's own job collection lost track of something. */
async function reconcileMissedJobs(telegram: Telegram): Promise<void> {
  const now = new Date();

  const overdueScheduled = await Contest.find({ status: 'scheduled', publishAt: { $lte: now } });
  for (const contest of overdueScheduled) {
    await publishContest(telegram, contest);
    if (contest.completionType === 'by_time' && contest.completeAt) {
      if (contest.completeAt <= now) {
        await selectWinners(telegram, contest._id);
      } else {
        await scheduleCompletion(String(contest._id), contest.completeAt);
      }
    }
  }

  const overdueCompletions = await Contest.find({
    status: 'published',
    completionType: 'by_time',
    completeAt: { $lte: now },
  });
  for (const contest of overdueCompletions) {
    await selectWinners(telegram, contest._id);
  }
}
