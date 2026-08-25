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
- Tesseract.js OCR (lazy-loaded on the camera page)  
- UGA red / white / black UI  

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
