import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AspectRatioId, QualityId } from "../data/format";
import { isUnlockedToday } from "../lib/otpUnlock";
import { saveFlow, clearFlow, loadFlow } from "../lib/sessionPersist";

export type BoothStep =
  | "otp"
  | "welcome"
  | "capture"
  | "confirm"
  | "scene"
  | "format"
  | "generating"
  | "result"
  | "error";

interface BoothState {
  step: BoothStep;
  selfieDataUrl: string | null;
  sceneId: string | null;
  aspectRatio: AspectRatioId | null;
  quality: QualityId | null;
  sessionId: string | null;
  resultUrl: string | null;
  errorMessage: string | null;
}

interface BoothContextValue extends BoothState {
  goTo: (step: BoothStep) => void;
  setSelfie: (dataUrl: string) => void;
  setScene: (sceneId: string) => void;
  setFormat: (aspectRatio: AspectRatioId, quality: QualityId) => void;
  setResult: (sessionId: string, resultUrl: string) => void;
  setError: (message: string) => void;
  reset: () => void;
}

// This device already redeemed today's code -> skip straight past the OTP
// gate; otherwise it starts there. Then, if there's saved in-progress flow
// from before a refresh, restore it on top — so an accidental reload
// doesn't dump the visitor back to square one. Checked fresh each call
// (not memoized once) so a day rollover while the app stays open, or a
// Close Session clearing the saved flow, are both picked up correctly.
function freshState(): BoothState {
  const base: BoothState = {
    step: isUnlockedToday() ? "welcome" : "otp",
    selfieDataUrl: null,
    sceneId: null,
    aspectRatio: null,
    quality: null,
    sessionId: null,
    resultUrl: null,
    errorMessage: null,
  };

  if (base.step === "otp") return base;

  const saved = loadFlow();
  if (!saved) return base;

  return {
    ...base,
    step: saved.step,
    selfieDataUrl: saved.selfieDataUrl,
    sceneId: saved.sceneId,
    aspectRatio: saved.aspectRatio,
    quality: saved.quality,
    sessionId: saved.sessionId,
    resultUrl: saved.resultUrl,
  };
}

const BoothContext = createContext<BoothContextValue | null>(null);

export function BoothProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BoothState>(freshState);

  // Persist on every change so a refresh can restore where the visitor
  // left off — skipped for "otp" (nothing worth resuming pre-auth) and
  // "error" (resuming an error state isn't useful; freshState already
  // falls that back to "welcome" on load).
  useEffect(() => {
    if (state.step === "otp" || state.step === "error") {
      clearFlow();
      return;
    }
    saveFlow({
      step: state.step,
      selfieDataUrl: state.selfieDataUrl,
      sceneId: state.sceneId,
      aspectRatio: state.aspectRatio,
      quality: state.quality,
      sessionId: state.sessionId,
      resultUrl: state.resultUrl,
    });
  }, [state]);

  const value = useMemo<BoothContextValue>(
    () => ({
      ...state,
      goTo: (step) => setState((s) => ({ ...s, step })),
      setSelfie: (selfieDataUrl) => setState((s) => ({ ...s, selfieDataUrl, step: "confirm" })),
      setScene: (sceneId) => setState((s) => ({ ...s, sceneId, step: "format" })),
      setFormat: (aspectRatio, quality) =>
        setState((s) => ({ ...s, aspectRatio, quality, step: "generating" })),
      setResult: (sessionId, resultUrl) =>
        setState((s) => ({ ...s, sessionId, resultUrl, step: "result" })),
      setError: (errorMessage) => setState((s) => ({ ...s, errorMessage, step: "error" })),
      reset: () => {
        clearFlow();
        setState(freshState());
      },
    }),
    [state]
  );

  return <BoothContext.Provider value={value}>{children}</BoothContext.Provider>;
}

export function useBooth() {
  const ctx = useContext(BoothContext);
  if (!ctx) throw new Error("useBooth must be used within a BoothProvider");
  return ctx;
}
