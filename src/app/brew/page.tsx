import type { Metadata } from "next";
import { SignInPrompt } from "@/components/require-viewer";
import { getViewer } from "@/lib/auth";
import { db } from "@/lib/db";
import { BrewForm } from "./brew-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Record Extraction" };

export default async function BrewPage() {
  const viewer = await getViewer();
  if (!viewer) return <SignInPrompt action="log a brew" />;

  const equipment = await db.equipment.findMany({
    where: { userId: viewer.id, category: { in: ["brewer", "espresso", "grinder"] } },
    select: { id: true, name: true, category: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal">Brew log</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-sterile sm:text-4xl">Record Extraction</h1>
        <p className="mt-2 text-sm text-muted">
          Fields marked <span className="text-amber">*</span> are required.
        </p>
      </header>
      <BrewForm
        brewers={equipment.filter((e) => e.category !== "grinder")}
        grinders={equipment.filter((e) => e.category === "grinder")}
      />
    </div>
  );
}
