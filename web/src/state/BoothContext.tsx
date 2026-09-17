import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { AspectRatioId, QualityId } from "../data/format";

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

const initialState: BoothState = {
  step: "otp",
  selfieDataUrl: null,
  sceneId: null,
  aspectRatio: null,
  quality: null,
  sessionId: null,
  resultUrl: null,
  errorMessage: null,
};

const BoothContext = createContext<BoothContextValue | null>(null);

export function BoothProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BoothState>(initialState);

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
      reset: () => setState(initialState),
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
