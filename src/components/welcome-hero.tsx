import Link from "next/link";
import { ArrowDown, Droplet, Flame, MessageCircle, Sparkles, Tags, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const VALUE_PROPS = [
  {
    icon: Droplet,
    title: "Log every extraction",
    body: "Dose, yield, grind, time and TDS — dial in faster with a history of what actually worked.",
  },
  {
    icon: Tags,
    title: "Taste in SCA flavors",
    body: "Tag cups from the SCA flavor wheel so your notes mean the same thing to everyone.",
  },
  {
    icon: Users,
    title: "Follow coffee people",
    body: "See what roasters, baristas and home brewers you trust are dialing in today.",
  },
];

/** Signed-out landing pitch for the home page. */
export function WelcomeHero() {
  return (
    <section className="glass relative overflow-hidden rounded-3xl px-6 py-10 sm:px-10 sm:py-14">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-teal/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-16 size-72 rounded-full bg-amber/10 blur-3xl" />

      <div className="relative max-w-2xl">
        <p className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-teal-bright">
          <Sparkles className="size-3" /> Strava for coffee
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-sterile sm:text-5xl">
          Every cup is a <span className="text-teal">data point.</span>
        </h1>
        <p className="mt-4 text-base text-muted sm:text-lg">
          BeanWater is where specialty coffee people log brews and roasts, chart extraction curves, and learn from each
          other&apos;s recipes.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href="/sign-up">Create your account</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/sign-in">Log in</Link>
          </Button>
        </div>
      </div>

      <ul className="relative mt-10 grid gap-4 sm:grid-cols-3">
        {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="rounded-2xl border border-line bg-obsidian/40 p-5">
            <span className="grid size-10 place-items-center rounded-lg bg-teal/15 text-teal">
              <Icon className="size-5" aria-hidden />
            </span>
            <h2 className="mt-4 font-medium text-sterile">{title}</h2>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </li>
        ))}
      </ul>

      <p className="relative mt-8 flex items-center gap-2 text-sm text-muted">
        <ArrowDown className="size-4 text-teal" aria-hidden /> Browse the community feed below — no account needed.
      </p>
    </section>
  );
}

const AUTH_FEATURES = [
  { icon: Droplet, text: "Log extractions — dose, yield, grind, time, TDS" },
  { icon: Tags, text: "Tag cups with SCA flavor-wheel notes" },
  { icon: Flame, text: "Share roast curves with milestones" },
  { icon: MessageCircle, text: "Ask Benny to roast your recipe" },
];

/** Brand panel for the sign-in / sign-up split layout. */
export function AuthBrandPanel({ heading, sub }: { heading: string; sub: string }) {
  return (
    <div className="relative flex flex-col justify-center overflow-hidden rounded-3xl border border-line bg-titanium/60 p-8 sm:p-10">
      <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 size-64 rounded-full bg-teal/15 blur-3xl" />
      <div className="relative">
        <span className="flex size-11 items-center justify-center rounded-xl border border-teal/30 bg-teal/10">
          <Droplet className="size-5 fill-teal/30 text-teal" />
        </span>
        <p className="mt-6 text-lg font-semibold tracking-tight text-sterile">
          Bean<span className="text-teal">Water</span>
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-sterile">{heading}</h1>
        <p className="mt-2 text-sm text-muted">{sub}</p>
        <ul className="mt-8 flex flex-col gap-4">
          {AUTH_FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-sterile/90">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-teal/15 text-teal">
                <Icon className="size-4" aria-hidden />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
