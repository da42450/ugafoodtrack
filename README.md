# UGA Plate

Mobile-first web app for tracking nutrition at UGA dining halls.

1. Pick a dining hall  
2. Load today’s Nutrislice menu  
3. Scan a food label (OCR) or search  
4. Confirm the match and set servings in 0.5 steps  
5. See running plate calories and macros  

## Stack

- Next.js (App Router) + TypeScript + Tailwind  
- Fuse.js fuzzy matching  
- Gemini vision for label reads (recommended) + Tesseract fallback  
- UGA red / white / black UI  

## Label scanning (important)

UGA digital shelf labels (e-ink) often defeat on-device Tesseract. For reliable scans, add a free Gemini API key:

1. Create a key at [Google AI Studio](https://aistudio.google.com/apikey)
2. Local: copy `.env.example` → `.env.local` and set `GEMINI_API_KEY=...`
3. Vercel: Project → Settings → Environment Variables → add `GEMINI_API_KEY` → Redeploy

Without the key, the app still tries improved local OCR and menu matching, then falls back to Search.

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Camera needs HTTPS or localhost.

## Deploy (Vercel)

```bash
npx vercel
```

Share the production URL with friends—no app store install.
