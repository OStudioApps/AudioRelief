/**
 * The rule for reconciling the "do you have tinnitus?" answer on this phone
 * with the one saved on the account. Pure, so it can be tested without a
 * session or a device — see src/accountSync.tsx for where it is applied.
 */

export type SyncSide = {
  /** The answer, or null when this side has never been given one. */
  value: boolean | null;
  /** When it was given, as an ISO date. Null on answers that predate the stamp. */
  at: string | null;
};

export type SyncAction =
  /** Both sides already agree, or there is nothing to move. */
  | { kind: 'none' }
  /** The account's answer is the only one, or the newer one: bring it down. */
  | { kind: 'adopt'; value: boolean; at: string }
  /** This phone's answer is the only one, or the newer one: send it up. */
  | { kind: 'push'; value: boolean; at: string }
  /** No answer anywhere, but a filled-in questionnaire: that is a "yes". */
  | { kind: 'inferYes' };

const EPOCH = new Date(0).toISOString();
const time = (at: string | null) => (at ? Date.parse(at) : 0);

export function reconcile(local: SyncSide, remote: SyncSide, hasProfile: boolean, now: string): SyncAction {
  if (local.value === null) {
    if (remote.value !== null) return { kind: 'adopt', value: remote.value, at: remote.at ?? EPOCH };
    return hasProfile ? { kind: 'inferYes' } : { kind: 'none' };
  }

  if (remote.value !== null && time(remote.at) > time(local.at)) {
    return remote.value === local.value
      ? { kind: 'none' }
      : { kind: 'adopt', value: remote.value, at: remote.at ?? EPOCH };
  }

  if (remote.value === local.value) return { kind: 'none' };
  return { kind: 'push', value: local.value, at: local.at ?? now };
}
