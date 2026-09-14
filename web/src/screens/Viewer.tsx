import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getResult } from "../firebase";

type ViewerState =
  | { status: "loading" }
  | { status: "ready"; imageUrl: string }
  | { status: "error"; message: string };

export default function Viewer() {
  const { sessionId } = useParams();
  const [state, setState] = useState<ViewerState>({ status: "loading" });

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
          <p className="max-w-xs text-xs text-white/40">
            This link expires shortly for your privacy — save the photo now.
          </p>
        </>
      )}
    </div>
  );
}
