/** Pure helpers for the gym features (no database), so they are easy to test. */

export const DAY_MS = 86_400_000;
export const CANCEL_WINDOW_MS = 2 * 3_600_000;
export const DUPLICATE_CHECKIN_MS = 2 * 3_600_000;

/** Monday 00:00 (UTC) of the week containing `d`, as a day number. */
export function weekIndex(d: Date): number {
  const dayNumber = Math.floor(d.getTime() / DAY_MS); // days since 1970-01-01 (a Thursday)
  const mondayOffset = (dayNumber + 3) % 7; // 0 = Monday
  return Math.floor((dayNumber - mondayOffset) / 7);
}

/**
 * Weeks in a row (counting back from this week) with at least one visit.
 * A week without a visit yet does not break the streak until the week is over.
 */
export function weekStreak(visits: Date[], now = new Date()): number {
  const weeks = new Set(visits.map(weekIndex));
  let w = weekIndex(now);
  if (!weeks.has(w)) w -= 1; // this week is still in progress
  let streak = 0;
  while (weeks.has(w)) {
    streak += 1;
    w -= 1;
  }
  return streak;
}

export const membershipActiveAt = (expiresAt: Date | undefined | null, when: Date): boolean =>
  Boolean(expiresAt && expiresAt.getTime() > when.getTime());

export function canCancel(startsAt: Date, now = new Date()): boolean {
  return startsAt.getTime() - now.getTime() >= CANCEL_WINDOW_MS;
}

/** A short, unambiguous code (no 0/O/1/I) the member shows at the desk. */
export function makeCheckInCode(random: () => number = Math.random): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(random() * alphabet.length)];
  return out;
}
