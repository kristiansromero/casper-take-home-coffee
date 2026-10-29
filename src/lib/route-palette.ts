// Per-route color palettes for the ambient Gradient Waves background.
// Each palette is [base, mid, accent]; kept dark/desaturated so content stays legible.

export type RoutePalette = readonly [base: string, mid: string, accent: string];

export const PALETTES = {
  feed: ["#0E1113", "#1f4a49", "#47918F"], // obsidian + teal
  brew: ["#0f1a1a", "#3a7f7c", "#b0703f"], // teal + warm copper
  roast: ["#1a0f0c", "#5a2a1c", "#E27D60"], // deep red-brown + ember amber
  roastMe: ["#120f18", "#4e3f6b", "#E27D60"], // muted violet + amber (Benny)
  profile: ["#0d1418", "#3b5f7a", "#47918F"], // teal + steel blue
  auth: ["#0d1615", "#47918F", "#8fcfb6"], // teal + soft mint
} as const satisfies Record<string, RoutePalette>;

export function paletteForPath(pathname: string | null | undefined): RoutePalette {
  const p = pathname ?? "/";
  const is = (prefix: string) => p === prefix || p.startsWith(`${prefix}/`);
  if (is("/roast-me")) return PALETTES.roastMe;
  if (is("/roast")) return PALETTES.roast;
  if (is("/brew")) return PALETTES.brew;
  if (is("/profile")) return PALETTES.profile;
  if (is("/onboarding") || is("/sign-in") || is("/sign-up")) return PALETTES.auth;
  return PALETTES.feed;
}

/** "#rrggbb" -> [r, g, b] in 0..1 */
export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
