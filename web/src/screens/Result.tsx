import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useBooth } from "../state/BoothContext";
import PhotoEditor from "../components/PhotoEditor";

export default function Result() {
  const { sessionId, resultUrl, selfieDataUrl, quality, setResult, reset } = useBooth();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const lowResForPrint = quality === "standard";

  useEffect(() => {
    if (!sessionId) return;
    const viewUrl = `${window.location.origin}/view/${sessionId}`;
    QRCode.toDataURL(viewUrl, { width: 320, margin: 1 }).then(setQrDataUrl);
  }, [sessionId]);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  async function handleDownload() {
    if (!resultUrl) return;
    setMenuOpen(false);
    setDownloading(true);
    try {
      const res = await fetch(resultUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "nalco-photo-booth.jpg";
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(resultUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  }

  function handlePrint() {
    setMenuOpen(false);
    window.print();
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-black">
      {resultUrl && (
        <button
          onClick={() => setEditorOpen(true)}
          className="absolute inset-0"
          aria-label="Tap to edit — zoom, crop, and filters"
        >
          <img
            id="printable-photo"
            src={resultUrl}
            alt="Your generated photo"
            className="h-full w-full object-cover"
          />
        </button>
      )}

      {resultUrl && (
        <button
          onClick={() => setEditorOpen(true)}
          className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-4 rounded-full bg-white/15 px-6 py-3 text-sm font-medium text-white backdrop-blur"
        >
          Edit Photo
        </button>
      )}

      {/* Top-right menu */}
      <div
        ref={menuRef}
        className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-20"
      >
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Photo options"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-3xl leading-none text-white backdrop-blur"
        >
          ⋮
        </button>

        {menuOpen && (
          <div className="screen-fade absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl bg-white shadow-2xl">
            <MenuItem
              label={downloading ? "Downloading…" : "Download Photo"}
              onClick={handleDownload}
              disabled={downloading}
            />
            <MenuItem label="Print Photo" onClick={handlePrint} />
            {selfieDataUrl && (
              <MenuItem
                label="Compare with Original"
                onClick={() => {
                  setMenuOpen(false);
                  setCompareOpen(true);
                }}
              />
            )}
            <MenuItem
              label="Show QR Code"
              onClick={() => {
                setMenuOpen(false);
                setQrModalOpen(true);
              }}
            />
            <MenuItem
              label="Close Session"
              onClick={() => {
                setMenuOpen(false);
                reset();
              }}
              destructive
            />
          </div>
        )}
      </div>

      {lowResForPrint && (
        <p className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 max-w-xs -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-center text-xs text-nalco-amber backdrop-blur">
          Generated at Standard quality — may look soft printed at full
          page size. Pick 2K or 4K next time for sharper prints.
        </p>
      )}

      {qrModalOpen && (
        <div
          className="screen-fade fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-8"
          onClick={() => setQrModalOpen(false)}
        >
          <div
            className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {qrDataUrl && <img src={qrDataUrl} alt="Scan to get your photo" className="h-64 w-64" />}
            <p className="max-w-xs text-center text-sm text-nalco-navy">
              Scan this QR code with your phone to save and share your photo
            </p>
            <button
              onClick={() => setQrModalOpen(false)}
              className="rounded-full bg-nalco-navy px-8 py-3 text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {compareOpen && selfieDataUrl && resultUrl && (
        <div
          className="screen-fade fixed inset-0 z-30 flex flex-col bg-black/95 p-4"
          onClick={() => setCompareOpen(false)}
        >
          <div
            className="grid h-[70vh] grid-cols-1 gap-6 overflow-y-auto sm:grid-cols-2"
            onClick={(e) => e.stopPropagation()}
          >
            <ComparePane label="Original (as captured)" imageUrl={selfieDataUrl} />
            <ComparePane label="Generated" imageUrl={resultUrl} />
          </div>
          <button
            onClick={() => setCompareOpen(false)}
            className="mx-auto mt-4 rounded-full bg-white/15 px-8 py-3 text-white"
          >
            Close
          </button>
        </div>
      )}

      {editorOpen && resultUrl && sessionId && (
        <PhotoEditor
          sessionId={sessionId}
          imageUrl={resultUrl}
          initialFilterId="none"
          onSaved={(newUrl) => setResult(sessionId, newUrl)}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}

function ComparePane({ label, imageUrl }: { label: string; imageUrl: string }) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-2">
      <p className="text-sm font-medium text-white/70">{label}</p>
      {/* Grid row above has an explicit fixed height (not flex-stretch),
          which both panes inherit via h-full — a flex-1 chain here left
          the low-res original visibly smaller than the generated photo,
          since percentage/stretch heights don't reliably propagate
          through nested flex items with differing intrinsic content. */}
      <img src={imageUrl} alt={label} className="h-full min-h-0 w-full rounded-xl object-contain" />
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  disabled,
  destructive,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`block w-full px-5 py-4 text-left text-base font-medium disabled:opacity-50 ${
        destructive ? "text-red-600" : "text-nalco-navy"
      } border-b border-black/5 last:border-b-0 active:bg-black/5`}
    >
      {label}
    </button>
  );
}
