"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import jsQR from "jsqr";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scan, Camera, CameraOff, AlertTriangle, ArrowLeft, Search } from "lucide-react";

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number | null>(null);

  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [manual, setManual] = useState("");
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    setSupported(hasMedia);
  }, []);

  const stopCamera = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const navigateToAsset = useCallback((qr: string) => {
    setError("");
    fetch(`/api/assets?all=true`)
      .then((r) => r.json())
      .then((d) => {
        const all = d.data ?? [];
        const match = all.find(
          (a: { id: string; qr_code_value: string | null; asset_code: string }) =>
            a.id === qr || a.qr_code_value === qr || a.asset_code === qr
        );
        if (match) router.push(`/assets/${match.id}`);
        else router.push(`/assets?search=${encodeURIComponent(qr)}`);
      })
      .catch(() => setError("Failed to look up asset"));
  }, [router]);

  const startCamera = async () => {
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API not supported");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      requestScan();
    } catch {
      setError("Camera access denied or unavailable. Please allow camera permissions or use manual entry below.");
      stopCamera();
    }
  };

  const requestScan = () => {
    if (!videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          const val = code.data.trim();
          stopCamera();
          navigateToAsset(val);
          return;
        }
      }
    }
    animRef.current = requestAnimationFrame(requestScan);
  };

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manual.trim()) return;
    navigateToAsset(manual.trim());
  }

  return (
    <div>
      <PageHeader title="Scan QR / Barcode" description="Camera scan to quickly find an asset" />
      <Link href="/assets" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Assets
      </Link>

      {!supported && (
        <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)] mb-4">
          <CardContent className="p-4 flex items-center gap-3 text-sm text-amber-600">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>Browser tidak mendukung akses kamera. Gunakan input manual di bawah.</span>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)] mb-6">
        <CardContent className="p-5 space-y-4">
          <div className="relative aspect-video w-full max-w-md mx-auto rounded-xl overflow-hidden bg-black/90 flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />

            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 gap-2">
                {supported ? <Camera className="h-10 w-10" /> : <CameraOff className="h-10 w-10" />}
                <span className="text-sm">{supported ? "Camera is off" : "Camera not supported"}</span>
              </div>
            )}
            {scanning && (
              <div className="absolute inset-x-8 top-1/2 h-0.5 bg-emerald-400 shadow-[0_0_12px] shadow-emerald-400/50 animate-pulse" />
            )}
          </div>
          <div className="flex justify-center gap-2">
            {!scanning ? (
              <Button onClick={startCamera} disabled={!supported} className="gap-2">
                <Camera className="h-4 w-4" /> Start Camera
              </Button>
            ) : (
              <Button variant="destructive" onClick={stopCamera} className="gap-2">
                <CameraOff className="h-4 w-4" /> Stop Camera
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Scan className="h-4 w-4" /> Manual Entry
          </h3>
          <form onSubmit={submitManual} className="flex gap-2">
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Asset code, QR value, or asset ID"
              className="flex-1 h-9 rounded-xl border bg-card px-3 text-sm"
            />
            <Button type="submit" size="sm" className="gap-1">
              <Search className="h-3.5 w-3.5" /> Lookup
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground/60">Ketik kode aset jika kamera tidak dapat membaca QR fisik.</p>
        </CardContent>
      </Card>
    </div>
  );
}