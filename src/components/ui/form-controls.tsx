import * as React from "react";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-lg border border-line bg-obsidian/70 px-3 text-sm text-sterile placeholder:text-muted/70 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 aria-[invalid=true]:border-amber";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(field, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(field, "min-h-24 py-2", className)} {...props} />;
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(field, "h-10 appearance-auto", className)} {...props} />;
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("text-xs font-medium uppercase tracking-wider text-muted", className)} {...props} />;
}

/** Label + control + error message. */
export function Field({
  label,
  required,
  error,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="ml-0.5 text-amber">*</span> : <span className="ml-1 normal-case tracking-normal text-muted/60">(optional)</span>}
      </Label>
      {children}
      {error ? <p className="text-xs text-amber">{error}</p> : hint ? <p className="text-xs text-muted/70">{hint}</p> : null}
    </div>
  );
}
