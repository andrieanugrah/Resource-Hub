"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QRScannerModal } from "@/components/qr-scanner-modal";
import { QrCode } from "lucide-react";

export function AssetScannerTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <QrCode className="h-4 w-4 text-primary" />
        Scan QR
      </Button>

      <QRScannerModal open={open} onOpenChange={setOpen} />
    </>
  );
}
