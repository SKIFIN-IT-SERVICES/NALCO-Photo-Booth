# NALCO AI Photo Booth

**Live:** https://nalco-photo-booth.web.app

Standalone tablet app implementing [ai-photo-booth-tablet-plan.md](./ai-photo-booth-tablet-plan.md).
This is **v1 scope**: capture → pick one of 9 real NALCO site scenes →
Gemini composite (4K, Nano Banana Pro) → result screen with a QR code that
opens a mobile "save your photo" page. WhatsApp/email/print delivery are
intentionally deferred (see "Not built yet" below) — nothing about the plan
is lost, just sequenced.

## Why this doesn't touch your existing Firebase project

Everything this app uses inside `skifin-ccpro` is isolated from the other
app (`nalco-ai-assistant` / the avatar-kiosk backend) that already runs
there:

| Resource | This app uses | Other app uses | Why it's safe |
|---|---|---|---|
| Hosting | new site `nalco-photo-booth` | site `nalco-ai-assistant` | Hosting sites are already isolated per-site |
| Functions | codebase `nalco-photo-booth` (region `asia-south1`) | codebase `default` (region `us-central1`) | Different codebase name — deploying one never diffs/deletes the other's functions |
| Firestore | **dedicated database** `nalco-photo-booth` | the `(default)` database | Firestore/Storage are project-wide, not per-site — so this app got its own named database instead of sharing (and possibly overwriting the rules of) the default one |
| Storage | **dedicated bucket** `skifin-ccpro-nalco-photo-booth` | the default bucket `skifin-ccpro.firebasestorage.app` | Same reasoning — a separate bucket means separate rules, separate data, zero overlap |

`firebase deploy` from this folder only ever touches the resources named
above (see `firebase.json` / `.firebaserc`) — it cannot affect the other
app's hosting site, functions, database, or bucket.

## One-time project setup (already done for this deployment)

These commands were already run for `skifin-ccpro` — recorded here only for
setting this up again on a fresh project/clone:

```bash
npm install -g firebase-tools   # if you don't have it
firebase login

# New, isolated hosting site:
firebase hosting:sites:create nalco-photo-booth --project skifin-ccpro
firebase target:apply hosting nalco-photo-booth nalco-photo-booth --project skifin-ccpro

# New, isolated Firestore database (separate from the project's (default) one):
gcloud firestore databases create --database=nalco-photo-booth --location=asia-south1 \
  --type=firestore-native --project=skifin-ccpro

# New, isolated Storage bucket (separate from the project's default bucket):
gcloud storage buckets create gs://skifin-ccpro-nalco-photo-booth \
  --project=skifin-ccpro --location=asia-south1 --uniform-bucket-level-access
firebase target:apply storage nalco-photo-booth skifin-ccpro-nalco-photo-booth --project skifin-ccpro
```

This app's rules (`firestore.rules`, `storage.rules`) deny *all* direct
client access on its own database/bucket — every read/write goes through
Cloud Functions. They're deployed with `firebase deploy --only firestore`
and `firebase deploy --only storage` (no target suffix needed — the only
database/bucket declared in this repo's `firebase.json` is this app's own).

## Install dependencies

```bash
cd functions && npm install
cd ../web && npm install
```

## Configure the Gemini API key

```bash
cp functions/.env.example functions/.env
# then edit functions/.env and set GEMINI_API_KEY=...
```

`functions/.env` is gitignored and auto-loaded by Firebase Functions v2 at
both emulate-time and deploy-time — no separate secret-manager step needed.

## Run locally

```bash
# Terminal 1 — backend emulators
cd functions && npm run build:watch

# Terminal 2
firebase emulators:start --only functions,firestore,storage

# Terminal 3 — frontend
cd web && npm run dev
```

Open the printed Vite URL on a laptop/tablet browser with a webcam. Note:
the local dev frontend talks to your **deployed** Cloud Functions unless
you also point `web/src/firebase.ts` at the emulator
(`connectFunctionsEmulator`) — add that yourself if you want fully offline
dev; left out by default so the QR-code "view" page (which visitors' own
phones hit) always works against production.

## Deploy

```bash
# Backend
cd functions && npm run deploy

# Frontend (builds then deploys only the nalco-photo-booth hosting target)
cd web && npm run deploy
```

