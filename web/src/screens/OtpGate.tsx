import { useEffect, useState } from "react";
import { useBooth } from "../state/BoothContext";
import { checkOtpStatus, redeemOtp } from "../firebase";
import { markUnlockedToday } from "../lib/otpUnlock";

const CODE_LENGTH = 6;

type Status = "checking" | "locked" | "ready" | "submitting";

export default function OtpGate() {
  const { goTo } = useBooth();
  const [status, setStatus] = useState<Status>("checking");
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkOtpStatus()
      .then((res) => setStatus(res.data.usedToday ? "locked" : "ready"))
      .catch(() => setStatus("ready")); // fail open on the status check — redeemOtp still enforces it
  }, []);

  function press(d: string) {
    if (status !== "ready" || digits.length >= CODE_LENGTH) return;
    setError(null);
    setDigits((prev) => prev + d);
  }

  function backspace() {
    setDigits((prev) => prev.slice(0, -1));
  }

  async function submit(code: string) {
    setStatus("submitting");
    setError(null);
    try {
      await redeemOtp({ code });
      markUnlockedToday();
      goTo("welcome");
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "";
      if (message.includes("already been used")) {
        setStatus("locked");
      } else {
        setError("Incorrect code — try again.");
        setDigits("");
        setStatus("ready");
      }
    }
  }

  useEffect(() => {
    if (digits.length === CODE_LENGTH) submit(digits);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 bg-gradient-to-b from-nalco-navy to-nalco-blue p-8 text-center">
      <p className="text-2xl tracking-[0.3em] text-nalco-amber">NALCO</p>

      {status === "checking" && <p className="text-white/70">Checking availability…</p>}

      {status === "locked" && (
        <>
          <h1 className="text-4xl font-bold text-white">Booth Closed for Today</h1>
          <p className="max-w-sm text-white/70">
            Today's photo session has already been used. Please come back tomorrow!
          </p>
        </>
      )}

      {(status === "ready" || status === "submitting") && (
        <>
          <h1 className="text-3xl font-bold text-white">Enter Today's Code</h1>
          <p className="max-w-sm text-white/60">
            Ask a staff member for today's access code to start
          </p>

          <div className="flex gap-3">
            {Array.from({ length: CODE_LENGTH }).map((_, i) => (
              <div
                key={i}
                className={`h-5 w-5 rounded-full border-2 border-white/40 ${
                  i < digits.length ? "bg-nalco-orange" : "bg-transparent"
                }`}
              />
            ))}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {status === "submitting" && <p className="text-sm text-white/50">Checking…</p>}

          <div className="grid grid-cols-3 gap-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <button
                key={d}
                onClick={() => press(d)}
                disabled={status === "submitting"}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-semibold text-white disabled:opacity-40"
              >
                {d}
              </button>
            ))}
            <div />
            <button
              onClick={() => press("0")}
              disabled={status === "submitting"}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-semibold text-white disabled:opacity-40"
            >
              0
            </button>
            <button
              onClick={backspace}
              disabled={status === "submitting"}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-lg text-white disabled:opacity-40"
              aria-label="Backspace"
            >
              ⌫
            </button>
          </div>
        </>
      )}
    </div>
  );
}
