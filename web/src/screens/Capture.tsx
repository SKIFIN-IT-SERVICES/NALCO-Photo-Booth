import { useEffect, useRef, useState } from "react";
import { useBooth } from "../state/BoothContext";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

export default function Capture() {
  const { setSelfie, setError, goTo } = useBooth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: 1280, height: 960 }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
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

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
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
        style={{ transform: `scaleX(-1) scale(${zoom})`, transition: "transform 150ms ease-out" }}
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
