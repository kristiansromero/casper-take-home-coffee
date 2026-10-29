import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/auth";
import { DemoModeCard } from "@/components/demo-mode-card";
import { AuthBrandPanel } from "@/components/welcome-hero";
import { clerkAuthAppearance } from "@/app/sign-in/appearance";

export const metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <div className="mx-auto grid w-full max-w-5xl items-stretch gap-6 md:grid-cols-2 md:py-6">
      <AuthBrandPanel heading="Join the brew log." sub="Free forever for logging. Takes under a minute." />
      <div className="flex flex-col items-center justify-center gap-4">
        {clerkEnabled ? (
          <>
            <SignUp
              path="/sign-up"
              routing="path"
              signInUrl="/sign-in"
              forceRedirectUrl="/onboarding"
              appearance={clerkAuthAppearance}
            />
            <p className="text-sm text-muted">
              Already brewing?{" "}
              <Link href="/sign-in" className="font-medium text-teal hover:text-teal-bright">
                Log in
              </Link>
            </p>
          </>
        ) : (
          <DemoModeCard />
        )}
      </div>
    </div>
  );
}
