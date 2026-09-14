import { useEffect, useRef, useState } from "react";
import { useBooth } from "../state/BoothContext";

export default function Capture() {
  const { setSelfie, setError, goTo } = useBooth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

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
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setSelfie(dataUrl);
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full scale-x-[-1] object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {countdown !== null && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
          <span className="text-[12rem] font-bold text-white drop-shadow-lg">{countdown}</span>
        </div>
      )}

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
