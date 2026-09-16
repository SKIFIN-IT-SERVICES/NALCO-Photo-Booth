import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getResult } from "../firebase";
import { InstagramIcon, WhatsAppIcon, XIcon, FacebookIcon, ThreadsIcon } from "../components/SocialIcons";
import PhotoZoomViewer from "../components/PhotoZoomViewer";
import { bakeFilterToBlob } from "../lib/bakeFilter";
import { getFilter } from "../data/filters";

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

type Platform = "instagram" | "whatsapp" | "x" | "facebook" | "threads";

export default function Viewer() {
  const { sessionId } = useParams();
  const [state, setState] = useState<ViewerState>({ status: "loading" });
  const [busy, setBusy] = useState<Platform | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [filterId, setFilterId] = useState("none");
  const [bakedUrl, setBakedUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const canShareFiles = typeof navigator !== "undefined" && "share" in navigator;
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

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

  // Re-bake a downloadable/shareable file whenever the chosen filter
  // changes, so Save/Share reflect whatever was picked in the zoom viewer.
  useEffect(() => {
    if (state.status !== "ready") return;
    if (filterId === "none") {
      setBakedUrl(null);
      return;
    }
    let cancelled = false;
    bakeFilterToBlob(state.imageUrl, getFilter(filterId).css).then((blob) => {
      if (cancelled) return;
      const url = URL.createObjectURL(blob);
      setBakedUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterId, state.status === "ready" ? state.imageUrl : null]);

  const effectiveUrl = (state.status === "ready" && (bakedUrl ?? state.imageUrl)) || "";

  // Instagram and WhatsApp only accept the actual photo through the OS
  // share sheet — there's no web link either platform accepts an image
  // through directly, so this is the real path into either app with the
  // photo attached (the user picks the app from the sheet that opens).
  async function shareFile(platform: Platform, imageUrl: string) {
    setHint(null);
    setBusy(platform);
    try {
      const file = await fetchAsFile(imageUrl);
      const shareData = { files: [file], title: "NALCO Photo Booth", text: CAPTION };
      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        setHint("Your browser can't attach the photo directly — save it first, then open the app and share it from there.");
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        setHint("Couldn't open the share sheet — save the photo instead and share it from your gallery.");
      }
    } finally {
      setBusy(null);
    }
  }

  // X, Facebook, and Threads publish an official web "compose" link that
  // opens their own app directly on a phone (when installed) — but only
  // with a caption + link, since none of them accept an image file through
  // a plain URL.
  function openComposeLink(platform: Platform, url: string) {
    setHint(
      platform === "x"
        ? "Opens X with a caption + link ready — attach the photo yourself if you'd like it in the post."
        : platform === "facebook"
          ? "Opens Facebook with the link ready to share."
          : "Opens Threads with a caption + link ready — attach the photo yourself if you'd like it in the post."
    );
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-nalco-navy p-6 text-center">
      <p className="text-xl tracking-[0.3em] text-nalco-amber">NALCO PHOTO BOOTH</p>

      {state.status === "loading" && <p className="text-white/70">Loading your photo…</p>}

      {state.status === "error" && <p className="max-w-xs text-white/70">{state.message}</p>}

      {state.status === "ready" && (
        <>
          <button
            onClick={() => setViewerOpen(true)}
            aria-label="Tap to zoom and apply filters"
            className="w-full max-w-sm"
          >
            <img
              src={effectiveUrl}
              alt="Your generated photo"
              className="w-full rounded-2xl border-4 border-white/20 shadow-2xl"
            />
          </button>
          <p className="-mt-2 text-xs text-white/40">Tap the photo to zoom in or apply a filter</p>

          <button
            onClick={async () => {
              setDownloading(true);
              try {
                const blob = await bakeFilterToBlob(state.imageUrl, getFilter(filterId).css);
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "nalco-photo-booth.jpg";
                a.click();
                URL.revokeObjectURL(url);
              } catch {
                window.open(state.imageUrl, "_blank", "noopener,noreferrer");
              } finally {
                setDownloading(false);
              }
            }}
            disabled={downloading}
            className="rounded-full bg-nalco-orange px-10 py-4 text-lg font-semibold text-nalco-navy shadow-lg disabled:opacity-50"
          >
            {downloading ? "Saving…" : "Save Photo"}
          </button>

          <div>
            <p className="mb-3 text-sm text-white/60">Post it straight to:</p>
            <div className="flex flex-wrap justify-center gap-4">
              {canShareFiles && (
                <button
                  onClick={() => shareFile("instagram", effectiveUrl)}
                  disabled={busy !== null}
                  aria-label="Share to Instagram"
                  className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg disabled:opacity-50"
                  style={{ background: "linear-gradient(45deg,#f58529,#dd2a7b,#8134af,#515bd4)" }}
                >
                  {busy === "instagram" ? <Spinner /> : <InstagramIcon />}
                </button>
              )}
              {canShareFiles && (
                <button
                  onClick={() => shareFile("whatsapp", effectiveUrl)}
                  disabled={busy !== null}
                  aria-label="Share to WhatsApp"
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg disabled:opacity-50"
                >
                  {busy === "whatsapp" ? <Spinner /> : <WhatsAppIcon />}
                </button>
              )}
              <button
                onClick={() =>
                  openComposeLink(
                    "x",
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(CAPTION)}&url=${encodeURIComponent(pageUrl)}`
                  )
                }
                aria-label="Post to X"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-lg"
              >
                <XIcon />
              </button>
              <button
                onClick={() =>
                  openComposeLink(
                    "facebook",
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`
                  )
                }
                aria-label="Post to Facebook"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-lg"
              >
                <FacebookIcon />
              </button>
              <button
                onClick={() =>
                  openComposeLink(
                    "threads",
                    `https://www.threads.net/intent/post?text=${encodeURIComponent(CAPTION + " " + pageUrl)}`
                  )
                }
                aria-label="Post to Threads"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-lg"
              >
                <ThreadsIcon />
              </button>
            </div>
          </div>

          {hint && <p className="max-w-xs text-xs text-nalco-amber">{hint}</p>}

          <p className="max-w-xs text-[11px] text-white/40">
            Instagram & WhatsApp open with your photo attached. X, Facebook &
            Threads open with a link (no platform accepts an image file
            through a web link). YouTube isn't offered — it only accepts
            video uploads.
          </p>

          <p className="max-w-xs text-xs text-white/40">
            This link expires shortly for your privacy — save the photo now.
          </p>

          {viewerOpen && (
            <PhotoZoomViewer
              imageUrl={state.imageUrl}
              initialFilterId={filterId}
              onApply={(id) => {
                setFilterId(id);
                setViewerOpen(false);
              }}
              onClose={() => setViewerOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
}

function Spinner() {
  return <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />;
}
