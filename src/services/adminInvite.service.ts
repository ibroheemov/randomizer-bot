import crypto from 'crypto';
import { AdminInvite, AdminInviteDocument } from '../models/AdminInvite.model';

export const ADMIN_INVITE_PAYLOAD_PREFIX = 'admin_';

export async function createAdminInvite(createdBy: number): Promise<string> {
  const token = crypto.randomBytes(16).toString('hex');
  await AdminInvite.create({ token, createdBy });
  return token;
}

export function adminInviteDeepLink(botUsername: string, token: string): string {
  return `https://t.me/${botUsername}?start=${ADMIN_INVITE_PAYLOAD_PREFIX}${token}`;
}

/** Atomically claims the invite so a token can never be consumed twice, even if raced. */
export async function consumeAdminInvite(
  token: string,
  usedBy: number,
): Promise<AdminInviteDocument | null> {
  return AdminInvite.findOneAndUpdate(
    { token, usedAt: { $exists: false } },
    { $set: { usedAt: new Date(), usedBy } },
    { new: true },
  );
}
