import type { Metadata } from "next";
import { SignInPrompt } from "@/components/require-viewer";
import { getOnboardedViewer } from "@/lib/auth";
import { db } from "@/lib/db";
import { RoastForm } from "./roast-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Record Roast · BeanWater" };

export default async function RoastPage() {
  const viewer = await getOnboardedViewer();
  if (!viewer) return <SignInPrompt action="log a roast" />;

  const roasters = await db.equipment.findMany({
    where: { userId: viewer.id, category: "roaster" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <header className="mb-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber">Roast log</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-sterile">Record Roast</h1>
        <p className="mt-1 text-sm text-muted">Log milestones and we&apos;ll plot a simulated profile you can share and export.</p>
      </header>
      <RoastForm roasters={roasters} />
    </div>
  );
}
