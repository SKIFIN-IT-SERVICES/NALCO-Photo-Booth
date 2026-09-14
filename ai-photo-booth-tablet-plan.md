# AI Photo Booth — Standalone Tablet App Plan
**Independent Project — NALCO Mining-Themed Photo Experience**

---

## 1. Overview

A **standalone tablet app**, separate from any existing avatar/kiosk project. A visitor walks up to the tablet and:

1. Taps "Start" on the idle/welcome screen.
2. Captures a selfie via the tablet's front camera.
3. Chooses one of 4–5 themed mining-site backgrounds.
4. Gets an AI-generated composite photo (via Gemini API / Nano Banana) placing them realistically into the scene.
5. Receives the photo via **QR code → WhatsApp/email**, or prints it on a connected printer.

This is a self-contained app with its own screen flow, backend, and deployment — no dependency on the Tavus avatar experience.

---

## 2. Goals & Constraints

- **Hardware:** A dedicated tablet with front-facing camera, reliable internet, optionally paired with a physical printer.
- **Experience:** Fast, touch-only, walk-up-and-use, no login.
- **Output quality:** Realistic compositing — visitor's face/likeness preserved, placed naturally into an industrial mining scene with appropriate PPE/safety gear.
- **Delivery:** Visitor leaves with a digital copy (WhatsApp/email via QR) and/or a physical print.
- **Cost-conscious:** Should scale affordably to hundreds/thousands of visitors per month.
- **Privacy:** No long-term storage of visitor faces without necessity; short-lived sessions.
- **Independence:** No shared codebase or runtime dependency on the avatar/kiosk project — can be built, deployed, and updated on its own timeline.

---

