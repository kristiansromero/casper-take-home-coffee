// SCA / WCR Coffee Taster's Flavor Wheel (2016), up to three tiers.
// Tags are stored as paths joined with " > ", e.g. "Fruity > Berry > Blackberry".
// (" > " rather than "/" because names like "Green/Vegetative" contain slashes.)

export type FlavorNode = { name: string; children?: FlavorNode[] };

const leaves = (...names: string[]) => names.map((name) => ({ name }));

export const SCA_WHEEL: FlavorNode[] = [
  {
    name: "Fruity",
    children: [
      { name: "Berry", children: leaves("Blackberry", "Raspberry", "Blueberry", "Strawberry") },
      { name: "Dried Fruit", children: leaves("Raisin", "Prune") },
      {
        name: "Other Fruit",
        children: leaves("Coconut", "Cherry", "Pomegranate", "Pineapple", "Grape", "Apple", "Peach", "Pear"),
      },
      { name: "Citrus Fruit", children: leaves("Grapefruit", "Orange", "Lemon", "Lime") },
    ],
  },
  {
    name: "Sour/Fermented",
    children: [
      {
        name: "Sour",
        children: leaves("Sour Aromatics", "Acetic Acid", "Butyric Acid", "Isovaleric Acid", "Citric Acid", "Malic Acid"),
      },
      { name: "Alcohol/Fermented", children: leaves("Winey", "Whiskey", "Fermented", "Overripe") },
    ],
  },
  {
    name: "Green/Vegetative",
    children: [
      { name: "Olive Oil" },
      { name: "Raw" },
      {
        name: "Green/Vegetative",
        children: leaves("Under-ripe", "Peapod", "Fresh", "Dark Green", "Vegetative", "Hay-like", "Herb-like"),
      },
      { name: "Beany" },
    ],
  },
  {
    name: "Other",
    children: [
      {
        name: "Papery/Musty",
        children: leaves(
          "Stale", "Cardboard", "Papery", "Woody", "Moldy/Damp",
          "Musty/Dusty", "Musty/Earthy", "Animalic", "Meaty Brothy", "Phenolic",
        ),
      },
      { name: "Chemical", children: leaves("Bitter", "Salty", "Medicinal", "Petroleum", "Skunky", "Rubber") },
    ],
  },
  {
    name: "Roasted",
    children: [
      { name: "Pipe Tobacco" },
      { name: "Tobacco" },
      { name: "Burnt", children: leaves("Acrid", "Ashy", "Smoky", "Brown, Roast") },
      { name: "Cereal", children: leaves("Grain", "Malt") },
    ],
  },
  {
    name: "Spices",
    children: [
      { name: "Pungent" },
      { name: "Pepper" },
      { name: "Brown Spice", children: leaves("Anise", "Nutmeg", "Cinnamon", "Clove") },
    ],
  },
  {
    name: "Nutty/Cocoa",
    children: [
      { name: "Nutty", children: leaves("Peanuts", "Hazelnut", "Almond") },
      { name: "Cocoa", children: leaves("Chocolate", "Dark Chocolate") },
    ],
  },
  {
    name: "Sweet",
    children: [
      { name: "Brown Sugar", children: leaves("Molasses", "Maple Syrup", "Caramelized", "Honey") },
      { name: "Vanilla" },
      { name: "Vanillin" },
      { name: "Overall Sweet" },
      { name: "Sweet Aromatics" },
    ],
  },
  {
    name: "Floral",
    children: [{ name: "Black Tea" }, { name: "Floral", children: leaves("Chamomile", "Rose", "Jasmine") }],
  },
];

export const CATEGORY_COLORS: Record<string, string> = {
  Fruity: "#E0475B",
  "Sour/Fermented": "#E3B23C",
  "Green/Vegetative": "#4FA36A",
  Other: "#7FA7BC",
  Roasted: "#C0703F",
  Spices: "#D4553F",
  "Nutty/Cocoa": "#A9785A",
  Sweet: "#E27D60",
  Floral: "#C98BC0",
};

export const WCR_LEXICON_URL = "https://worldcoffeeresearch.org/resources/sensory-lexicon";

export const TAG_SEP = " > ";

export const tagPath = (...names: string[]) => names.join(TAG_SEP);
export const tagLabel = (path: string) => path.split(TAG_SEP).at(-1) ?? path;
export const tagCategory = (path: string) => path.split(TAG_SEP)[0];
export const tagColor = (path: string) => CATEGORY_COLORS[tagCategory(path)] ?? "#47918F";

