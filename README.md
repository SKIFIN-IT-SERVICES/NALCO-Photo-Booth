# NALCO AI Photo Booth

**Live:** https://nalco-photo-booth.web.app

Standalone tablet app implementing [ai-photo-booth-tablet-plan.md](./ai-photo-booth-tablet-plan.md).
This is **v1 scope**: capture → pick one of 9 real NALCO site scenes →
pick a format (aspect ratio + quality tier) → Gemini composite → result
screen with a QR code that opens a mobile "save your photo" page.
WhatsApp/email delivery are intentionally deferred (see "Not built yet"
below) — nothing about the plan is lost, just sequenced.

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

## Session flow, print, and social sharing

- The Result screen (tablet) no longer auto-resets — the session stays on
  screen until the operator/visitor taps **Close Session**. There's also a
  **Print Photo** button that calls the browser's print dialog against
  whatever printer is set as the tablet's OS default (USB or network) — no
  vendor SDK, so it works with any already-configured printer. If you get a
  dedicated photo-booth printer (DNP/Mitsubishi dye-sub, etc.) later, that
  needs its own vendor integration in place of `window.print()`.
- The mobile "view" page (opened via QR code) has a **Share Photo** button
  using the Web Share API with the actual image file attached — on a phone
  this opens the native share sheet with every installed app (Instagram,
  WhatsApp, Facebook, Threads, X, etc.) as a target. Below it are direct
  **Post to X / Facebook / Threads** links — these only share the page link
  + caption (not the raw file), since none of those platforms accept an
  image attachment via a plain web URL.
- **YouTube is intentionally not included** — it's video-only, there's no
  way to post a still photo to it from a link or share sheet.

## Not built yet (see plan §12 "Open Decisions")

- **WhatsApp Business API delivery** — currently the QR code opens a save
  page instead; wiring the Business Cloud API is a distinct integration
  that needs Meta credentials you haven't set up yet.
- **Email delivery** — same idea, needs a transactional email provider key.
- **Kiosk/guided-access lockdown, on-screen consent notice** — plan §11
  Phase 4 hardening.
- **PPE/safety-compliance auto-check on generated images** — open decision
  in plan §12, not implemented.

## Format picker (aspect ratio + quality → automatic model switch)

Between the scene picker and generation, visitors hit a **Format** screen
([web/src/screens/FormatPicker.tsx](./web/src/screens/FormatPicker.tsx)) to
choose:

- **Shape**: Square (1:1, for social posts), Portrait (4:5), Landscape
  (16:9) — sent as `generationConfig.imageConfig.aspectRatio`, confirmed
  both models respect it (tested Flash at 9:16 → real 768×1376 output; Pro
  at 1:1 + 2K → real 2048×2048 output).
- **Quality**: Standard, HD, 2K, 4K — this choice **picks the model**, not
  just a parameter:
  - Standard → `gemini-3.1-flash-image-preview` (fast, ~10-20s, cheapest;
    ignores resolution requests and stays near its native ~1300px-class
    output regardless of what's asked)
  - HD/2K/4K → `gemini-3-pro-image-preview` ("Nano Banana Pro", ~20-60s) at
    `imageConfig.imageSize` 1K/2K/4K respectively — confirmed 4K output is
    genuinely ~5400×3072px, several MB per photo

The mapping lives in `functions/src/format.ts` (backend) and
`web/src/data/format.ts` (frontend) — kept as separate small files rather
than hardcoded inline so the tier list/defaults are easy to change later.
The `@google/generative-ai` SDK doesn't yet type the `imageConfig` field,
so `functions/src/gemini.ts` calls the REST API directly instead of going
through the SDK.

Because quality is now chosen per-request, `functions/.env` no longer pins
a fixed `GEMINI_MODEL`/`GEMINI_IMAGE_SIZE` — only `GEMINI_API_KEY` and
`SESSION_TTL_HOURS` remain.

## Cost

The plan's original table (§10) assumed Flash at ~$0.067/generation.
Standard tier tracks that; HD/2K/4K run Nano Banana Pro instead, which
costs more per image — budget roughly 2–3x for HD/2K and more for 4K
(check current pricing at ai.studio, since preview-model pricing can move).
Since quality is now a per-visitor choice, actual monthly cost depends on
how the tiers get used — worth watching for the first week or two on-site.
WhatsApp/email/print consumables are still separate, budgeted once those
phases start.
