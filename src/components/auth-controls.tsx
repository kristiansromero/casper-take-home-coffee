"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

/** Clerk sign-in / user menu. Only rendered when Clerk is enabled (requires ClerkProvider). */
export function AuthControls() {
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button size="sm">Sign in</Button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <UserButton appearance={{ elements: { avatarBox: "size-8" } }} />
      </Show>
    </>
  );
}