## 3. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    STANDALONE TABLET APP                     │
│  ┌──────────────┐   ┌───────────────┐   ┌─────────────────┐  │
│  │ Welcome/Idle │──▶│ Photo Capture │──▶│ Background Pick  │  │
│  │    Screen    │   │   (webcam)    │   │  (4-5 options)   │  │
│  └──────────────┘   └───────────────┘   └─────────┬─────────┘  │
│                                                     │            │
│                                                     ▼            │
│                                          ┌────────────────────┐ │
│                                          │  Generating Screen │ │
│                                          │  (loading state)   │ │
│                                          └─────────┬──────────┘ │
│                                                     │            │
│                                                     ▼            │
│                                          ┌────────────────────┐ │
│                                          │   Result Screen    │ │
│                                          │  QR Code | Print   │ │
│                                          └────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │  HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Own Cloud Service)                │
│  ┌───────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Session API  │  │ Gemini API   │  │  Image Hosting /   │  │
│  │ (create/track)│─▶│  Proxy Call  │─▶│  Short-lived URLs  │  │
│  └───────────────┘  └──────────────┘  └─────────┬──────────┘  │
│                                                    │             │
│                     ┌──────────────────────────────┼──────────┐│
│                     ▼                              ▼          ││
│          ┌────────────────────┐        ┌────────────────────┐││
│          │ WhatsApp/Email Send │        │  Print Job Queue   │││
│          └────────────────────┘        └────────────────────┘││
└─────────────────────────────────────────────────────────────┘
```

**Why a backend proxy (not direct tablet → Gemini)?**
- Keeps the Gemini API key off the tablet device (security).
- Lets you log usage, apply rate limits, retry failed generations, and swap models without touching the tablet app.
- Needed anyway for QR-code hosting, WhatsApp/email sending, and print queueing.

---

## 4. User Flow (Step by Step)

| Step | Screen | Action |
|---|---|---|
| 1 | Welcome/idle screen | Tablet displays branded welcome screen, "Tap to Start" |
| 2 | Capture screen | Live front-camera preview, 3-2-1 countdown, capture |
| 3 | Confirm screen | "Use this photo?" → Retake / Continue |
| 4 | Background selection | Grid of 4–5 scene thumbnails (e.g. *Mining with Tools*, *On-Site Standing*, *Control Room*, *Safety Briefing*, *Aerial Mine View*) |
| 5 | Generating screen | Loading animation (~5–15 sec) while backend calls Gemini API |
| 6 | Result screen | Final composite shown full-screen |
| 7 | Delivery choice | **QR Code** (scan → WhatsApp or email) or **Print** (sends to paired printer) |
| 8 | Thank-you / reset | Auto-returns to welcome screen after ~20 sec or on tap |

---

## 5. Background Scene Options (Starter Set)

Define these once, reuse as prompt templates / reference images:

1. **Mining with Tools** — visitor holding/standing near drilling equipment, PPE (helmet, vest, gloves)
2. **Standing on Mining Site** — open-pit mine backdrop, safety gear, dust/industrial lighting
3. **Control Room** — visitor at monitoring station with screens/dashboards
4. **Safety Briefing** — visitor among a group in a briefing/training setup
5. **Aerial/Wide Mine View** — visitor standing with the vast mine landscape behind them

Each scene should have:
- A **reference background image** (real or AI-generated once, reused every time)
- A **fixed prompt template** describing lighting, composition, PPE requirements, and framing — for consistent output quality

---

## 6. Gemini API Integration

### 6.1 Model Choice
- **Primary model:** `gemini-3.1-flash-image-preview` (current "Nano Banana 2" — best balance of cost, speed, and composite quality; the older `gemini-2.5-flash-image` is being retired Oct 2, 2026, so don't build on it).
- **Optional upgrade path:** `gemini-3-pro-image-preview` ("Nano Banana Pro") for the print-quality version if Flash-tier results aren't sharp/consistent enough — better detail, composition reasoning, and text rendering (useful for adding NALCO branding/text overlays).

### 6.2 Request Pattern
Send two images + one instruction in a single call:
1. Visitor's captured selfie (reference image — preserve identity/likeness)
2. Chosen background reference image (or rely on detailed text description)
3. Text prompt describing desired composition, pose, PPE, lighting match, framing

**Example prompt structure:**
```
Take the person from the first reference image and place them naturally
into the mining site scene from the second reference image. Preserve their
facial identity and features exactly. Dress them in appropriate safety gear
(helmet, high-vis vest, gloves) consistent with the scene. Match the lighting,
shadows, and color grading of the background so the composite looks like a
single real photograph. Frame as a waist-up portrait, subject slightly
off-center, looking toward camera.
```

### 6.3 Backend Flow
```
1. Tablet uploads selfie → backend creates session, stores temp image
2. Backend calls Gemini API with selfie + chosen background + prompt
3. Gemini returns generated image (base64 or file)
4. Backend stores result at a short-lived signed URL
5. Backend returns result URL to tablet for display
6. Tablet shows result + generates QR code pointing to delivery endpoint
```

### 6.4 Error Handling & Retries
- If generation fails or the API times out, auto-retry once before showing an error.
- If face fidelity looks poor (optional: run a quick similarity/quality check), allow one free auto-regeneration.
- Cap retries per visitor (e.g., max 2) to control cost and app flow time.

---

## 7. Delivery Mechanisms

### 7.1 QR Code → WhatsApp / Email
- Backend hosts the final image at a unique, expiring URL (e.g., 30–60 min TTL).
- **WhatsApp option A (simplest):** QR encodes a `wa.me` click-to-chat link pre-filled to your business number; visitor scans, opens WhatsApp, sends a message, and a webhook auto-replies with the image (requires WhatsApp Business API / Cloud API setup).
- **WhatsApp option B:** If not using the Business API yet, QR can simply link to a webpage showing the image with a "Save to WhatsApp/Photos" button — works with zero WhatsApp integration, slightly less seamless.
- **Email option:** QR links to a simple form (or the tablet has an on-screen keyboard) to enter an email; backend sends the image as an attachment.

### 7.2 Print
- Tablet connects to a local receipt/photo printer (USB or network) via a print service running alongside the app.
- On "Print" tap, backend/app sends the final image to the print queue.
- Show a "Printing… please collect your photo" confirmation screen.

---

## 8. Tech Stack (Proposed)

| Layer | Technology |
|---|---|
| Tablet frontend | Standalone web app or native app, fullscreen guided-access mode |
| Camera capture | Browser `getUserMedia` API (web) or native camera API (if native app) |
| Backend | Node.js/Python API service (session mgmt, Gemini proxy, delivery) — own service, not shared with avatar project |
| Image generation | Gemini API — `gemini-3.1-flash-image-preview` |
| Image hosting | Cloud storage (e.g., signed URLs, short TTL) — S3/GCS or equivalent |
| QR generation | Lightweight QR library (server or client-side) |
| WhatsApp delivery | WhatsApp Business Cloud API (Meta) |
| Email delivery | Transactional email service (e.g., SendGrid/SES) |
| Print | Local print service/driver paired with the tablet |

---

## 9. Privacy & Data Handling

- Selfies and generated images are **session-based and short-lived** — auto-delete after a fixed window (e.g., 1–24 hours) unless the visitor actively saves/downloads.
- No visitor accounts or persistent identity storage.
- Clear on-screen consent notice before capture ("Your photo will be used to generate a themed image and can be sent to you via WhatsApp/email or printed. It is not stored permanently.").
- If any images are retained for demo/marketing purposes, get explicit visitor opt-in (separate checkbox/tap).

---

## 10. Cost Estimate

Using `gemini-3.1-flash-image-preview` at ~$0.067 per generated image:

| Monthly visitors | Est. generations (incl. ~25% retries) | Est. monthly cost |
|---|---|---|
| 50 | ~65 | ~$4.35 |
| 500 | ~625 | ~$42 |
| 1,500 | ~1,875 | ~$126 |
| 3,000 | ~3,750 | ~$251 |

**Not included above** (budget separately):
- WhatsApp Business API messaging fees (per-conversation pricing varies by region)
- Email sending service (usually negligible at this volume)
- Printer consumables (paper/ink/ribbon — often the largest recurring cost)
- Cloud hosting/storage (minimal at this scale)
- Tablet + printer hardware
- Optional upgrade to `gemini-3-pro-image-preview` for print-quality (~2x cost, ~$0.134/image)

---

## 11. Build Plan & Milestones

| Phase | Scope | Rough Duration |
|---|---|---|
| **Phase 1 — Core flow prototype** | Camera capture, background selection UI, single Gemini API call, result screen (no delivery yet) | 1–2 weeks |
| **Phase 2 — Prompt tuning** | Test all 4–5 backgrounds with varied selfies; refine prompts/reference images for consistent quality, PPE accuracy, lighting match | 1 week |
| **Phase 3 — Delivery integration** | QR code generation, short-lived image hosting, WhatsApp/email send, print integration | 1–2 weeks |
| **Phase 4 — Tablet hardening** | Guided-access/kiosk-mode lockdown, idle/reset timers, error states, offline/retry handling, session cleanup | 1 week |
| **Phase 5 — On-site pilot** | Deploy to one tablet, gather real visitor feedback, monitor cost/error rates | 1–2 weeks |
| **Phase 6 — Rollout** | Roll out to additional tablets/locations if pilot succeeds | Ongoing |

---

## 12. Open Decisions to Finalize

- [ ] Web app vs. native app for the tablet
- [ ] WhatsApp delivery: Business API (auto-send) vs. simple web-link fallback
- [ ] Whether generated images get a manual/automated safety-compliance check (PPE correctness) before delivery
- [ ] Final list and reference images for the 4–5 background scenes
- [ ] Printer make/model and integration method (USB driver vs. network print service)
- [ ] Data retention window for generated images
- [ ] Whether to start on Flash tier only, or dual-generate (Flash for screen preview, Pro for print) from day one
- [ ] Tablet model/specs and mounting/enclosure if this will be a public-facing standalone unit

---

## 13. Next Steps

1. Finalize the 4–5 background scenes and get reference images approved (NALCO branding/safety compliance).
2. Build Phase 1 prototype and test Gemini output quality against real sample selfies.
3. Decide WhatsApp delivery approach based on whether Business API access is available.
4. Confirm tablet hardware, printer hardware, and integration method.
