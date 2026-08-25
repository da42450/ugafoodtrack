import { createWorker } from "tesseract.js";

/**
 * Crop + preprocess UGA e-ink labels, then OCR with multiple Tesseract modes.
 */

const TITLE_CROP_HEIGHT = 0.58;
const SIDE_INSET = 0.05;

async function toImageBitmap(source: string | File | Blob): Promise<ImageBitmap> {
  if (typeof source === "string") {
    const res = await fetch(source);
    return createImageBitmap(await res.blob());
  }
  return createImageBitmap(source);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Crop failed"))),
      "image/jpeg",
      0.95,
    );
  });
}

function applyGrayscaleContrast(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    let y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    y = (y - 128) * 1.45 + 128;
    y = Math.min(255, Math.max(0, y));
    if (y < 140) y = Math.max(0, y * 0.75);
    else y = Math.min(255, 220 + (y - 140) * 0.2);
    data[i] = data[i + 1] = data[i + 2] = y;
  }
  ctx.putImageData(imageData, 0, 0);
}

/** Top-of-label crop, grayscale, contrast, 2× upscale for Tesseract. */
export async function cropLabelRegion(
  source: string | File | Blob,
): Promise<Blob> {
  const bitmap = await toImageBitmap(source);
  try {
    const insetX = Math.floor(bitmap.width * SIDE_INSET);
    const cropW = Math.max(1, bitmap.width - insetX * 2);
    const cropH = Math.max(1, Math.floor(bitmap.height * TITLE_CROP_HEIGHT));
    const scale = 2;

    const canvas = document.createElement("canvas");
    canvas.width = cropW * scale;
    canvas.height = cropH * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(
      bitmap,
      insetX,
      0,
      cropW,
      cropH,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    applyGrayscaleContrast(ctx, canvas.width, canvas.height);
    return canvasToBlob(canvas);
  } finally {
    bitmap.close();
  }
}

export async function extractTextFromImage(
  imageSource: string | File | Blob,
): Promise<string[]> {
  const cropped = await cropLabelRegion(imageSource);
  const worker = await createWorker("eng");
  try {
    const run = async (psm: string) => {
      await worker.setParameters({
        tessedit_pageseg_mode: psm,
        tessedit_char_whitelist:
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 &'/-",
      } as Parameters<typeof worker.setParameters>[0]);
      const {
        data: { text },
      } = await worker.recognize(cropped);
      return text
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
    };

    // Sequential — one worker cannot run parallel recognizes safely
    const first = await run("6");
    const second = await run("4");

    const seen = new Set<string>();
    const merged: string[] = [];
    for (const line of [...first, ...second]) {
      const key = line.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(line);
    }
    return merged;
  } finally {
    await worker.terminate();
  }
}

export type VisionReadResult =
  | { ok: true; name: string }
  | { ok: false; reason: "no_key" | "empty" | "error"; message?: string };

/** Send label photo to server vision (Gemini) when configured. */
export async function extractDishNameViaApi(
  imageSource: Blob | File,
): Promise<VisionReadResult> {
  const body = new FormData();
  const file =
    imageSource instanceof File
      ? imageSource
      : new File([imageSource], "label.jpg", {
          type: imageSource.type || "image/jpeg",
        });
  body.append("image", file);

  const res = await fetch("/api/read-label", { method: "POST", body });
  if (res.status === 503) return { ok: false, reason: "no_key" };

  const data = (await res.json().catch(() => ({}))) as {
    name?: string;
    error?: string;
  };

  if (!res.ok) {
    return {
      ok: false,
      reason: "error",
      message: data.error || "Vision read failed",
    };
  }

  const name = data.name?.trim() ?? "";
  if (!name) return { ok: false, reason: "empty" };
  return { ok: true, name };
}
