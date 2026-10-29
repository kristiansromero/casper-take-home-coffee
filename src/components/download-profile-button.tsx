"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadRoastProfile, type ExportableRoast } from "@/lib/export-profile";

export function DownloadProfileButton({ roast, className }: { roast: ExportableRoast; className?: string }) {
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      await downloadRoastProfile(roast);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" onClick={onClick} disabled={busy} className={className}>
      {busy ? <Loader2 className="animate-spin" /> : <Download />}
      Download profile (.zip)
    </Button>
  );
}