The tablet should run the deployed hosting URL in a locked-down/kiosk
browser (guided access on iPad, or a kiosk-mode Chrome flag on Android/
Windows tablets) — see "Not built yet" for what's still needed there.

## Scenes

Ships with **9 real NALCO site photos**, scraped from the official
homepage carousel (nalcoindia.com) — not AI-generated: Port Terminal, Mine
Access Road, Refinery View, Corporate HQ, Refinery Aerial, Ingot Warehouse,
Power Plant, Mining Fleet, Wind Farm. (An earlier version of this app used
13 AI-generated placeholder scenes; those were scrapped in favor of these
authentic photos. Two other carousel banners — a mobile health camp and a
CSR tailoring class — were excluded because they feature identifiable
private individuals in a context unrelated to the booth.)

Each scene's real photo is used two ways:
- `web/public/scenes/{id}.jpg` — small (480px) thumbnail shown on the picker
- `functions/assets/scenes/{id}.jpg` — larger (1280px) copy sent to Gemini
  as an actual background reference image alongside the selfie, so the
  model composites onto the real photo rather than an imagined scene

Full-resolution originals are kept in `scene-sources/` (not deployed
anywhere — not under `web/` or `functions/`) in case you want to re-export
at a different size later.

Defined in two places that must stay in sync by `id`:
- [functions/src/scenes.ts](./functions/src/scenes.ts) — prompt detail + reference image filename per scene
- [web/src/data/scenes.ts](./web/src/data/scenes.ts) — name/description/thumbnail shown on the picker

To add/remove/reorder scenes: drop a photo in `web/public/scenes/` +
`functions/assets/scenes/` under the same filename, add matching entries to
both `scenes.ts` files, then redeploy both functions and hosting.

## Privacy / retention

- Selfies are never persisted — only the generated composite is stored, at
  `sessions/{sessionId}/result.*` in Cloud Storage.
- `SESSION_TTL_HOURS` (functions/.env, default 2) controls how long a
  result and its Firestore record live before the hourly
  `cleanupExpiredSessions` scheduled function deletes them.
- No visitor accounts, no long-term identity storage.
- Add an on-screen consent notice on the Welcome/Capture screen before you
  go live (plan §9) — not yet implemented as a blocking UI step.

## Not built yet (see plan §12 "Open Decisions")

- **WhatsApp Business API delivery** — currently the QR code opens a save
  page instead; wiring the Business Cloud API is a distinct integration
  that needs Meta credentials you haven't set up yet.
- **Email delivery** — same idea, needs a transactional email provider key.
- **Print integration** — needs the actual printer make/model decided first.
- **Kiosk/guided-access lockdown, idle timers beyond the result screen,
  on-screen consent notice** — plan §11 Phase 4 hardening.
- **PPE/safety-compliance auto-check on generated images** — open decision
  in plan §12, not implemented.

## Image quality / resolution

Backend uses `gemini-3-pro-image-preview` ("Nano Banana Pro") with
`generationConfig.imageConfig.imageSize: "4K"` (set via `GEMINI_MODEL` /
`GEMINI_IMAGE_SIZE` in `functions/.env`) — confirmed output around
5400×3072px, several MB per photo. This is deliberately the Pro tier, not
the cheaper `gemini-3.1-flash-image-preview` from the original plan: Flash
tops out around 1300×768 regardless of prompt, which looked visibly soft
full-screen on a tablet. The `@google/generative-ai` SDK doesn't yet type
the `imageConfig` field, so `functions/src/gemini.ts` calls the REST API
directly instead of going through the SDK.

Trade-offs of the Pro/4K switch:
- **Slower**: ~30–60s per generation (vs a few seconds for Flash) — the
  Generating screen copy and the callable's timeouts (`functions/src/index.ts`,
  `web/src/firebase.ts`) were both raised to accommodate this.
- **Pricier**: roughly 2–3x Flash's per-image cost (see below).
- Drop to `GEMINI_MODEL=gemini-3.1-flash-image-preview` in `functions/.env`
  and redeploy functions if you'd rather trade quality back for speed/cost.

## Cost

The plan's original table (§10) assumed Flash at ~$0.067/generation. Running
Nano Banana Pro at 4K costs more per image — budget roughly 2–3x that
(check current pricing at ai.studio, since preview-model pricing can move).
WhatsApp/email/print/printer consumables are still separate, budgeted once
those phases start.
