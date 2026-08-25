/**
 * Crop to the upper label region (dish name), then OCR.
 * Ignores lower allergens / barcode area that confuse matching.
 */

const TITLE_CROP_HEIGHT = 0.55;
const SIDE_INSET = 0.06;

async function toImageBitmap(source: string | File | Blob): Promise<ImageBitmap> {
  if (typeof source === "string") {
    const res = await fetch(source);
    return createImageBitmap(await res.blob());
  }
  return createImageBitmap(source);
}

/** Keep top ~55% and slight side inset — where UGA label titles live. */
export async function cropLabelRegion(
  source: string | File | Blob,
): Promise<Blob> {
  const bitmap = await toImageBitmap(source);
  try {
    const insetX = Math.floor(bitmap.width * SIDE_INSET);
    const cropW = Math.max(1, bitmap.width - insetX * 2);
    const cropH = Math.max(1, Math.floor(bitmap.height * TITLE_CROP_HEIGHT));

    const canvas = document.createElement("canvas");
    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");

    ctx.drawImage(bitmap, insetX, 0, cropW, cropH, 0, 0, cropW, cropH);

    // Mild contrast boost helps e-ink / reddish label text
    const imageData = ctx.getImageData(0, 0, cropW, cropH);
    const data = imageData.data;
    const contrast = 1.25;
    const intercept = 128 * (1 - contrast);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, data[i] * contrast + intercept));
      data[i + 1] = Math.min(
        255,
        Math.max(0, data[i + 1] * contrast + intercept),
      );
      data[i + 2] = Math.min(
        255,
        Math.max(0, data[i + 2] * contrast + intercept),
      );
    }
    ctx.putImageData(imageData, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Crop failed"))),
        "image/jpeg",
        0.92,
      );
    });
    return blob;
  } finally {
    bitmap.close();
  }
}

export async function extractTextFromImage(
  imageSource: string | File | Blob,
): Promise<string[]> {
  const cropped = await cropLabelRegion(imageSource);
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(cropped);
    return text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  } finally {
    await worker.terminate();
  }
}
