import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useBooth } from "../state/BoothContext";

const AUTO_RESET_MS = 20_000;

export default function Result() {
  const { sessionId, resultUrl, reset } = useBooth();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    const viewUrl = `${window.location.origin}/view/${sessionId}`;
    QRCode.toDataURL(viewUrl, { width: 320, margin: 1 }).then(setQrDataUrl);
  }, [sessionId]);

  useEffect(() => {
    timerRef.current = setTimeout(reset, AUTO_RESET_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      onClick={reset}
      className="flex h-full w-full flex-col items-center justify-center gap-8 bg-nalco-navy p-8"
    >
      {resultUrl && (
        <img
          src={resultUrl}
          alt="Your generated photo"
          className="max-h-[55vh] rounded-2xl border-4 border-white/20 shadow-2xl"
        />
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6"
      >
        {qrDataUrl && <img src={qrDataUrl} alt="Scan to get your photo" className="h-56 w-56" />}
        <p className="max-w-xs text-center text-sm text-nalco-navy">
          Scan this QR code with your phone to save your photo
        </p>
      </div>

      <p className="text-sm text-white/50">Tap anywhere to start over</p>
    </div>
  );
}
