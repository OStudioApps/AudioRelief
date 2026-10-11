import { useEffect, useRef } from 'react';
import { useAuth } from './auth';
import { supabase } from './lib/supabase';
import { reconcile } from './syncRule';
import { useTinnitus } from './tinnitus';

/**
 * Keeps one answer — "do you have tinnitus?" — in step between this phone
 * and the account.
 *
 * The question is asked before there is an account to attach it to, so the
 * answer is written to the device first (src/tinnitus.tsx) and waits there
 * for as long as it takes: through closing the app, through an email
 * confirmation. The moment there is a session, this copies it up.
 *
 * It runs the other way too. Someone who signs in on a new phone through
 * "I already have an account" is never shown the question, so the answer
 * saved with their account is brought down instead of asking again.
 *
 * When both sides have an answer, the newer one wins (src/syncRule.ts) — each copy carries the
 * time it was given. Without that, a second phone holding last month's
 * answer would quietly overwrite the one just changed on the first.
 *
 * It lives in the account's user metadata rather than a table of its own:
 * it is the person's own preference, they are the only one who writes it,
 * and it needs no schema to exist. Only the yes/no goes up. The answers to
 * the questionnaire itself stay on the device.
 */
export function TinnitusAccountSync() {
  const { session, loaded: authLoaded } = useAuth();
  const tin = useTinnitus();
  const pushing = useRef(false);

  const userId = session?.user.id ?? null;
  const meta = session?.user.user_metadata as Record<string, unknown> | undefined;
  const remote = typeof meta?.has_tinnitus === 'boolean' ? meta.has_tinnitus : null;
  const remoteAt = typeof meta?.has_tinnitus_at === 'string' ? meta.has_tinnitus_at : null;

  useEffect(() => {
    if (!authLoaded || !tin.loaded || !userId) return;

    const action = reconcile(
      { value: tin.hasTinnitus, at: tin.hasTinnitusAt },
      { value: remote, at: remoteAt },
      tin.hasProfile,
      new Date().toISOString(),
    );

    if (action.kind === 'adopt') tin.adoptHasTinnitus(action.value, action.at);
    if (action.kind === 'inferYes') tin.setHasTinnitus(true);
    if (action.kind !== 'push' || pushing.current) return;

    // A failure is left alone on purpose: the answer is still on the device,
    // and the next launch tries again.
    pushing.current = true;
    void supabase.auth
      .updateUser({ data: { has_tinnitus: action.value, has_tinnitus_at: action.at } })
      .catch(() => {})
      .finally(() => {
        pushing.current = false;
      });
    // The setters are new functions on every profile change; listing them
    // would re-run this for no reason. Everything they depend on is listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoaded, tin.loaded, userId, remote, remoteAt, tin.hasTinnitus, tin.hasTinnitusAt, tin.hasProfile]);

  return null;
}
