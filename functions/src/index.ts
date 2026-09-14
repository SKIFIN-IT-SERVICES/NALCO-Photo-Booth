import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { setGlobalOptions } from "firebase-functions/v2";
import { nanoid } from "nanoid";
import { getScene } from "./scenes";
import { generateComposite } from "./gemini";

initializeApp();
setGlobalOptions({ region: "asia-south1", maxInstances: 10 });

// This app gets its own Firestore database and Storage bucket — separate
// from the project's (default) ones used by other apps in skifin-ccpro —
// so nothing here can collide with or overwrite their data or rules.
const db = getFirestore("nalco-photo-booth");
const bucket = getStorage().bucket("skifin-ccpro-nalco-photo-booth");

const MAX_SELFIE_BYTES = 8 * 1024 * 1024; // 8MB
const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS || 2);
const SIGNED_URL_TTL_MS = 60 * 60 * 1000; // 1 hour, refreshed via getResult

interface GeneratePhotoRequest {
  selfieBase64: string;
  mimeType: string;
  sceneId: string;
}

interface GeneratePhotoResponse {
  sessionId: string;
  imageUrl: string;
  expiresAt: number;
}

/**
 * Tablet calls this once, right after the visitor confirms their selfie and
 * picks a scene. Does the Gemini compositing, stores the result, and hands
 * back a signed URL the tablet (and later the QR "view" page) can use.
 */
export const generatePhoto = onCall(
  { timeoutSeconds: 60, memory: "512MiB" },
  async (request): Promise<GeneratePhotoResponse> => {
    const data = request.data as GeneratePhotoRequest;

    if (!data?.selfieBase64 || !data?.mimeType || !data?.sceneId) {
      throw new HttpsError(
        "invalid-argument",
        "selfieBase64, mimeType and sceneId are required."
      );
    }

    const scene = getScene(data.sceneId);
    if (!scene) {
      throw new HttpsError("invalid-argument", `Unknown sceneId: ${data.sceneId}`);
    }

    if (!/^image\/(jpeg|png|webp)$/.test(data.mimeType)) {
      throw new HttpsError("invalid-argument", "Selfie must be JPEG, PNG or WebP.");
    }

    const approxBytes = (data.selfieBase64.length * 3) / 4;
    if (approxBytes > MAX_SELFIE_BYTES) {
      throw new HttpsError("invalid-argument", "Selfie is too large.");
    }

    const sessionId = nanoid(12);

    // One retry on transient generation failure, per the plan's error-handling rule.
    let result;
    try {
      result = await generateComposite(data.selfieBase64, data.mimeType, scene);
    } catch (firstErr) {
      try {
        result = await generateComposite(data.selfieBase64, data.mimeType, scene);
      } catch (secondErr) {
        console.error("Gemini generation failed twice", { sessionId, firstErr, secondErr });
        throw new HttpsError("internal", "Photo generation failed. Please try again.");
      }
    }

    const ext = result.mimeType === "image/jpeg" ? "jpg" : "png";
    const filePath = `sessions/${sessionId}/result.${ext}`;
    const file = bucket.file(filePath);

    await file.save(result.buffer, {
      contentType: result.mimeType,
      metadata: { cacheControl: "private, max-age=0, no-cache" },
    });

    const now = Date.now();
    const expiresAt = now + SESSION_TTL_HOURS * 60 * 60 * 1000;

    await db.collection("sessions").doc(sessionId).set({
      sceneId: scene.id,
      resultPath: filePath,
      contentType: result.mimeType,
      createdAt: Timestamp.fromMillis(now),
      expiresAt: Timestamp.fromMillis(expiresAt),
    });

    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + SIGNED_URL_TTL_MS,
    });

    return { sessionId, imageUrl: signedUrl, expiresAt };
  }
);

interface GetResultResponse {
  imageUrl: string;
  expiresAt: number;
}

/**
 * Used by the QR-code "view" page (opened on the visitor's own phone) to
 * fetch a fresh signed URL for the result image.
 */
export const getResult = onCall(
  { timeoutSeconds: 30 },
  async (request): Promise<GetResultResponse> => {
    const sessionId = (request.data as { sessionId?: string })?.sessionId;
    if (!sessionId) {
      throw new HttpsError("invalid-argument", "sessionId is required.");
    }

    const doc = await db.collection("sessions").doc(sessionId).get();
    if (!doc.exists) {
      throw new HttpsError("not-found", "This photo has expired or does not exist.");
    }

    const { resultPath, expiresAt } = doc.data() as {
      resultPath: string;
      expiresAt: Timestamp;
    };

    if (expiresAt.toMillis() < Date.now()) {
      throw new HttpsError("not-found", "This photo has expired.");
    }

    const file = bucket.file(resultPath);
    const [exists] = await file.exists();
    if (!exists) {
      throw new HttpsError("not-found", "This photo has expired or does not exist.");
    }

    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + SIGNED_URL_TTL_MS,
    });

    return { imageUrl: signedUrl, expiresAt: expiresAt.toMillis() };
  }
);

/**
 * Hourly sweep: deletes expired session images/docs so no visitor selfie or
 * composite outlives its stated retention window (privacy requirement).
 */
export const cleanupExpiredSessions = onSchedule("every 60 minutes", async () => {
  const now = Timestamp.now();
  const expired = await db.collection("sessions").where("expiresAt", "<", now).get();

  if (expired.empty) {
    return;
  }

  await Promise.all(
    expired.docs.map(async (doc) => {
      const { resultPath } = doc.data() as { resultPath: string };
      await bucket
        .file(resultPath)
        .delete({ ignoreNotFound: true })
        .catch((err) => console.error(`Failed to delete ${resultPath}`, err));
      await doc.ref.delete();
    })
  );

  console.log(`Cleaned up ${expired.size} expired session(s).`);
});
