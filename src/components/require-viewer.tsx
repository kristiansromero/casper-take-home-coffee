import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shown in place of a form when nobody is signed in. */
export function SignInPrompt({ action }: { action: string }) {
  return (
    <div className="glass mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-teal/30 bg-teal/10 text-teal">
        <LogIn className="size-5" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-sterile">Sign in to {action}</h2>
        <p className="text-sm text-muted">Your logs live on your shelf and show up in the community feed.</p>
      </div>
      <Button asChild>
        <Link href="/sign-in">Sign in</Link>
      </Button>
    </div>
  );
}
