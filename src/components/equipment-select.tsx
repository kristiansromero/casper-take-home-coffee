"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { AlertTriangle, Loader2, Plus } from "lucide-react";
import { createEquipment } from "@/app/actions/equipment";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";

export type EquipmentSelectOption = { id: string; name: string; category: string };

const ADD_NEW = "__add_new__";

const CATEGORY_LABELS: Record<string, string> = {
  grinder: "Grinder",
  brewer: "Brewer",
  espresso: "Espresso machine",
  roaster: "Roaster",
  kettle: "Kettle",
  scale: "Scale",
};

export function EquipmentSelect({
  value,
  onChange,
  options,
  categories,
  label = "equipment",
  noneLabel = "None",
  id,
  className,
  "aria-invalid": ariaInvalid,
}: {
  value: string;
  /** Called with the selected id ("" for none). `item` is set when the id maps to a known option. */
  onChange: (value: string, item?: EquipmentSelectOption) => void;
  options: EquipmentSelectOption[];
  /** Categories allowed for this slot; the first is the default for new items. */
  categories: string[];
  label?: string;
  noneLabel?: string;
  id?: string;
  className?: string;
  "aria-invalid"?: boolean;
}) {
  const uid = useId();
  const selectId = id ?? `${uid}-select`;
  const [items, setItems] = useState(options);
  const [adding, setAdding] = useState(false);
  const [category, setCategory] = useState(categories[0] ?? "");
  const [name, setName] = useState("");
  const [blurb, setBlurb] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  // Keep in sync if the server re-renders with a fresh list (e.g. after revalidation).
  useEffect(() => {
    setItems((prev) => {
      const ids = new Set(options.map((o) => o.id));
      return [...options, ...prev.filter((p) => !ids.has(p.id))];
    });
  }, [options]);

  useEffect(() => {
    if (adding) nameRef.current?.focus();
  }, [adding]);

  const close = () => {
    setAdding(false);
    setName("");
    setBlurb("");
    setError(null);
    setCategory(categories[0] ?? "");
    requestAnimationFrame(() => selectRef.current?.focus());
  };

  const save = () => {
    if (!name.trim()) {
      setError("Name is required");
      nameRef.current?.focus();
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await createEquipment({ category, name: name.trim(), blurb: blurb.trim() || undefined });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setItems((prev) => [...prev, res.item]);
      onChange(res.item.id, res.item);
      close();
    });
  };

  const formId = `${uid}-add`;
  const errorId = `${uid}-error`;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Select
        ref={selectRef}
        id={selectId}
        value={adding ? ADD_NEW : value}
        aria-invalid={ariaInvalid}
        aria-expanded={adding}
        aria-controls={adding ? formId : undefined}
        onChange={(e) => {
          const next = e.target.value;
          if (next === ADD_NEW) {
            setAdding(true);
            return;
          }
          setAdding(false);
          onChange(next, items.find((i) => i.id === next));
        }}
      >
        <option value="">{noneLabel}</option>
        {items.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
        <option value={ADD_NEW}>+ Add new equipment…</option>
      </Select>

      {adding && (
        <div
          id={formId}
          role="group"
          aria-label={`Add new ${label}`}
          className="flex flex-col gap-3 rounded-xl border border-teal/30 bg-titanium/60 p-3"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              close();
            } else if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
              // Don't submit the outer form.
              e.preventDefault();
              save();
            }
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {categories.length > 1 && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${uid}-category`}>Category</Label>
                <Select id={`${uid}-category`} value={category} onChange={(e) => setCategory(e.target.value)} disabled={pending}>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c] ?? c}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div className={cn("flex flex-col gap-1.5", categories.length <= 1 && "sm:col-span-2")}>
              <Label htmlFor={`${uid}-name`}>
                Name<span className="ml-0.5 text-amber">*</span>
              </Label>
              <Input
                ref={nameRef}
                id={`${uid}-name`}
                value={name}
                maxLength={80}
                placeholder={CATEGORY_LABELS[category] ? `e.g. my ${CATEGORY_LABELS[category].toLowerCase()}` : "Name"}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                disabled={pending}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor={`${uid}-blurb`}>
                Notes<span className="ml-1 normal-case tracking-normal text-muted/60">(optional)</span>
              </Label>
              <Input
                id={`${uid}-blurb`}
                value={blurb}
                maxLength={280}
                placeholder="Burr set, mods, settings…"
                disabled={pending}
                onChange={(e) => setBlurb(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p id={errorId} role="alert" className="flex items-center gap-1.5 text-xs text-amber">
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={save} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
