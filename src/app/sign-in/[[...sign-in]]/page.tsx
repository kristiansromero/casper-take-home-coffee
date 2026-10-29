import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/auth";
import { DemoModeCard } from "@/components/demo-mode-card";
import { AuthBrandPanel } from "@/components/welcome-hero";
import { clerkAuthAppearance } from "@/app/sign-in/appearance";

export const metadata = { title: "Log in" };

export default function SignInPage() {
  return (
    <div className="mx-auto grid w-full max-w-5xl items-stretch gap-6 md:grid-cols-2 md:py-6">
      <AuthBrandPanel heading="Welcome back." sub="Pick up where your last extraction left off." />
      <div className="flex flex-col items-center justify-center gap-4">
        {clerkEnabled ? (
          <>
            <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" appearance={clerkAuthAppearance} />
            <p className="text-sm text-muted">
              New here?{" "}
              <Link href="/sign-up" className="font-medium text-teal hover:text-teal-bright">
                Create an account
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
