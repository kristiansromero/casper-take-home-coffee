"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Flame, Loader2, Plus, Sparkles, Trash2, Droplets, Coffee } from "lucide-react";
import { checkHandle, completeOnboarding, type OnboardingInput } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";

type Focus = "brew" | "roast" | "both";
type Gear = { category: string; name: string; blurb: string };

const STEPS = ["Profile", "Credentials", "Equipment"] as const;
const CATEGORIES = ["grinder", "brewer", "espresso", "roaster", "kettle", "scale"];
const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

const FOCUS_OPTIONS: { value: Focus; label: string; icon: typeof Coffee }[] = [
  { value: "brew", label: "Brew", icon: Droplets },
  { value: "roast", label: "Roast", icon: Flame },
  { value: "both", label: "Both", icon: Coffee },
];

type HandleState = { status: "idle" | "checking" | "ok" | "bad"; message?: string };

export function OnboardingForm({
  initial,
  editing,
  existingEquipmentCount,
}: {
  initial: { name: string; handle: string; credentials: string; bio: string };
  editing: boolean;
  existingEquipmentCount: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [name, setName] = useState(initial.name);
  const [handle, setHandle] = useState(initial.handle);
  const [credentials, setCredentials] = useState(initial.credentials);
  const [bio, setBio] = useState(initial.bio);
  const [focus, setFocus] = useState<Focus>("both");
  const [gear, setGear] = useState<Gear[]>([]);
  const [handleState, setHandleState] = useState<HandleState>({ status: "idle" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Debounced live uniqueness check.
  useEffect(() => {
    const h = handle.trim().toLowerCase();
    if (h === initial.handle) return setHandleState({ status: "ok", message: "That's you." });
    if (!HANDLE_RE.test(h)) return setHandleState({ status: "bad", message: "3–20 characters: a-z, 0-9, _" });
    setHandleState({ status: "checking" });
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await checkHandle(h);
        if (!cancelled)
          setHandleState(res.available ? { status: "ok", message: "Available" } : { status: "bad", message: res.reason });
      } catch {
        if (!cancelled) setHandleState({ status: "idle" });
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [handle, initial.handle]);

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const canAdvanceProfile = name.trim().length > 0 && handleState.status === "ok";

  const updateGear = (i: number, patch: Partial<Gear>) =>
    setGear((g) => g.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));

  const submit = (skipGear = false) => {
    setFormError(null);
    const payload: OnboardingInput = {
      name,
      handle: handle.trim().toLowerCase(),
      credentials,
      bio,
      focus,
      equipment: skipGear
        ? []
        : gear
            .filter((g) => g.name.trim())
            .map((g) => ({ category: g.category as OnboardingInput["equipment"][number]["category"], name: g.name, blurb: g.blurb })),
    };
    startTransition(async () => {
      const res = await completeOnboarding(payload);
      if (res.ok) {
        router.push("/?feed=following");
        router.refresh();
        return;
      }
      setFormError(res.error);
      setErrors(res.fieldErrors ?? {});
      if (res.fieldErrors?.name || res.fieldErrors?.handle) go(0);
      else if (res.fieldErrors?.credentials || res.fieldErrors?.bio) go(1);
    });
  };

  const err = (k: string) => errors[k]?.[0];

  return (
    <div className="glass overflow-hidden rounded-2xl">
      {/* Progress */}
      <div className="border-b border-line px-6 py-4">
        <ol className="flex items-center gap-3">
          {STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors",
                  i < step && "border-teal bg-teal text-obsidian",
                  i === step && "border-teal text-teal-bright",
                  i > step && "border-line text-muted",
                )}
              >
                {i < step ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={cn("hidden text-sm sm:inline", i === step ? "text-sterile" : "text-muted")}>{label}</span>
              {i < STEPS.length - 1 && (
                <span className="relative h-px flex-1 bg-line">
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-teal"
                    initial={false}
                    animate={{ width: i < step ? "100%" : "0%" }}
                    transition={{ duration: 0.3 }}
                  />
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>

      <div className="relative min-h-[22rem] px-6 py-6">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -32 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex flex-col gap-5"
          >
            {step === 0 && (
              <>
                <Field label="Display name" required htmlFor="ob-name" error={err("name")}>
                  <Input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" autoFocus />
                </Field>
                <Field
                  label="Handle"
                  required
                  htmlFor="ob-handle"
                  error={err("handle") ?? (handleState.status === "bad" ? handleState.message : undefined)}
                  hint={handleState.status === "ok" ? handleState.message : "Lowercase letters, numbers and underscores."}
                >
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">@</span>
                    <Input
                      id="ob-handle"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/\s/g, ""))}
                      maxLength={20}
                      className="pl-7 pr-9 font-mono"
                      aria-invalid={handleState.status === "bad" || !!err("handle")}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {handleState.status === "checking" && <Loader2 className="size-4 animate-spin text-muted" />}
                      {handleState.status === "ok" && <Check className="size-4 text-teal" />}
                    </span>
                  </div>
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <Field label="Coffee credentials" htmlFor="ob-cred" error={err("credentials")} hint="e.g. SCA Q Grader, Home roaster since 2019">
                  <Input id="ob-cred" value={credentials} onChange={(e) => setCredentials(e.target.value)} maxLength={120} autoFocus />
                </Field>
                <Field label="Short bio" htmlFor="ob-bio" error={err("bio")} hint={`${bio.length}/280`}>
                  <Textarea id="ob-bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} placeholder="Chasing florals on washed Ethiopians…" />
                </Field>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted">I mainly…</span>
                  <div role="radiogroup" className="grid grid-cols-3 gap-2">
                    {FOCUS_OPTIONS.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={focus === value}
                        onClick={() => setFocus(value)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm transition-colors",
                          focus === value
                            ? "border-teal bg-teal/10 text-teal-bright"
                            : "border-line text-muted hover:border-teal/40 hover:text-sterile",
                        )}
                      >
                        <Icon className="size-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-sm text-muted">
                  {existingEquipmentCount > 0
                    ? `You already have ${existingEquipmentCount} item${existingEquipmentCount === 1 ? "" : "s"} on your shelf. Add more below, or skip.`
                    : "Add the gear you brew or roast with — it shows on your shelf and pre-fills your logs. You can skip this."}
                </p>
                <AnimatePresence initial={false}>
                  {gear.map((g, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-[9rem_1fr_auto]">
                        <Field label="Category" required error={err(`equipment.${i}.category`)}>
                          <Select value={g.category} onChange={(e) => updateGear(i, { category: e.target.value })}>
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c[0].toUpperCase() + c.slice(1)}
                              </option>
                            ))}
                          </Select>
                        </Field>
                        <Field label="Name" required error={err(`equipment.${i}.name`)}>
                          <Input value={g.name} onChange={(e) => updateGear(i, { name: e.target.value })} placeholder="Comandante C40" maxLength={80} />
                        </Field>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="self-end"
                          aria-label="Remove item"
                          onClick={() => setGear((all) => all.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 />
                        </Button>
                        <Field label="Blurb" className="sm:col-span-3" error={err(`equipment.${i}.blurb`)}>
                          <Input value={g.blurb} onChange={(e) => updateGear(i, { blurb: e.target.value })} placeholder="Red Clix, 24 clicks for V60" maxLength={160} />
                        </Field>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {gear.length < 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="self-start"
                    onClick={() =>
                      setGear((all) => [...all, { category: focus === "roast" ? "roaster" : "grinder", name: "", blurb: "" }])
                    }
                  >
                    <Plus /> Add {gear.length ? "another" : "an"} item
                  </Button>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {formError && <p className="px-6 pb-2 text-sm text-amber">{formError}</p>}

      <div className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">
        {step > 0 ? (
          <Button type="button" variant="ghost" onClick={() => go(step - 1)} disabled={pending}>
            <ArrowLeft /> Back
          </Button>
        ) : (
          <span />
        )}
        {step < 2 ? (
          <Button type="button" onClick={() => go(step + 1)} disabled={step === 0 && !canAdvanceProfile}>
            Continue <ArrowRight />
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            {gear.length === 0 && (
              <Button type="button" variant="ghost" onClick={() => submit(true)} disabled={pending}>
                Skip
              </Button>
            )}
            <Button type="button" onClick={() => submit(false)} disabled={pending || !canAdvanceProfile}>
              {pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {editing ? "Save profile" : "Finish setup"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
