import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Scene } from "./scenes";

const BASE_PROMPT =
  "You are given two images. The first is a photo of a person. The second " +
  "is a real photo of an industrial mining/refinery site. Composite the " +
  "person from the first image naturally into the scene from the second " +
  "image. Preserve their facial identity and features exactly — do not " +
  "alter their face. Keep the second image's background, equipment, " +
  "signage and lighting exactly as shown; do not invent a different " +
  "location. Match the lighting, shadows, grain, and color grading of the " +
  "second image so the result looks like a single real photograph taken " +
  "on-site, not a cutout or collage. Frame as a waist-up portrait, subject " +
  "slightly off-center, looking toward the camera with a natural, " +
  "confident expression.\n\n";

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to functions/.env (see .env.example)."
    );
  }
  if (!client) {
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

function loadReferenceImage(filename: string): { data: string; mimeType: string } {
  const path = join(__dirname, "..", "assets", "scenes", filename);
  const buffer = readFileSync(path);
  return { data: buffer.toString("base64"), mimeType: "image/jpeg" };
}

export interface GeneratedImage {
  buffer: Buffer;
  mimeType: string;
}

export async function generateComposite(
  selfieBase64: string,
  selfieMimeType: string,
  scene: Scene
): Promise<GeneratedImage> {
  const modelName = process.env.GEMINI_MODEL || "gemini-3.1-flash-image-preview";
  const model = getClient().getGenerativeModel({ model: modelName });

  const reference = loadReferenceImage(scene.referenceImage);
  const prompt = BASE_PROMPT + "Scene-specific direction: " + scene.promptDetail;

  const result = await model.generateContent([
    { inlineData: { data: selfieBase64, mimeType: selfieMimeType } },
    { inlineData: { data: reference.data, mimeType: reference.mimeType } },
    { text: prompt },
  ]);

  const parts = result.response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => "inlineData" in p && p.inlineData);

  if (!imagePart || !("inlineData" in imagePart) || !imagePart.inlineData) {
    throw new Error("Gemini did not return an image for this request.");
  }

  return {
    buffer: Buffer.from(imagePart.inlineData.data, "base64"),
    mimeType: imagePart.inlineData.mimeType || "image/png",
  };
}