// ---------------------------------------------------------------------------
// Per-node colors approximating the printed SCA/WCR wheel palette. Keyed by
// full path (names repeat across tiers, e.g. "Green/Vegetative").
// ---------------------------------------------------------------------------

const C = (...names: string[]) => tagPath(...names);

export const NODE_COLORS: Record<string, string> = {
  // Fruity — reds / pinks / oranges
  [C("Fruity")]: "#DA1D23",
  [C("Fruity", "Berry")]: "#DD4C51",
  [C("Fruity", "Berry", "Blackberry")]: "#7A1B3A",
  [C("Fruity", "Berry", "Raspberry")]: "#E62969",
  [C("Fruity", "Berry", "Blueberry")]: "#6569B0",
  [C("Fruity", "Berry", "Strawberry")]: "#EF2D36",
  [C("Fruity", "Dried Fruit")]: "#C94A44",
  [C("Fruity", "Dried Fruit", "Raisin")]: "#B53B54",
  [C("Fruity", "Dried Fruit", "Prune")]: "#A5446F",
  [C("Fruity", "Other Fruit")]: "#F2684B",
  [C("Fruity", "Other Fruit", "Coconut")]: "#E9A27C",
  [C("Fruity", "Other Fruit", "Cherry")]: "#E73451",
  [C("Fruity", "Other Fruit", "Pomegranate")]: "#E65656",
  [C("Fruity", "Other Fruit", "Pineapple")]: "#F89A1C",
  [C("Fruity", "Other Fruit", "Grape")]: "#AEB92C",
  [C("Fruity", "Other Fruit", "Apple")]: "#4EB849",
  [C("Fruity", "Other Fruit", "Peach")]: "#F68A5C",
  [C("Fruity", "Other Fruit", "Pear")]: "#BAA635",
  [C("Fruity", "Citrus Fruit")]: "#F7A128",
  [C("Fruity", "Citrus Fruit", "Grapefruit")]: "#F26355",
  [C("Fruity", "Citrus Fruit", "Orange")]: "#E2631E",
  [C("Fruity", "Citrus Fruit", "Lemon")]: "#FDE404",
  [C("Fruity", "Citrus Fruit", "Lime")]: "#7EB138",
  // Sour/Fermented — yellow-greens / ochres
  [C("Sour/Fermented")]: "#EBB40F",
  [C("Sour/Fermented", "Sour")]: "#E1C315",
  [C("Sour/Fermented", "Sour", "Sour Aromatics")]: "#9EA718",
  [C("Sour/Fermented", "Sour", "Acetic Acid")]: "#94A76F",
  [C("Sour/Fermented", "Sour", "Butyric Acid")]: "#D0B24F",
  [C("Sour/Fermented", "Sour", "Isovaleric Acid")]: "#8EB646",
  [C("Sour/Fermented", "Sour", "Citric Acid")]: "#FAEF07",
  [C("Sour/Fermented", "Sour", "Malic Acid")]: "#C1BA07",
  [C("Sour/Fermented", "Alcohol/Fermented")]: "#B09733",
  [C("Sour/Fermented", "Alcohol/Fermented", "Winey")]: "#A8245E",
  [C("Sour/Fermented", "Alcohol/Fermented", "Whiskey")]: "#B34039",
  [C("Sour/Fermented", "Alcohol/Fermented", "Fermented")]: "#BA9232",
  [C("Sour/Fermented", "Alcohol/Fermented", "Overripe")]: "#8B6439",
  // Green/Vegetative — greens
  [C("Green/Vegetative")]: "#187A2F",
  [C("Green/Vegetative", "Olive Oil")]: "#A2B029",
  [C("Green/Vegetative", "Raw")]: "#718933",
  [C("Green/Vegetative", "Green/Vegetative")]: "#3AA255",
  [C("Green/Vegetative", "Green/Vegetative", "Under-ripe")]: "#A2BB2B",
  [C("Green/Vegetative", "Green/Vegetative", "Peapod")]: "#62AA3C",
  [C("Green/Vegetative", "Green/Vegetative", "Fresh")]: "#03A653",
  [C("Green/Vegetative", "Green/Vegetative", "Dark Green")]: "#038549",
  [C("Green/Vegetative", "Green/Vegetative", "Vegetative")]: "#28B44B",
  [C("Green/Vegetative", "Green/Vegetative", "Hay-like")]: "#A3A830",
  [C("Green/Vegetative", "Green/Vegetative", "Herb-like")]: "#7AC141",
  [C("Green/Vegetative", "Beany")]: "#5E9A80",
  // Other — blue-greys
  [C("Other")]: "#0AA3B5",
  [C("Other", "Papery/Musty")]: "#9DB2B7",
  [C("Other", "Papery/Musty", "Stale")]: "#8B8C90",
  [C("Other", "Papery/Musty", "Cardboard")]: "#BEB276",
  [C("Other", "Papery/Musty", "Papery")]: "#E8E4CF",
  [C("Other", "Papery/Musty", "Woody")]: "#8E6418",
  [C("Other", "Papery/Musty", "Moldy/Damp")]: "#A3A36F",
  [C("Other", "Papery/Musty", "Musty/Dusty")]: "#C9B583",
  [C("Other", "Papery/Musty", "Musty/Earthy")]: "#978847",
  [C("Other", "Papery/Musty", "Animalic")]: "#9D977F",
  [C("Other", "Papery/Musty", "Meaty Brothy")]: "#CC7B6A",
  [C("Other", "Papery/Musty", "Phenolic")]: "#DB646A",
  [C("Other", "Chemical")]: "#76C0CB",
  [C("Other", "Chemical", "Bitter")]: "#80A89D",
  [C("Other", "Chemical", "Salty")]: "#C9E6F5",
  [C("Other", "Chemical", "Medicinal")]: "#7A9BAE",
  [C("Other", "Chemical", "Petroleum")]: "#039FB8",
  [C("Other", "Chemical", "Skunky")]: "#5E777B",
  [C("Other", "Chemical", "Rubber")]: "#5A5050",
  // Roasted — browns / greys
  [C("Roasted")]: "#C94930",
  [C("Roasted", "Pipe Tobacco")]: "#CAA465",
  [C("Roasted", "Tobacco")]: "#DFBD7E",
  [C("Roasted", "Burnt")]: "#BE8663",
  [C("Roasted", "Burnt", "Acrid")]: "#B9A449",
  [C("Roasted", "Burnt", "Ashy")]: "#899893",
  [C("Roasted", "Burnt", "Smoky")]: "#A1743B",
  [C("Roasted", "Burnt", "Brown, Roast")]: "#A0571A",
  [C("Roasted", "Cereal")]: "#DDAF61",
  [C("Roasted", "Cereal", "Grain")]: "#B7906F",
  [C("Roasted", "Cereal", "Malt")]: "#EB9D5F",
  // Spices — red-browns
  [C("Spices")]: "#AD213E",
  [C("Spices", "Pungent")]: "#94576A",
  [C("Spices", "Pepper")]: "#CC3D41",
  [C("Spices", "Brown Spice")]: "#B14D57",
  [C("Spices", "Brown Spice", "Anise")]: "#C78936",
  [C("Spices", "Brown Spice", "Nutmeg")]: "#A3363A",
  [C("Spices", "Brown Spice", "Cinnamon")]: "#E5762E",
  [C("Spices", "Brown Spice", "Clove")]: "#A16C5A",
  // Nutty/Cocoa — browns
  [C("Nutty/Cocoa")]: "#A87B64",
  [C("Nutty/Cocoa", "Nutty")]: "#C78869",
  [C("Nutty/Cocoa", "Nutty", "Peanuts")]: "#D4AD12",
  [C("Nutty/Cocoa", "Nutty", "Hazelnut")]: "#9D5433",
  [C("Nutty/Cocoa", "Nutty", "Almond")]: "#C89F83",
  [C("Nutty/Cocoa", "Cocoa")]: "#BB764C",
  [C("Nutty/Cocoa", "Cocoa", "Chocolate")]: "#8A4A30",
  [C("Nutty/Cocoa", "Cocoa", "Dark Chocolate")]: "#6E2B22",
  // Sweet — amber / orange-brown
  [C("Sweet")]: "#E65832",
  [C("Sweet", "Brown Sugar")]: "#D45A59",
  [C("Sweet", "Brown Sugar", "Molasses")]: "#7B3A2A",
  [C("Sweet", "Brown Sugar", "Maple Syrup")]: "#AE341F",
  [C("Sweet", "Brown Sugar", "Caramelized")]: "#D78823",
  [C("Sweet", "Brown Sugar", "Honey")]: "#DA5C1F",
  [C("Sweet", "Vanilla")]: "#F89A80",
  [C("Sweet", "Vanillin")]: "#F37674",
  [C("Sweet", "Overall Sweet")]: "#E75B68",
  [C("Sweet", "Sweet Aromatics")]: "#D0545F",
  // Floral — purples / pinks
  [C("Floral")]: "#DA0D68",
  [C("Floral", "Black Tea")]: "#975E6D",
  [C("Floral", "Floral")]: "#E0719C",
  [C("Floral", "Floral", "Chamomile")]: "#F99E1C",
  [C("Floral", "Floral", "Rose")]: "#EF5A78",
  [C("Floral", "Floral", "Jasmine")]: "#F2E9A8",
};

