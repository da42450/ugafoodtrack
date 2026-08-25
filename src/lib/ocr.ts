export async function extractTextFromImage(imageSource: string | File | Blob): Promise<string[]> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(imageSource);
    return text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  } finally {
    await worker.terminate();
  }
}
