import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Scene } from "./scenes";
import { resolveAspectRatio, resolveQuality, type AspectRatioId, type QualityId } from "./format";

const BASE_PROMPT =
  "You are given two images. The first is a photo of a person. The second " +
  "is a real photo of an industrial mining/refinery site. Composite the " +
  "person from the first image naturally into the scene from the second " +
  "image. Preserve their facial identity and features exactly — do not " +
  "alter their face. Keep the second image's background, equipment, " +
  "signage and lighting exactly as shown; do not invent a different " +
  "location. Match the lighting, shadows, grain, and color grading of the " +
  "second image so the result looks like a single real photograph taken " +
  "on-site, not a cutout or collage. Reframe the composition to fill the " +
  "requested aspect ratio naturally (e.g. show more of the scene for a " +
  "wide frame, a tighter crop for a tall one) rather than adding blank " +
  "space or letterboxing. Subject slightly off-center, looking toward the " +
  "camera with a natural, confident expression.\n\n";

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
