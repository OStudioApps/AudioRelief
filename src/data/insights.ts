import { ImpactEntry, Session } from '../history';

/**
 * Turning the raw history into the handful of things worth telling someone.
 *
 * Every function here returns null or an empty result when there is not
 * enough to say — the dashboard shows an invitation in that case rather than
 * a zero. A zero looks like a measurement; it is not one.
 */

const DAY = 86400000;

/** Local calendar day, so "last night" groups the way a person means it. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Listening after midnight belongs to the night before.
 *
 * Someone who starts rain at 00:40 and sleeps through has had one night, not
 * two. Anything before 5am counts against the previous day.
 */
export function nightKey(iso: string): string {
  const d = new Date(iso);
  if (d.getHours() < 5) return dayKey(new Date(d.getTime() - DAY));
  return dayKey(d);
}

export function sessionsSince(sessions: Session[], days: number): Session[] {
  const cutoff = Date.now() - days * DAY;
  return sessions.filter((s) => new Date(s.at).getTime() >= cutoff);
}

export function totalSeconds(sessions: Session[]): number {
  return sessions.reduce((sum, s) => sum + s.seconds, 0);
}

/** Seconds per night for the last `days` nights, oldest first. */
export function nightlySeconds(sessions: Session[], days: number): Array<{ key: string; seconds: number }> {
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    buckets.set(dayKey(new Date(Date.now() - i * DAY)), 0);
  }
  for (const s of sessions) {
    const k = nightKey(s.at);
    if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + s.seconds);
  }
  return [...buckets.entries()].map(([key, seconds]) => ({ key, seconds }));
}

/**
 * Nights in a row, counting back from last night.
 *
 * Tonight not being used yet does not break a streak — the evening is not
 * over, and a counter that resets at midnight would punish someone for
 * opening the app before bed rather than after.
 */
export function streak(sessions: Session[]): number {
  const used = new Set(sessions.map((s) => nightKey(s.at)));
  const today = dayKey(new Date());
  let n = 0;
  let cursor = used.has(today) ? 0 : 1;
  for (;;) {
    const k = dayKey(new Date(Date.now() - cursor * DAY));
    if (!used.has(k)) break;
    n++;
    cursor++;
    if (n > 400) break;
  }
  return n;
}

export type Slot = 'night' | 'morning' | 'afternoon' | 'evening';

export const SLOT_LABEL: Record<Slot, string> = {
  night: 'Late night',
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

export function slotOf(iso: string): Slot {
  const h = new Date(iso).getHours();
  if (h < 5) return 'night';
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  if (h < 22) return 'evening';
  return 'night';
}

/** Seconds spent in each part of the day, for the pattern it reveals. */
export function bySlot(sessions: Session[]): Array<{ slot: Slot; seconds: number }> {
  const order: Slot[] = ['morning', 'afternoon', 'evening', 'night'];
  const totals = new Map<Slot, number>(order.map((s) => [s, 0]));
  for (const s of sessions) {
    const k = slotOf(s.at);
    totals.set(k, (totals.get(k) ?? 0) + s.seconds);
  }
  return order.map((slot) => ({ slot, seconds: totals.get(slot) ?? 0 }));
}

/** The sounds actually reached for, by time spent, most first. */
export function topSounds(sessions: Session[], limit = 3): Array<{ id: string; name: string; seconds: number }> {
  const totals = new Map<string, { name: string; seconds: number }>();
  for (const s of sessions) {
    const prev = totals.get(s.id);
    // The most recent name wins: a renamed mix should not appear twice.
    totals.set(s.id, { name: s.name, seconds: (prev?.seconds ?? 0) + s.seconds });
  }
  return [...totals.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, limit);
}

/** Time-weighted, so one loud minute does not outweigh eight quiet hours. */
export function averageVolume(sessions: Session[]): number | null {
  const secs = totalSeconds(sessions);
  if (!secs) return null;
  return Math.round(sessions.reduce((sum, s) => sum + s.volume * s.seconds, 0) / secs);
}

export type ImpactTrend = {
  first: ImpactEntry;
  latest: ImpactEntry;
  /** Negative means it gets in the way less than it did. */
  change: number;
  weeks: number;
};

/** Needs two answers at least a week apart to be worth calling a trend. */
export function impactTrend(impacts: ImpactEntry[]): ImpactTrend | null {
  if (impacts.length < 2) return null;
  const sorted = [...impacts].sort((a, b) => a.at.localeCompare(b.at));
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];
  const weeks = (new Date(latest.at).getTime() - new Date(first.at).getTime()) / (7 * DAY);
  if (weeks < 1) return null;
  return { first, latest, change: latest.value - first.value, weeks: Math.round(weeks) };
}

/** "6h 20m", "48m", "—". Compact enough for a stat tile. */
export function formatSpan(seconds: number): string {
  if (seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${Math.max(m, 1)}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
