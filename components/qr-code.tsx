"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Printer } from "lucide-react";

interface QRCodeProps {
  value: string;
  size?: number;
  label?: string;
}

export function QRCodeDisplay({ value, size = 140, label }: QRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    import("qrcode").then((QRCode) => {
      if (cancelled) return;
      QRCode.toDataURL(value, {
        width: size,
        margin: 2,
        color: { dark: "#1a1a2e", light: "#ffffff" },
      }).then((url) => {
        if (!cancelled) setQrDataUrl(url);
      });
    });
    return () => { cancelled = true; };
  }, [value, size]);

  function handlePrint() {
    if (!qrDataUrl) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(`
      <html><head><title>QR - ${value}</title>
      <style>body{display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;font-family:sans-serif}
      img{max-width:300px} p{margin-top:16px;font-size:14px;color:#666}</style>
      </head><body>
      <img src="${qrDataUrl}" alt="QR" />
      <p>${value}</p>
      </body></html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 250);
  }

  if (!qrDataUrl) {
    return (
      <div className="flex items-center justify-center rounded-2xl border-2 border-dashed" style={{ width: size + 20, height: size + 20 }}>
        <span className="text-xs font-medium text-muted-foreground animate-pulse">Generating...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Image
        src={qrDataUrl}
        alt={`QR Code for ${value}`}
        width={size}
        height={size}
        unoptimized
        className="rounded-xl border bg-white"
      />
      {label && <p className="text-xs font-mono text-muted-foreground break-all text-center max-w-full">{label}</p>}
      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
      >
        <Printer className="h-3.5 w-3.5" />
        Print QR
      </button>
    </div>
  );
}