/** Most specific wheel color for a path, falling back up the tree, then to the category color. */
export function nodeColor(path: string): string {
  const parts = path.split(TAG_SEP);
  for (let i = parts.length; i > 0; i--) {
    const c = NODE_COLORS[parts.slice(0, i).join(TAG_SEP)];
    if (c) return c;
  }
  return tagColor(path);
}

/** Every node of the wheel as a full path (depth-first). */
export const ALL_WHEEL_PATHS: string[] = (() => {
  const out: string[] = [];
  const walk = (nodes: FlavorNode[], prefix: string[]) => {
    for (const node of nodes) {
      const p = [...prefix, node.name];
      out.push(tagPath(...p));
      if (node.children) walk(node.children, p);
    }
  };
  walk(SCA_WHEEL, []);
  return out;
})();

/** The node at a path, or undefined if it isn't on the wheel. */
export function findNode(path: string): FlavorNode | undefined {
  let nodes: FlavorNode[] | undefined = SCA_WHEEL;
  let found: FlavorNode | undefined;
  for (const name of path.split(TAG_SEP)) {
    found = nodes?.find((n) => n.name === name);
    if (!found) return undefined;
    nodes = found.children;
  }
  return found;
}

// ---------------------------------------------------------------------------
// Display helpers. The wheel repeats some names one tier down ("Floral > Floral
// > Rose", "Green/Vegetative > Green/Vegetative > Peapod"). Stored paths keep
// the full form; these helpers collapse the repeat for display.
// ---------------------------------------------------------------------------

