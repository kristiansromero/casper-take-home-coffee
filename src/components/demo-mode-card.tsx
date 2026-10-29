import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Replaces Clerk's sign-in/up screens when no Clerk keys are configured. */
export function DemoModeCard() {
  return (
    <div className="glass flex max-w-md flex-col items-center gap-4 rounded-2xl px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-amber/30 bg-amber/10 text-amber">
        <FlaskConical className="size-5" />
      </div>
      <div className="space-y-2">
        <h1 className="text-lg font-semibold tracking-tight">You&apos;re in demo mode</h1>
        <p className="text-sm text-muted">
          Clerk keys aren&apos;t configured for this deployment, so there&apos;s nothing to sign in to. Everything you
          log is attributed to the demo reviewer account — go ahead and brew.
        </p>
      </div>
      <Button asChild>
        <Link href="/brew">Log a brew</Link>
      </Button>
    </div>
  );
}
