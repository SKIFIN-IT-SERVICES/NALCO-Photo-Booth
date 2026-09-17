import { initializeApp } from "firebase/app";
import { isSupported, getAnalytics } from "firebase/analytics";
import { getFunctions, httpsCallable } from "firebase/functions";
import type { AspectRatioId, QualityId } from "./data/format";

// Web app config from the "nalco-photo-booth" app registered inside the
// existing skifin-ccpro Firebase project. This app talks only to Cloud
// Functions (callable) — it never touches Firestore/Storage directly.
const firebaseConfig = {
  apiKey: "AIzaSyDQBL7TWPuSNxvWQJ4yOBnvhkDKMVVjnHo",
  authDomain: "skifin-ccpro.firebaseapp.com",
  projectId: "skifin-ccpro",
  storageBucket: "skifin-ccpro.firebasestorage.app",
  messagingSenderId: "114792777692",
  appId: "1:114792777692:web:b3689adea6b33b4702f119",
  measurementId: "G-V7H4E3QZ2C",
};

export const app = initializeApp(firebaseConfig);

// Analytics isn't supported in every environment (e.g. some in-app browsers
// used to scan the QR code) — only initialize it when it's safe to.
isSupported()
  .then((supported) => {
    if (supported) getAnalytics(app);
  })
  .catch(() => {
    /* analytics is best-effort only */
  });

// Must match the region set in functions/src/index.ts (setGlobalOptions).
const functions = getFunctions(app, "asia-south1");

export interface GeneratePhotoRequest {
  selfieBase64: string;
  mimeType: string;
  sceneId: string;
  aspectRatio: AspectRatioId;
  quality: QualityId;
}
export interface GeneratePhotoResponse {
  sessionId: string;
  imageUrl: string;
  expiresAt: number;
}
// Longer than the SDK's 70s default — 4K Nano Banana Pro generations can
// take a while, and the backend itself allows up to 120s.
export const generatePhoto = httpsCallable<GeneratePhotoRequest, GeneratePhotoResponse>(
  functions,
  "generatePhoto",
  { timeout: 140_000 }
);

export interface GetResultResponse {
  imageUrl: string;
  expiresAt: number;
}
export const getResult = httpsCallable<{ sessionId: string }, GetResultResponse>(
  functions,
  "getResult"
);

export interface UpdatePhotoRequest {
  sessionId: string;
  imageBase64: string;
  mimeType: string;
}
export interface UpdatePhotoResponse {
  imageUrl: string;
}
export const updatePhoto = httpsCallable<UpdatePhotoRequest, UpdatePhotoResponse>(
  functions,
  "updatePhoto",
  { timeout: 40_000 }
);