/** Suffix shown on a subcategory that shares its parent's name, when it is the last segment. */
export const GROUP_SUFFIX = " (group)";

/**
 * Display segments for a path: a segment equal to its parent is dropped, except
 * when it is the final segment, where it becomes "Floral (group)" so the Tier-2
 * node stays distinguishable from the Tier-1 category.
 *   "Floral > Floral > Rose" -> ["Floral", "Rose"]
 *   "Floral > Floral"        -> ["Floral (group)"]
 *   "Floral"                 -> ["Floral"]
 */
export function displaySegments(path: string): string[] {
  const parts = path ? path.split(TAG_SEP) : [];
  const out: string[] = [];
  parts.forEach((name, i) => {
    if (i > 0 && name === parts[i - 1]) {
      if (i === parts.length - 1) out[out.length - 1] = `${name}${GROUP_SUFFIX}`;
      return;
    }
    out.push(name);
  });
  return out;
}

/** Human path, e.g. "Floral › Rose". */
export const displayPath = (path: string, sep = " › ") => displaySegments(path).join(sep);

/** Last display segment, e.g. "Rose" or "Floral (group)". */
export const displayLabel = (path: string) => displaySegments(path).at(-1) ?? path;

/** Readable text tint for a (possibly very light or very dark) node color on the dark UI. */
export const readableTint = (color: string) => `color-mix(in oklab, ${color} 55%, #F2F4F5)`;

/** True when a hex color is light enough that dark text should sit on it. */
export function isLightColor(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}

/** Category color of the most frequent core category among paths (ties: first seen), or undefined. */
export function dominantCategoryColor(paths: string[]): string | undefined {
  const counts = new Map<string, number>();
  let best: string | undefined;
  for (const p of paths) {
    const c = tagCategory(p);
    const n = (counts.get(c) ?? 0) + 1;
    counts.set(c, n);
    if (!best || n > (counts.get(best) ?? 0)) best = c;
  }
  return best ? CATEGORY_COLORS[best] : undefined;
}
