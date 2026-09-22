import { useEffect, useRef, useState } from "react";
import { useBooth } from "../state/BoothContext";
import { FILTERS, getFilter } from "../data/filters";

const MIN_ZOOM = 1;
// Capped conservatively (was 3) after a real quality bug: zooming crops a
// smaller region of an already-modest camera frame then stretches it back
// up, and at high zoom this can crop out the eyes/forehead entirely —
// verified directly against Gemini that a crop missing those features
// forces it to invent that part of the face, producing a visibly
// different person. 1.8x still lets someone tighten framing without
// enough crop to lose key features at typical kiosk selfie distance.
const MAX_ZOOM = 1.8;
const ZOOM_STEP = 0.2;

export default function Capture() {
  const { setSelfie, setError, goTo } = useBooth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const thumbRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [filterId, setFilterId] = useState("none");

  useEffect(() => {
    let cancelled = false;

    navigator.mediaDevices
      // `ideal` (not exact) so this gracefully degrades on lower-end
      // hardware instead of failing — but asks for meaningfully more than
      // the old fixed 1280x960, since that capped the raw detail available
      // for Gemini's identity-critical compositing even before any zoom.
      .getUserMedia({
        video: { facingMode: "user", width: { ideal: 1920 }, height: { ideal: 1440 } },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        // Each filter swatch gets its own tiny live preview of the same
        // camera feed — a MediaStream can back multiple <video> elements.
        Object.values(thumbRefs.current).forEach((el) => {
          if (el) el.srcObject = stream;
        });
      })
      .catch(() => {
        setError(
          "Couldn't access the camera. Please check camera permissions on this tablet."
        );
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCountdown() {
    if (countdown !== null) return;
    let n = 3;
    setCountdown(n);
    const interval = setInterval(() => {
      n -= 1;
      if (n === 0) {
        clearInterval(interval);
        takeSnapshot();
        setCountdown(null);
      } else {
        setCountdown(n);
      }
    }, 1000);
  }

  function takeSnapshot() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Bake the selected filter directly into the captured photo, same as
    // the filter applied to the live preview below.
    ctx.filter = getFilter(filterId).css;

    // Mirror horizontally so the captured photo matches what the visitor saw in the preview.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    // Crop the same centered region the zoomed-in preview was showing, then
    // stretch it to fill the full frame — matches what the visitor framed.
    const cropW = video.videoWidth / zoom;
    const cropH = video.videoHeight / zoom;
    const cropX = (video.videoWidth - cropW) / 2;
    const cropY = (video.videoHeight - cropH) / 2;
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    setSelfie(dataUrl);
  }

  function zoomIn() {
    setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
  }

  function zoomOut() {
    setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
        style={{
          filter: getFilter(filterId).css,
          transform: `scaleX(-1) scale(${zoom})`,
          transition: "transform 150ms ease-out",
        }}
      />
      <canvas ref={canvasRef} className="hidden" />

      {countdown !== null && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
          <span className="text-[12rem] font-bold text-white drop-shadow-lg">{countdown}</span>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex flex-col items-center gap-3">
        <button
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-2xl text-white backdrop-blur disabled:opacity-40"
        >
          +
        </button>
        <span className="rounded-full bg-white/15 px-2 py-1 text-xs text-white backdrop-blur">
          {zoom.toFixed(1)}x
        </span>
        <button
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-2xl text-white backdrop-blur disabled:opacity-40"
        >
          −
        </button>
      </div>

      {/* Live filter picker — each swatch is its own tiny preview of the
          same camera feed with that filter applied. Solid backdrop so
          labels stay legible no matter what's behind them in the shot. */}
      <div className="absolute bottom-32 flex w-full justify-center gap-3 overflow-x-auto bg-black/40 px-4 py-3 backdrop-blur-sm">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterId(f.id)}
            className={`flex shrink-0 flex-col items-center gap-1 rounded-xl border-2 p-1 ${
              filterId === f.id ? "border-nalco-orange" : "border-transparent"
            }`}
          >
            <div className="h-14 w-14 overflow-hidden rounded-lg bg-black">
              <video
                ref={(el) => {
                  thumbRefs.current[f.id] = el;
                  if (el && streamRef.current) el.srcObject = streamRef.current;
                }}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
                style={{ filter: f.css, transform: "scaleX(-1)" }}
              />
            </div>
            <span className="text-[11px] text-white/80">{f.label}</span>
          </button>
        ))}
      </div>

      <div className="absolute bottom-12 flex w-full justify-center gap-6">
        <button
          onClick={() => goTo("welcome")}
          className="rounded-full bg-white/20 px-8 py-4 text-lg text-white"
        >
          Back
        </button>
        <button
          onClick={startCountdown}
          disabled={countdown !== null}
          className="rounded-full bg-nalco-orange px-14 py-4 text-2xl font-semibold text-nalco-navy shadow-lg disabled:opacity-50"
        >
          Capture
        </button>
      </div>
    </div>
  );
}
