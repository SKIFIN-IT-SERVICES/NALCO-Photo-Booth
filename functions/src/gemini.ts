import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Scene } from "./scenes";
import { resolveAspectRatio, resolveQuality, type AspectRatioId, type QualityId } from "./format";

// Identity fidelity is the single most important quality bar here — a
// visitor will immediately reject a photo that doesn't look like them.
// The wording below ("pixel-accurate", "copy, not inspiration", an
// explicit feature-by-feature list) is deliberately blunt: a softer
// "preserve their identity" framing measurably drifted the face (fuller
// beard, different hairstyle, rounder jaw) in side-by-side testing against
// this exact stronger version, which held the hairstyle/beard/face shape
// much closer to the source photo. Keep this framing if you touch the
// prompt again — verify any change against a real before/after, not just
// intuition, since small wording changes here have an outsized effect.
const BASE_PROMPT =
  "Edit the second image (a real industrial mining/refinery site photo) by " +
  "inserting the exact person from the first image into it. This is a " +
  "strict face-identity task, not a reimagining: the output face must be " +
  "pixel-accurate to the first image — same face shape, same eyes, " +
  "eyebrows and eye spacing, same nose shape, same mouth and lip shape, " +
  "same jawline and chin, same skin tone and texture, same facial hair " +
  "(exact style and length), same hairstyle and hairline. Do not beautify, " +
  "restyle, idealize, or regenerate the face. Do not blend it with a " +
  "different face. Treat the first image's face as a fixed reference to " +
  "copy, not inspiration.\n\n" +
  "Everything else about the person (clothing, pose, body) may adapt " +
  "naturally to fit the scene and the direction below. Keep the second " +
  "image's background, equipment, signage and lighting exactly as shown; " +
  "do not invent a different location. Match the lighting, shadows, grain, " +
  "and color grading of the second image so the result looks like a " +
  "single real photograph taken on-site, not a cutout or collage. Reframe " +
  "the composition to fill the requested aspect ratio naturally (e.g. show " +
  "more of the scene for a wide frame, a tighter crop for a tall one) " +
  "rather than adding blank space or letterboxing. Subject slightly " +
  "off-center, looking toward the camera with a natural, confident " +
  "expression.\n\n";

function loadReferenceImage(filename: string): { data: string; mimeType: string } {
  const path = join(__dirname, "..", "assets", "scenes", filename);
  const buffer = readFileSync(path);
  return { data: buffer.toString("base64"), mimeType: "image/jpeg" };
}

export interface GeneratedImage {
  buffer: Buffer;
  mimeType: string;
}

interface GeminiInlinePart {
  inlineData?: { data: string; mimeType: string };
  text?: string;
}

interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiInlinePart[] } }[];
}

export async function generateComposite(
  selfieBase64: string,
  selfieMimeType: string,
  scene: Scene,
  aspectRatioId: AspectRatioId,
  qualityId: QualityId
): Promise<GeneratedImage> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to functions/.env (see .env.example)."
    );
  }

  // The quality tier the visitor picked decides which model actually runs:
  // Standard -> the fast/cheap Flash model (no resolution control, stays
  // near its native ~1300px-class output). HD/2K/4K -> Nano Banana Pro
  // (gemini-3-pro-image-preview), the only model that supports the
  // imageConfig.imageSize control. See functions/src/format.ts for the
  // mapping. The @google/generative-ai SDK doesn't yet type these
  // imageConfig fields, so this calls the REST API directly.
  const { model: modelName, imageSize } = resolveQuality(qualityId);
  const aspectRatio = resolveAspectRatio(aspectRatioId);

  const reference = loadReferenceImage(scene.referenceImage);
  const prompt = BASE_PROMPT + "Scene-specific direction: " + scene.promptDetail;

  const imageConfig: Record<string, string> = { aspectRatio };
  if (imageSize) imageConfig.imageSize = imageSize;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inlineData: { data: selfieBase64, mimeType: selfieMimeType } },
              { inlineData: { data: reference.data, mimeType: reference.mimeType } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: { imageConfig },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${body}`);
  }

  const json = (await response.json()) as GeminiResponse;
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData);

  if (!imagePart?.inlineData) {
    throw new Error("Gemini did not return an image for this request.");
  }

  return {
    buffer: Buffer.from(imagePart.inlineData.data, "base64"),
    mimeType: imagePart.inlineData.mimeType || "image/jpeg",
  };
}
