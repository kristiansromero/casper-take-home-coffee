import { SignUp } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/auth";
import { DemoModeCard } from "@/components/demo-mode-card";

export const metadata = { title: "Sign up" };

export default function SignUpPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      {clerkEnabled ? <SignUp /> : <DemoModeCard />}
    </div>
  );
}
