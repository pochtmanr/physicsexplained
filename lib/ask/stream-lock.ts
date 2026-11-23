/**
 * One answer stream per user at a time.
 *
 * The quota is read before the model call and charged after it, so without
 * this a burst of parallel requests would all pass the same quota check. The
 * lock lives in this process: the site runs as a single Node process, and a
 * second process would only loosen the limit to one stream per process.
 *
 * Entries expire so a request that dies between acquire and release cannot
 * lock a user out; the TTL sits above the proxy's read timeout.
 */

const LOCK_TTL_MS = 6 * 60 * 1000;
const POLL_MS = 100;

const held = new Map<string, number>();

function tryAcquire(userId: string, now: number): boolean {
  const expiresAt = held.get(userId);
  if (expiresAt !== undefined && expiresAt > now) return false;
  held.set(userId, now + LOCK_TTL_MS);
  return true;
}

/**
 * Take the user's stream slot. Waits up to `waitMs` for a previous stream to
 * finish, which covers a client that aborts one request and immediately sends
 * another (React strict-mode remount, Retry right after Stop).
 * Returns a release function, or null if the slot stayed busy.
 */
export async function acquireStreamSlot(userId: string, waitMs = 2000): Promise<(() => void) | null> {
  const deadline = Date.now() + waitMs;
  while (!tryAcquire(userId, Date.now())) {
    if (Date.now() >= deadline) return null;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    held.delete(userId);
  };
}
