"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, AlertCircle, Search } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QRScannerModal({ open, onOpenChange }: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");

  const handleScannedValue = useCallback(
    (val: string) => {
      if (!val) return;
      onOpenChange(false);

      let target = val.trim();
      if (target.includes("/assets/")) {
        const parts = target.split("/assets/");
        target = parts[1] ?? target;
      }

      router.push(`/assets?search=${encodeURIComponent(target)}`);
    },
    [onOpenChange, router]
  );

  const stopCamera = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function startCamera() {
      if (!open) return;
      setCameraError(null);

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera API is not supported in this browser environment.");
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (!active) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }

        const scanFrame = () => {
          if (!active) return;
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current || document.createElement("canvas");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              });
              if (code && code.data) {
                handleScannedValue(code.data);
                return;
              }
            }
          }
          animRef.current = requestAnimationFrame(scanFrame);
        };

        animRef.current = requestAnimationFrame(scanFrame);
      } catch (err: unknown) {
        if (active) {
          setCameraError(err instanceof Error ? err.message : "Unable to access camera.");
        }
      }
    }

    startCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, [open, handleScannedValue, stopCamera]);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScannedValue(manualCode);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <QrCode className="h-5 w-5 text-primary" />
            Scan Asset QR Code / Barcode
          </DialogTitle>
          <DialogDescription className="text-xs">
            Point your camera at a physical asset QR code or enter the code manually below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Camera Viewport */}
          <div className="relative h-60 w-full overflow-hidden rounded-xl border bg-black flex items-center justify-center">
            {cameraError ? (
              <div className="p-4 text-center space-y-2">
                <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
                <p className="text-xs font-medium text-white">{cameraError}</p>
                <p className="text-[10px] text-gray-400">Use manual code search below instead.</p>
              </div>
            ) : (
              <>
                <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />

                {/* Viewport Overlay */}
                <div className="absolute inset-0 border-2 border-primary/40 pointer-events-none flex items-center justify-center">
                  <div className="h-40 w-40 rounded-lg border-2 border-dashed border-primary animate-pulse flex items-center justify-center">
                    <span className="text-[10px] font-mono text-white/80 bg-black/60 px-2 py-1 rounded">Scanning...</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Enter asset code or serial (e.g. AST-001)"
              className="text-xs"
            />
            <Button type="submit" size="sm" className="gap-1.5 shrink-0">
              <Search className="h-3.5 w-3.5" /> Lookup
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
