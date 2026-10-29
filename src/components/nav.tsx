import Link from "next/link";
import { Droplet } from "lucide-react";
import { clerkEnabled, getViewer } from "@/lib/auth";
import { AuthControls } from "@/components/auth-controls";
import { NavLinks, type NavItem } from "@/components/nav-links";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";

export async function Nav() {
  // The nav must never take the page down (e.g. DB unreachable): degrade to no shelf link.
  const viewer = await getViewer().catch(() => null);

  const items: NavItem[] = [
    { href: "/", label: "Feed" },
    { href: "/brew", label: "Log Brew" },
    { href: "/roast", label: "Log Roast" },
    { href: "/roast-me", label: "Roast Me", pro: true },
    ...(viewer ? [{ href: `/profile/${viewer.id}`, label: "My Shelf" }] : []),
  ];

  return (
    <header className="glass sticky top-0 z-40 border-x-0 border-t-0">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 md:flex-nowrap">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-sterile">
          <span className="flex size-8 items-center justify-center rounded-lg border border-teal/30 bg-teal/10">
            <Droplet className="size-4 fill-teal/30 text-teal" />
          </span>
          <span className="text-lg">
            Bean<span className="text-teal">Water</span>
          </span>
        </Link>

        <div className="ml-auto flex items-center md:order-last">
          {clerkEnabled ? (
            <AuthControls />
          ) : (
            <Tooltip content="Clerk keys not configured — acting as demo reviewer">
              <Badge tabIndex={0} className="cursor-default text-muted">
                Demo mode
              </Badge>
            </Tooltip>
          )}
        </div>

        <NavLinks items={items} />
      </div>
    </header>
  );
}
