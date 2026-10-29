"use client";

import * as React from "react";
import { Tooltip as T } from "radix-ui";
import { cn } from "@/lib/utils";

/** Simple hover tooltip: <Tooltip content="...">trigger</Tooltip> */
export function Tooltip({
  content,
  children,
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <T.Provider delayDuration={150}>
      <T.Root>
        <T.Trigger asChild>{children}</T.Trigger>
        <T.Portal>
          <T.Content
            sideOffset={6}
            className={cn(
              "z-50 max-w-xs rounded-lg border border-line bg-titanium px-3 py-2 text-xs text-sterile shadow-xl",
              className,
            )}
          >
            {content}
            <T.Arrow className="fill-titanium" />
          </T.Content>
        </T.Portal>
      </T.Root>
    </T.Provider>
  );
}
