"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; pro?: boolean };

/** Primary nav links with active state; a horizontally scrollable row on mobile. */
export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="-mx-4 w-[calc(100%+2rem)] overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:w-auto md:flex-1 md:px-0 [&::-webkit-scrollbar]:hidden">
      <ul className="flex items-center gap-1 whitespace-nowrap">
        {items.map(({ href, label, pro }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                isActive(href) ? "bg-teal/15 text-teal-bright" : "text-muted hover:bg-titanium-2 hover:text-sterile",
              )}
            >
              {label}
              {pro && (
                <span className="rounded-full bg-amber/15 px-1.5 py-px text-[10px] font-semibold tracking-wider text-amber">
                  PRO
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
