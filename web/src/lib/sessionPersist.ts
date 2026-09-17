import type { BoothStep } from "../state/BoothContext";
import type { AspectRatioId, QualityId } from "../data/format";
import { todayIST } from "./otpUnlock";

const STORAGE_KEY = "nalco-photo-booth-flow";

export interface PersistedFlow {
  date: string;
  step: BoothStep;
  selfieDataUrl: string | null;
  sceneId: string | null;
  aspectRatio: AspectRatioId | null;
  quality: QualityId | null;
  sessionId: string | null;
  resultUrl: string | null;
}

/**
 * Saves booth flow progress to sessionStorage so an accidental refresh
 * (or the tablet reloading on its own) doesn't dump the visitor back to
 * Welcome and lose whatever they'd already done. Cleared on tab close —
 * unlike the OTP unlock, this shouldn't survive into a new day/session.
 */
export function saveFlow(flow: Omit<PersistedFlow, "date">): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...flow, date: todayIST() }));
  } catch {
    // sessionStorage can be unavailable (private mode, quota) — refresh
    // just falls back to starting over, which is the old behavior.
  }
}

export function clearFlow(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Restores saved progress, landing on the most sensible step for what's
 * actually recoverable — a step that needed an in-flight network call
 * ("generating") or an ephemeral state ("error") can't be resumed as-is,
 * so those fall back to the latest *stable* step the saved data supports.
 */
export function loadFlow(): PersistedFlow | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedFlow;
    if (parsed.date !== todayIST()) return null;

    let step = parsed.step;
    if (step === "generating") {
      step = parsed.sceneId ? "format" : "welcome";
    }
    if (step === "error") {
      step = "welcome";
    }
    if (step === "result" && !(parsed.resultUrl && parsed.sessionId)) {
      step = "welcome";
    }
    if ((step === "format" || step === "scene" || step === "confirm") && !parsed.selfieDataUrl) {
      step = "welcome";
    }
    if (step === "format" && !parsed.sceneId) {
      step = "scene";
    }
    if (step === "otp") {
      step = "welcome"; // reaching here at all means we're past the OTP gate
    }

    return { ...parsed, step };
  } catch {
    return null;
  }
}
