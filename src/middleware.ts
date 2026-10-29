import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Logging forms + onboarding need an account. Detail pages (/brew/<id>, /roast/<id>), profiles,
// the feed and /roast-me (which renders its own signed-out state) stay public.
// Patterns are exact: "/brew" does NOT match "/brew/abc".
const isProtectedRoute = createRouteMatcher(["/brew", "/roast", "/onboarding(.*)"]);

export default clerkEnabled
  ? clerkMiddleware(async (auth, req) => {
      // Signed-out page requests are redirected to /sign-in with redirect_url back to the original path.
      if (isProtectedRoute(req)) await auth.protect();
    })
  : () => NextResponse.next();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
