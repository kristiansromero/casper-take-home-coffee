import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { db } from "@/lib/db";
import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Set up your shelf" };

export default async function OnboardingPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in?redirect_url=/onboarding");

  const editing = !!viewer.onboardedAt;
  const equipmentCount = await db.equipment.count({ where: { userId: viewer.id } });

  return (
    <div className="mx-auto w-full max-w-2xl py-4 sm:py-8">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal">{editing ? "Edit profile" : "Welcome to BeanWater"}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-sterile sm:text-4xl">
          {editing ? "Tune your profile" : "Set up your shelf"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {editing
            ? "Update how you show up in the feed, or add gear to your shelf."
            : "Three quick steps and you're logging extractions with the community."}
        </p>
      </header>
      <OnboardingForm
        editing={editing}
        existingEquipmentCount={equipmentCount}
        initial={{
          name: viewer.name,
          handle: viewer.handle,
          credentials: viewer.credentials ?? "",
          bio: viewer.bio ?? "",
        }}
      />
    </div>
  );
}
