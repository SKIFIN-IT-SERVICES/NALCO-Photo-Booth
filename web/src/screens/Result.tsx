import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useBooth } from "../state/BoothContext";
import PhotoZoomViewer from "../components/PhotoZoomViewer";
import { bakeFilterToBlob } from "../lib/bakeFilter";
import { getFilter } from "../data/filters";

export default function Result() {
  const { sessionId, resultUrl, quality, reset } = useBooth();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [filterId, setFilterId] = useState("none");
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
      const blob = await bakeFilterToBlob(resultUrl, getFilter(filterId).css);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "nalco-photo-booth.jpg";
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fall back to opening the original if baking/downloading fails.
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
          onClick={() => setViewerOpen(true)}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="Tap to zoom and apply filters"
        >
          <img
            id="printable-photo"
            src={resultUrl}
            alt="Your generated photo"
            className="max-h-full max-w-full object-contain"
            style={{ filter: getFilter(filterId).css }}
          />
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
          <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl bg-white shadow-2xl">
            <MenuItem
              label={downloading ? "Downloading…" : "Download Photo"}
              onClick={handleDownload}
              disabled={downloading}
            />
            <MenuItem label="Print Photo" onClick={handlePrint} />
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
        <p className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 max-w-xs -translate-x-1/2 text-center text-xs text-nalco-amber">
          Generated at Standard quality — may look soft printed at full
          page size. Pick 2K or 4K next time for sharper prints.
        </p>
      )}

      {qrModalOpen && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-8"
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

      {viewerOpen && resultUrl && (
        <PhotoZoomViewer
          imageUrl={resultUrl}
          initialFilterId={filterId}
          onApply={(id) => {
            setFilterId(id);
            setViewerOpen(false);
          }}
          onClose={() => setViewerOpen(false)}
        />
      )}
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
