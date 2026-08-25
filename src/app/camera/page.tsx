"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, ImagePlus, Loader2 } from "lucide-react";
import { PressButton } from "@/components/PressButton";
import { ScreenEnter } from "@/components/ScreenEnter";
import { matchFoods, resolveOcrAgainstMenu } from "@/lib/fuzzy";
import { usePlate } from "@/state/plate";

export default function CameraPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { hydrated, hallSlug, foods } = usePlate();
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (hydrated && !hallSlug) router.replace("/hall");
  }, [hydrated, hallSlug, router]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "Live camera isn’t available here. Use the photo button instead.",
        );
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch {
        setCameraError(
          "Camera permission blocked. Use Take photo instead (works great on iPhone).",
        );
      }
    }

    void start();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [stopCamera]);

  const goWithQuery = useCallback(
    (query: string) => {
      const matches = matchFoods(foods, query, 5);
      if (matches.length === 0 || (matches[0]?.score ?? 1) > 0.5) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
        return;
      }
      if (matches.length === 1) {
        router.push(`/match?foodId=${encodeURIComponent(matches[0].food.id)}`);
        return;
      }
      const ids = matches.map((m) => m.food.id).join(",");
      router.push(
        `/camera/results?q=${encodeURIComponent(query)}&ids=${encodeURIComponent(ids)}`,
      );
    },
    [foods, router],
  );

  const processImage = useCallback(
    async (source: string | Blob) => {
      setBusy(true);
      setCameraError(null);
      try {
        const blob =
          typeof source === "string"
            ? await fetch(source).then((r) => r.blob())
            : source;

        const { extractDishNameViaApi, extractTextFromImage } = await import(
          "@/lib/ocr"
        );

        // 1) Vision AI when GEMINI_API_KEY is configured (best for e-ink labels)
        setStatus("Reading label…");
        try {
          const visionName = await extractDishNameViaApi(blob);
          if (visionName) {
            goWithQuery(visionName);
            return;
          }
        } catch {
          // fall through to on-device OCR
        }

        // 2) Local OCR + pick the guess that best matches today's menu
        setStatus("Trying on-device OCR…");
        const lines = await extractTextFromImage(blob);
        const resolved = resolveOcrAgainstMenu(lines, foods);
        if (resolved) {
          const { query, matches } = resolved;
          if (matches.length === 1) {
            router.push(
              `/match?foodId=${encodeURIComponent(matches[0].food.id)}`,
            );
            return;
          }
          const ids = matches.map((m) => m.food.id).join(",");
          router.push(
            `/camera/results?q=${encodeURIComponent(query)}&ids=${encodeURIComponent(ids)}`,
          );
          return;
        }

        router.push("/search");
      } catch {
        setStatus("");
        setBusy(false);
        setCameraError("Couldn’t read that photo. Try again or search.");
      }
    },
    [foods, goWithQuery, router],
  );

  const captureFromVideo = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85),
    );
    if (!blob) return;
    stopCamera();
    await processImage(blob);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    stopCamera();
    await processImage(file);
  };

  return (
    <main className="flex min-h-full flex-1 flex-col bg-black text-white">
      <header className="flex items-center gap-2 px-4 py-4">
        <Link
          href="/plate"
          aria-label="Back to plate"
          className="flex h-11 w-11 items-center justify-center text-white transition-transform active:scale-[0.97] touch-manipulation"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-2xl">
          Scan label
        </h1>
      </header>

      <ScreenEnter className="flex flex-1 flex-col px-4 pb-6">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-900">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`h-full w-full object-cover ${cameraReady && !busy ? "opacity-100" : "opacity-0"}`}
          />
          {!cameraReady && !busy ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/70">
              {cameraError ?? "Starting camera…"}
            </div>
          ) : null}
          {busy ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--uga-red)]" />
              <p className="text-sm">{status || "Working…"}</p>
            </div>
          ) : null}
          <div className="pointer-events-none absolute inset-x-8 inset-y-16 border-2 border-white/40" />
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />

        <div className="mt-5 flex flex-col gap-2">
          {cameraReady && !busy ? (
            <PressButton
              className="w-full rounded-xl"
              onClick={() => void captureFromVideo()}
            >
              <Camera className="h-5 w-5" />
              Capture
            </PressButton>
          ) : null}
          <PressButton
            variant="secondary"
            className="w-full rounded-xl border-white text-black"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="h-5 w-5" />
            Take photo
          </PressButton>
          <PressButton
            variant="ghost"
            className="w-full rounded-xl border-white/30 text-white"
            disabled={busy}
            onClick={() => router.push("/search")}
          >
            Search instead
          </PressButton>
        </div>

        {cameraError && cameraReady === false ? (
          <p className="mt-4 text-center text-xs text-white/60">{cameraError}</p>
        ) : null}
      </ScreenEnter>
    </main>
  );
}
