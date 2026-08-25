import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PROMPT = `You are reading a University of Georgia dining hall digital food label photo.
Return ONLY the dish/food name as printed in the large title text.
Rules:
- Ignore icons, allergens, barcodes, calories, nutrition, and any UI chrome.
- Keep the full dish name, including second lines like "with Sesame Seeds".
- Do not add quotes, labels, or explanation.
- If you cannot read a dish name, return exactly: UNKNOWN`;

const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-3.6-flash",
  "gemini-2.5-flash",
  "gemini-flash-latest",
].filter((m): m is string => Boolean(m));

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "no_key" }, { status: 503 });
  }

  try {
    const form = await request.formData();
    const image = form.get("image");
    if (!image || typeof image === "string") {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const mimeType = image.type || "image/jpeg";
    if (!mimeType.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid image" }, { status: 400 });
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    if (buffer.byteLength > 6_000_000) {
      return NextResponse.json({ error: "Image too large" }, { status: 413 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const inlineData = {
      mimeType,
      data: buffer.toString("base64"),
    };

    let lastError = "Vision request failed";
    for (const modelName of MODEL_CANDIDATES) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          { text: PROMPT },
          { inlineData },
        ]);

        let name = result.response.text().trim().replace(/^["']|["']$/g, "");
        if (!name || /^unknown$/i.test(name)) {
          return NextResponse.json({ name: "", model: modelName });
        }
        name = name
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .join(" ")
          .trim();
        return NextResponse.json({ name, model: modelName });
      } catch (error) {
        lastError =
          error instanceof Error ? error.message : "Vision request failed";
        // Try next model if this one is missing/deprecated
        if (!/404|not found|no longer available/i.test(lastError)) {
          break;
        }
      }
    }

    return NextResponse.json({ error: lastError }, { status: 502 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Vision request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
