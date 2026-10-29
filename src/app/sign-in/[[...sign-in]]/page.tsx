import { SignIn } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/auth";
import { DemoModeCard } from "@/components/demo-mode-card";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      {clerkEnabled ? <SignIn /> : <DemoModeCard />}
    </div>
  );
}
