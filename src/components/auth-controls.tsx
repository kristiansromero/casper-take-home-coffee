"use client";

import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { UserPen } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Log in / Sign up buttons, or the Clerk user menu. Only rendered when Clerk is enabled (requires ClerkProvider). */
export function AuthControls() {
  return (
    <>
      <Show when="signed-out">
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link href="/sign-in">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Sign up</Link>
          </Button>
        </div>
      </Show>
      <Show when="signed-in">
        <UserButton appearance={{ elements: { avatarBox: "size-8" } }}>
          <UserButton.MenuItems>
            <UserButton.Link label="Edit profile" labelIcon={<UserPen className="size-4" />} href="/onboarding" />
          </UserButton.MenuItems>
        </UserButton>
      </Show>
    </>
  );
}
