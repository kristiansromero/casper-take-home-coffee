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
