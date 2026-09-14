import { useEffect } from "react";
import { useBooth } from "../state/BoothContext";
import { generatePhoto } from "../firebase";

function dataUrlToBase64(dataUrl: string): { base64: string; mimeType: string } {
  const [header, base64] = dataUrl.split(",");
  const mimeType = header.match(/data:(.*);base64/)?.[1] ?? "image/jpeg";
  return { base64, mimeType };
}

export default function Generating() {
  const { selfieDataUrl, sceneId, setResult, setError } = useBooth();

  useEffect(() => {
    if (!selfieDataUrl || !sceneId) {
      setError("Something went wrong — missing photo or scene. Please start again.");
      return;
    }

    const { base64, mimeType } = dataUrlToBase64(selfieDataUrl);

    generatePhoto({ selfieBase64: base64, mimeType, sceneId })
      .then((res) => {
        setResult(res.data.sessionId, res.data.imageUrl);
      })
      .catch((err) => {
        console.error(err);
        setError("We couldn't generate your photo this time. Please try again.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 bg-nalco-navy">
      <div className="h-20 w-20 animate-spin rounded-full border-8 border-white/20 border-t-nalco-orange" />
      <p className="text-2xl font-medium text-white">Creating your photo…</p>
      <p className="text-white/60">This usually takes about 10 seconds</p>
    </div>
  );
}
