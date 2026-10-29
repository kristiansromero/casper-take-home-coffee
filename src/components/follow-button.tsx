"use client";

import {
  createContext,
  useContext,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, UserPlus } from "lucide-react";
import { toggleFollow } from "@/app/actions/follow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CountCtx = { followers: number; setFollowers: (n: number) => void };
const FollowCountContext = createContext<CountCtx | null>(null);

/** Shares a live follower count between a FollowButton and a <FollowerCount /> elsewhere on the page. */
export function FollowCountProvider({
  initial,
  children,
}: {
  initial: number;
  children: React.ReactNode;
}) {
  const [followers, setFollowers] = useState(initial);
  return (
    <FollowCountContext.Provider value={{ followers, setFollowers }}>
      {children}
    </FollowCountContext.Provider>
  );
}

export function FollowerCount({ fallback }: { fallback: number }) {
  const ctx = useContext(FollowCountContext);
  return <>{ctx?.followers ?? fallback}</>;
}

export function FollowButton({
  targetUserId,
  initialFollowing,
  signedIn,
  size = "sm",
  className,
  onChange,
}: {
  targetUserId: string;
  initialFollowing: boolean;
  signedIn: boolean;
  size?: "sm" | "default";
  className?: string;
  /** Called after the server confirms, with the target's new follower count. */
  onChange?: (state: { following: boolean; followers: number }) => void;
}) {
  const pathname = usePathname();
  const countCtx = useContext(FollowCountContext);
  const [following, setFollowing] = useState(initialFollowing);
  const [optimistic, setOptimistic] = useOptimistic(following);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!signedIn) {
    return (
      <Button asChild size={size} className={className}>
        <Link
          href={`/sign-in?redirect_url=${encodeURIComponent(pathname || "/")}`}
        >
          <UserPlus /> Follow
        </Link>
      </Button>
    );
  }

  const toggle = () => {
    setError(null);
    startTransition(async () => {
      setOptimistic(!following);
      const res = await toggleFollow(targetUserId);
      if (res.ok) {
        setFollowing(res.following);
        countCtx?.setFollowers(res.followers);
        onChange?.({ following: res.following, followers: res.followers });
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        size={size}
        variant={optimistic ? "outline" : "default"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }}
        aria-pressed={optimistic}
        aria-busy={pending}
        className={cn(
          "group/follow min-w-[6.5rem]",
          optimistic && "hover:border-red-400/50 hover:text-red-300",
          className,
        )}
      >
        {optimistic ? (
          <>
            <Check className="group-hover/follow:hidden" />
            <span className="group-hover/follow:hidden">Following</span>
            <span className="hidden group-hover/follow:inline">Unfollow</span>
          </>
        ) : (
          <>
            <UserPlus /> Follow
          </>
        )}
      </Button>
      {error && (
        <span role="alert" className="text-[11px] text-red-300">
          {error}
        </span>
      )}
    </span>
  );
}
