import Link from "next/link";
import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <div className="flex size-14 items-center justify-center rounded-full border border-line bg-titanium text-teal">
        <Coffee className="size-6" />
      </div>
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">404 · channeling</p>
        <h1 className="text-2xl font-semibold tracking-tight">This cup came out empty</h1>
        <p className="max-w-sm text-sm text-muted">
          The page you&apos;re looking for doesn&apos;t exist, or it was dialed out of the menu.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/">Back to the feed</Link>
      </Button>
    </div>
  );
}
