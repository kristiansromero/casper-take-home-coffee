// Per-component overrides on top of the dark variables set on <ClerkProvider> in layout.tsx.
export const clerkAuthAppearance = {
  elements: {
    rootBox: "w-full max-w-md",
    cardBox: "w-full shadow-2xl shadow-black/40 border border-[#2A3237]",
    card: "bg-[#161B1E]",
    headerTitle: "text-[#E4E7EB]",
    formButtonPrimary: "bg-[#47918F] hover:bg-[#5BB3B0] text-[#0B0E10] shadow-none",
    footerActionLink: "text-[#47918F] hover:text-[#5BB3B0]",
    // The page renders its own sign-in / sign-up cross-link.
    footerAction: "hidden",
  },
};
