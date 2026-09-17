const STORAGE_KEY = "nalco-photo-booth-otp-unlock";

// Mirrors the server's day boundary (functions/src/index.ts todayIST) —
// the booth runs in India, so "today" resets at midnight IST, not UTC.
export function todayIST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/**
 * Once a device successfully redeems today's code, it stays unlocked for
 * the rest of that day — surviving refreshes and Close Session — without
 * being asked again. Other devices are unaffected: the code itself is
 * still only redeemable once (enforced server-side), so they'll see
 * "Booth Closed for Today" if they try after this device has redeemed it.
 */
export function isUnlockedToday(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const { date } = JSON.parse(raw) as { date?: string };
    return date === todayIST();
  } catch {
    return false;
  }
}

export function markUnlockedToday(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayIST() }));
  } catch {
    // localStorage can be unavailable (private mode, quota) — the OTP
    // screen just reappears next load, which is a safe fallback.
  }
}
