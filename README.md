# CREST — Real-time Cultural Moment → Campaign Engine

**Project NEXT** · Techtonic Season 8 · Team **ChainSurfers** (SJMSOM, IIT Bombay)

A functional prototype of CREST: the orchestration engine that turns a live cultural
signal into a localized, brand-safe, human-approved campaign in seconds. Built for the
Rexona "catch the viral moment" use case.

The pipeline chains six agents — PULSE (signal), COMPASS (relevance & angle),
FORGE (creative), ATLAS (transcreation), SENTRY (brand-safety) — behind a human
approval gate, all grounded in a queryable brand constitution.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Deploy to a public URL (Vercel)

1. Push this folder to a new **GitHub** repository.
2. Go to **vercel.com** → sign in with GitHub → **Add New → Project** → import the repo.
3. Vercel auto-detects Vite (Build: `vite build`, Output: `dist`). Click **Deploy**.
4. You get a permanent `https://<name>.vercel.app` link in ~2 minutes.

## Live AI vs Demo-safe

The top-right toggle switches between **Live AI** (real Claude calls for COMPASS,
FORGE, ATLAS) and **Demo-safe** (seeded output). The public build defaults to
**Demo-safe** so the link works flawlessly anywhere. Live AI runs inside the
platform build, where the model is available to the app.
