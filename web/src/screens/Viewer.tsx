import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getResult } from "../firebase";

type ViewerState =
  | { status: "loading" }
  | { status: "ready"; imageUrl: string }
  | { status: "error"; message: string };

const CAPTION = "Check out my photo from the NALCO Photo Booth!";

async function fetchAsFile(imageUrl: string): Promise<File> {
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  return new File([blob], "nalco-photo-booth.jpg", { type: blob.type || "image/jpeg" });
}

export default function Viewer() {
  const { sessionId } = useParams();
  const [state, setState] = useState<ViewerState>({ status: "loading" });
  const [sharing, setSharing] = useState(false);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const canShareFiles = typeof navigator !== "undefined" && "share" in navigator;

  useEffect(() => {
    if (!sessionId) {
      setState({ status: "error", message: "Invalid link." });
      return;
    }
    getResult({ sessionId })
      .then((res) => setState({ status: "ready", imageUrl: res.data.imageUrl }))
      .catch(() =>
        setState({
          status: "error",
          message: "This photo has expired or could not be found.",
        })
      );
  }, [sessionId]);

  async function handleShare(imageUrl: string) {
    setShareHint(null);
    setSharing(true);
    try {
      const file = await fetchAsFile(imageUrl);
      const shareData = { files: [file], title: "NALCO Photo Booth", text: CAPTION };
      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        setShareHint("Your browser can't attach the photo directly — save it first, then share from your gallery or the app of your choice.");
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        setShareHint("Couldn't open the share sheet — save the photo instead and share it from your gallery.");
      }
    } finally {
      setSharing(false);
    }
  }

  function openIntent(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-nalco-navy p-6 text-center">
      <p className="text-xl tracking-[0.3em] text-nalco-amber">NALCO PHOTO BOOTH</p>

      {state.status === "loading" && <p className="text-white/70">Loading your photo…</p>}

      {state.status === "error" && <p className="max-w-xs text-white/70">{state.message}</p>}

      {state.status === "ready" && (
        <>
          <img
            src={state.imageUrl}
            alt="Your generated photo"
            className="w-full max-w-sm rounded-2xl border-4 border-white/20 shadow-2xl"
          />
          <a
            href={state.imageUrl}
            download="nalco-photo-booth.jpg"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-nalco-orange px-10 py-4 text-lg font-semibold text-nalco-navy shadow-lg"
          >
            Save Photo
          </a>

          {canShareFiles && (
            <button
              onClick={() => handleShare(state.imageUrl)}
              disabled={sharing}
              className="rounded-full bg-white/20 px-10 py-4 text-lg font-medium text-white disabled:opacity-50"
            >
              {sharing ? "Opening share sheet…" : "Share Photo (Instagram, WhatsApp…)"}
            </button>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() =>
                openIntent(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(CAPTION)}&url=${encodeURIComponent(pageUrl)}`
                )
              }
              className="rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white"
            >
              Post to X
            </button>
            <button
              onClick={() =>
                openIntent(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`)
              }
              className="rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white"
            >
              Post to Facebook
            </button>
            <button
              onClick={() =>
                openIntent(
                  `https://www.threads.net/intent/post?text=${encodeURIComponent(CAPTION + " " + pageUrl)}`
                )
              }
              className="rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white"
            >
              Post to Threads
            </button>
          </div>
          <p className="max-w-xs text-[11px] text-white/40">
            X / Facebook / Threads share this page's link — for Instagram, use
            "Share Photo" above (Instagram doesn't support posting from a web
            link).
          </p>

          {shareHint && <p className="max-w-xs text-xs text-nalco-amber">{shareHint}</p>}

          <p className="max-w-xs text-xs text-white/40">
            This link expires shortly for your privacy — save the photo now.
          </p>
        </>
      )}
    </div>
  );
}
