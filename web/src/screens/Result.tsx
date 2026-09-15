import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useBooth } from "../state/BoothContext";

export default function Result() {
  const { sessionId, resultUrl, quality, reset } = useBooth();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const lowResForPrint = quality === "standard";

  useEffect(() => {
    if (!sessionId) return;
    const viewUrl = `${window.location.origin}/view/${sessionId}`;
    QRCode.toDataURL(viewUrl, { width: 320, margin: 1 }).then(setQrDataUrl);
  }, [sessionId]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-nalco-navy p-8">
      {resultUrl && (
        <img
          id="printable-photo"
          src={resultUrl}
          alt="Your generated photo"
          className="max-h-[50vh] rounded-2xl border-4 border-white/20 shadow-2xl"
        />
      )}

      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6">
        {qrDataUrl && <img src={qrDataUrl} alt="Scan to get your photo" className="h-48 w-48" />}
        <p className="max-w-xs text-center text-sm text-nalco-navy">
          Scan this QR code with your phone to save and share your photo
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={() => window.print()}
          className="rounded-full bg-white/20 px-8 py-4 text-lg font-medium text-white"
        >
          Print Photo
        </button>
        <button
          onClick={reset}
          className="rounded-full bg-nalco-orange px-8 py-4 text-lg font-semibold text-nalco-navy shadow-lg"
        >
          Close Session
        </button>
      </div>

      {lowResForPrint && (
        <p className="max-w-xs text-center text-xs text-nalco-amber">
          This photo was generated at Standard quality — it may look soft
          printed at full page size. Pick 2K or 4K next time for sharper
          prints.
        </p>
      )}
    </div>
  );
}
