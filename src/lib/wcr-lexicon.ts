// Short paraphrases of attributes in the World Coffee Research Sensory Lexicon v2.0.
// Definitions are summarized in our own words; references name the standard the
// lexicon uses to calibrate each attribute (with the modality it's scored in).
// Full text, intensities and preparation: WCR_LEXICON_URL in sca-wheel.ts.

export type LexiconEntry = { definition: string; reference?: string };

export const LEXICON_SOURCE_NOTE = "Summarized from the WCR Sensory Lexicon v2.0";

export const WCR_LEXICON: Record<string, LexiconEntry> = {
  // ---- Fruity
  Fruity: {
    definition: "A sweet, lightly floral impression of mixed ripe fruit rather than any single fruit.",
    reference: "Juicy Juice 100% apple-based juice, diluted (aroma)",
  },
  Berry: {
    definition: "Sweet-sour, floral and sometimes heavy fruit character shared by blackberries, raspberries, blueberries and strawberries.",
    reference: "Triple-berry preserves (aroma, flavor)",
  },
  Blackberry: {
    definition: "Dark, sweet berry character with floral and slightly sour edges and a faint woodiness.",
    reference: "Smucker's blackberry jam (flavor)",
  },
  Raspberry: {
    definition: "Lightly sweet, floral, slightly tart berry note with a hint of mustiness.",
    reference: "Raspberry gelatin powder, dry (flavor)",
  },
  Blueberry: {
    definition: "Somewhat dark, sweet and tart berry note with dusty/musty and floral undertones.",
    reference: "Canned blueberries in light syrup (aroma, flavor)",
  },
  Strawberry: {
    definition: "Moderately sweet, slightly tart, floral fruitiness that often leans winey.",
    reference: "Thawed frozen whole strawberries (aroma, flavor)",
  },
  "Dried Fruit": {
    definition: "Concentrated dark-fruit sweetness with a light brown, cooked edge, like dried plums and raisins.",
    reference: "Diluted prune juice; stewed raisin–prune mix (aroma, flavor)",
  },
  Raisin: {
    definition: "Concentrated, sweet, brown and somewhat tart fruitiness of dried grapes.",
    reference: "Stewed chopped raisins (aroma)",
  },
  Prune: {
    definition: "Sweet, brownish dark-fruit note of dried plums, slightly musty and overripe.",
    reference: "Stewed chopped prunes (aroma)",
  },
  "Other Fruit": {
    definition: "Light, sweet fruit character that isn't berry or citrus — think apple, pear, stone fruit, grape, cherry.",
    reference: "Le Nez du Café \"apple\" essence (aroma)",
  },
  Apple: {
    definition: "Light, sweet, gently floral fruitiness of fresh or cooked apples.",
    reference: "Le Nez du Café \"apple\" essence (aroma)",
  },
  Pear: {
    definition: "Sweet, softly floral pear fruit with musty and woody undertones.",
    reference: "Canned pear nectar (flavor)",
  },
  Peach: {
    definition: "Perfumy, floral, sweet stone-fruit note with light tartness.",
    reference: "A cleaned fresh peach pit (aroma)",
  },
  Grape: {
    definition: "Sweet, fruity, slightly tart and musty character typical of grape juice.",
    reference: "Welch's unfiltered grape juice, diluted (flavor)",
  },
  Cherry: {
    definition: "Tart, fruity cherry note with slight bitterness and a floral lift.",
    reference: "Pure tart-cherry juice, diluted (flavor)",
  },
  Pomegranate: {
    definition: "Sweet-tart fruit that can read dark and earthy (beet-like), often with some astringency.",
    reference: "Pure pomegranate juice (aroma)",
  },
  Coconut: {
    definition: "Lightly sweet, nutty, slightly woody note of coconut.",
    reference: "Imitation coconut extract on cotton (aroma)",
  },
  Pineapple: {
    definition: "Sweet, slightly sharp tropical fruitiness of pineapple.",
    reference: "Canned pineapple juice, diluted (aroma)",
  },
  "Citrus Fruit": {
    definition: "Bright, tart, peely and astringent fruitiness with some sweetness — lemons, limes, oranges, grapefruit.",
    reference: "Fresh lemon and lime peels (aroma)",
  },
  Lemon: {
    definition: "Tart, astringent, peely citrus with a little sweetness and a floral edge.",
    reference: "Fresh lemon juice, diluted (aroma)",
  },
  Lime: {
    definition: "Sharp, sour, green and bitter citrus with peel character and a faint floral note.",
    reference: "Fresh lime peel (aroma); bottled lime juice (flavor)",
  },
  Grapefruit: {
    definition: "Tart, bitter, sharp citrus with peel and astringency and only slight sweetness.",
    reference: "100% white grapefruit juice (flavor)",
  },
  Orange: {
    definition: "Sweet, floral, mildly tart citrus that can carry bitter, peely notes.",
    reference: "No-pulp orange juice (flavor)",
  },
  // ---- Sour/Fermented
  "Sour/Fermented": {
    definition: "Acidic and fermentation-derived notes, from clean organic acids to winey, boozy or overripe.",
  },
  Sour: {
    definition: "The basic taste of acids; in coffee usually citric- or malic-like.",
    reference: "Dilute citric acid solution (flavor)",
  },
  "Sour Aromatics": {
    definition: "A smell that suggests something sour before you taste it.",
    reference: "Rinsed canned pinto beans (aroma)",
  },
  "Acetic Acid": {
    definition: "Vinegar-like sourness that is slightly pungent and astringent.",
    reference: "Dilute acetic acid solution (aroma)",
  },
  "Butyric Acid": {
    definition: "Sour, fermented-dairy note reminiscent of aged hard cheeses like Parmesan.",
    reference: "Very dilute butyric acid solution (aroma)",
  },
  "Isovaleric Acid": {
    definition: "Pungent, sour, sweaty note — think strong aged cheese or gym socks.",
    reference: "Very dilute isovaleric acid solution (aroma)",
  },
  "Citric Acid": {
    definition: "Clean, mild sourness with a faint citrus impression and some astringency.",
    reference: "Dilute citric acid solution (aroma)",
  },
  "Malic Acid": {
    definition: "Sharp, somewhat fruity (green-apple-like) sourness with astringency.",
    reference: "Dilute malic acid solution (flavor)",
  },
  "Alcohol/Fermented": {
    definition: "Alcohol-like and yeasty notes from fermentation, ranging from wine to spirits to overripe fruit.",
    reference: "Diluted vodka (aroma)",
  },
  Winey: {
    definition: "Sharp, fruity, alcohol-like impression of red wine.",
    reference: "Cabernet Sauvignon (aroma)",
  },
  Whiskey: {
    definition: "The aroma of spirits distilled from fermented grain.",
    reference: "Tennessee whiskey (aroma)",
  },
  Fermented: {
    definition: "Pungent, sweet-sour, sometimes yeasty, alcohol-like note of fermenting fruit, sugar or dough.",
    reference: "Stout beer (aroma)",
  },
  Overripe: {
    definition: "Sweet, slightly sour, damp and earthy note of fruit past its peak.",
    reference: "Thawed overripe banana (aroma)",
  },
  // ---- Green/Vegetative
  "Green/Vegetative": {
    definition: "Fresh plant-material notes — leafy, grassy, peapod, herbaceous — that can tip into cooked vegetable.",
    reference: "Parsley steeped in water (aroma)",
  },
  "Olive Oil": {
    definition: "Light, oily note that may carry buttery, green, peppery or bitter facets.",
    reference: "Extra-virgin olive oil (aroma)",
  },
  Raw: {
    definition: "The impression of something uncooked.",
    reference: "Raw whole almonds (flavor)",
  },
  "Under-ripe": {
    definition: "Green, unripe-fruit character.",
    reference: "Grapefruit peel (aroma)",
  },
  Peapod: {
    definition: "Sweet, beany, fresh green note of raw pea pods with some earthiness.",
    reference: "Le Nez du Café essence no. 3 (aroma)",
  },
  Fresh: {
    definition: "Freshly cut grass and leaves — green and slightly pungent.",
    reference: "Fresh green grass (aroma)",
  },
  "Dark Green": {
    definition: "Cooked dark leafy greens like spinach or kale, with bitter, dusty or earthy elements.",
    reference: "Canned cut green beans (aroma)",
  },
  Vegetative: {
    definition: "Sharp, slightly pungent green-vegetable character (asparagus, peapod).",
    reference: "Canned asparagus spears (flavor)",
  },
  "Hay-like": {
    definition: "Dry, lightly sweet, dusty note of dried grasses.",
    reference: "Dried parsley flakes (aroma)",
  },
  "Herb-like": {
    definition: "Sweet, slightly pungent and bitter note of culinary herbs, green or dried.",
    reference: "Mix of bay leaf, thyme and similar dried herbs (aroma)",
  },
  Beany: {
    definition: "Cooked-bean character: earthy, dusty, starchy, a bit green, nutty or brown.",
    reference: "Rinsed canned pinto beans (aroma)",
  },
  // ---- Other
  Other: {
    definition: "Off-notes and taints — papery, musty, chemical — usually signs of age, storage or processing defects.",
  },
  "Papery/Musty": {
    definition: "Stale, papery, woody, damp or earthy notes typically tied to age or storage.",
  },
  Stale: {
    definition: "A flat impression of lost freshness.",
    reference: "Day-old, open-air pound cake (aroma)",
  },
  Cardboard: {
    definition: "The smell of cardboard boxes and paper packaging.",
    reference: "A square of corrugated cardboard (aroma)",
  },
  Papery: {
    definition: "The smell of white paper cups or filters.",
    reference: "Paper coffee filters soaked in water (flavor)",
  },
  Woody: {
    definition: "Sweet, brown, dark, musty note of tree bark.",
    reference: "Chopped walnuts (aroma)",
  },
  "Moldy/Damp": {
    definition: "Musty, slightly sharp smell of damp basements and closed spaces.",
    reference: "2-ethyl-1-hexanol on cotton (aroma)",
  },
  "Musty/Dusty": {
    definition: "Dry, stuffy smell of attics and closets — can include dry soil, grain or paper.",
    reference: "Wheat germ (aroma)",
  },
  "Musty/Earthy": {
    definition: "Heavy, slightly sweet smell of damp black soil and decaying leaves.",
    reference: "Potting soil (aroma)",
  },
  Animalic: {
    definition: "Barnyard and animal-habitat smells.",
    reference: "Unflavored gelatin dissolved in water (aroma)",
  },
  "Meaty Brothy": {
    definition: "Savory, cooked-meat or stock-like impression.",
    reference: "Beef broth (aroma)",
  },
  Phenolic: {
    definition: "Damp, musty, leather/animal-hide note, like a tack room.",
    reference: "Phenylacetic acid (aroma)",
  },
  Chemical: {
    definition: "Sharp, non-food notes — medicinal, petroleum, rubber — plus harsh tastes like bitter and salty.",
  },
  Bitter: {
    definition: "The basic taste of caffeine or quinine.",
    reference: "Dilute caffeine solution (flavor)",
  },
  Salty: {
    definition: "The basic taste of table salt.",
    reference: "Dilute sodium chloride solution (flavor)",
  },
  Medicinal: {
    definition: "Clean, sterile antiseptic smell — bandages, rubbing alcohol, iodine.",
    reference: "Iodine (aroma)",
  },
  Petroleum: {
    definition: "Crude-oil and refined-petroleum smell, often oily.",
    reference: "Petroleum jelly (aroma)",
  },
  Skunky: {
    definition: "Sulfurous, skunk-like smell.",
    reference: "Latex balloons (aroma)",
  },
  Rubber: {
    definition: "Dark, heavy, slightly sharp smell of rubber.",
    reference: "Rubber bands (aroma)",
  },
  // ---- Roasted
  Roasted: {
    definition: "Dark-brown notes produced by roasting — from cereal and tobacco to smoky and burnt.",
  },
  "Pipe Tobacco": {
    definition: "Sweet, brown cured tobacco with fruity, floral, spicy facets.",
    reference: "Pipe tobacco (aroma)",
  },
  Tobacco: {
    definition: "Brown, slightly sweet, slightly pungent cured-tobacco leaf.",
    reference: "Le Nez du Café \"pipe tobacco\" essence (aroma)",
  },
  Burnt: {
    definition: "Dark-brown, over-cooked impression that may be sharp, bitter or sour.",
    reference: "Benzyl disulfide (aroma)",
  },
  Acrid: {
    definition: "Sharp, bitter, acidic smell of something over-roasted or scorched.",
    reference: "Over-toasted bran cereal (aroma)",
  },
  Ashy: {
    definition: "Dry, dusty, dirty-smoky residue of burnt material, like an ashtray.",
    reference: "Black (heavily alkalized) cocoa powder (aroma)",
  },
  Smoky: {
    definition: "Pungent smoke from burning wood or leaves.",
    reference: "Wood ashes; benzyl disulfide (aroma)",
  },
  "Brown, Roast": {
    definition: "Dark-brown character of foods cooked hot and dry; may carry bitterness.",
    reference: "Dark-roasted peanuts (flavor)",
  },
  Cereal: {
    definition: "Light-brown, toasty, grain-based sweetness.",
    reference: "Puffed rice / wheat cereal mix (aroma)",
  },
  Grain: {
    definition: "Light-brown, dusty, slightly sweet smell of grains.",
    reference: "Mixed rice and wheat cereals (aroma)",
  },
  Malt: {
    definition: "Light-brown, sweet, slightly sour/fermented note of malted grain.",
    reference: "Grape-Nuts cereal (aroma)",
  },
  // ---- Spices
  Spices: {
    definition: "Warm, pungent or aromatic notes of culinary spices.",
  },
  Pungent: {
    definition: "A sharp, penetrating sensation in the nose.",
    reference: "Diluted sage/orange essential oil (aroma)",
  },
  Pepper: {
    definition: "Spicy, pungent, woody smell of ground black pepper.",
    reference: "Ground black pepper (aroma)",
  },
  "Brown Spice": {
    definition: "Sweet, brown baking-spice character — cinnamon, clove, nutmeg, allspice.",
    reference: "Cinnamon sticks (aroma)",
  },
  Anise: {
    definition: "Sweet, pungent licorice-like spice, sometimes medicinal.",
    reference: "Pure anise extract (aroma)",
  },
  Nutmeg: {
    definition: "Heavy, woody, pungent brown spice with a faint lemony lift.",
    reference: "Ground nutmeg (aroma)",
  },
  Cinnamon: {
    definition: "Sweet, brown, slightly woody and pungent spice.",
    reference: "Ground cinnamon (aroma)",
  },
  Clove: {
    definition: "Sweet, brown, pungent spice with medicinal, floral and slightly minty facets.",
    reference: "Le Nez du Café \"clove\" essence (aroma)",
  },
  // ---- Nutty/Cocoa
  "Nutty/Cocoa": {
    definition: "Brown, roasted-nut and cocoa notes — one of the most common descriptors in coffee.",
  },
  Nutty: {
    definition: "Slightly sweet, brown, oily, woody note of nuts and seeds, sometimes with bitterness.",
    reference: "Le Nez du Café \"roasted hazelnut\" essence (aroma)",
  },
  Almond: {
    definition: "Sweet, light-brown, woody and buttery nut with cherry/apricot-pit facets.",
    reference: "Le Nez du Café \"roasted almond\" essence (aroma)",
  },
  Hazelnut: {
    definition: "Woody, brown, sweet, slightly earthy nut with a cedar-like edge.",
    reference: "Le Nez du Café hazelnut essence (aroma); imitation hazelnut extract (flavor)",
  },
  Peanuts: {
    definition: "Sweet, light-brown, oily, slightly beany and dusty roasted-peanut note.",
    reference: "Oven-roasted blanched peanuts (aroma)",
  },
  Cocoa: {
    definition: "Brown, sweet, dusty and often bitter note of cocoa powder and chocolate.",
    reference: "Natural unsweetened cocoa powder (aroma)",
  },
  Chocolate: {
    definition: "A blend of cocoa, cocoa butter and dark-roast aromatics at varying strength.",
    reference: "Semi-sweet chocolate chips (aroma)",
  },
  "Dark Chocolate": {
    definition: "Intense cocoa and cocoa butter that may bring roasty, spicy or burnt notes, more bitterness and astringency.",
    reference: "90% cocoa dark chocolate (aroma)",
  },
  // ---- Sweet
  Sweet: {
    definition: "Sweet taste together with aromas that suggest sweetness — sugars, caramel, honey, vanilla.",
    reference: "Dilute sucrose solution (flavor)",
  },
  "Brown Sugar": {
    definition: "Rich, full, rounded sweetness with some darkness.",
    reference: "Golden brown cane sugar (aroma)",
  },
  Molasses: {
    definition: "Dark, caramelized sweetness that can be slightly sharp, acrid or sulfurous.",
    reference: "Molasses dissolved in water (aroma)",
  },
  "Maple Syrup": {
    definition: "Woody, sweet, caramelized brown note with a slight green edge.",
    reference: "Le Nez du Café \"maple syrup\" essence (aroma)",
  },
  Caramelized: {
    definition: "Rounded, medium-brown sweetness of cooked sugars, without scorched notes.",
    reference: "Le Nez du Café \"caramel\" essence (aroma)",
  },
  Honey: {
    definition: "Sweet, light-brown, slightly spicy note of honey.",
    reference: "Clover honey dissolved in water (aroma)",
  },
  Vanilla: {
    definition: "Woody, slightly chemical sweetness of vanilla bean, possibly brown or spicy.",
    reference: "Le Nez du Café \"vanilla\" essence (aroma)",
  },
  Vanillin: {
    definition: "Very sweet, artificial vanilla — cotton candy, marshmallow.",
    reference: "Vanillin powder in water (aroma)",
  },
  "Overall Sweet": {
    definition: "The combined perception of sweet taste and sweet aromatics.",
    reference: "Shredded wheat cereal (flavor)",
  },
  "Sweet Aromatics": {
    definition: "A smell that suggests something sweet.",
    reference: "Dilute vanillin solution (aroma)",
  },
  // ---- Floral
  Floral: {
    definition: "Sweet, light, fragrant note of fresh flowers.",
    reference: "Diluted white grape juice (aroma)",
  },
  "Black Tea": {
    definition: "Brown, musty, dried-leaf and bark note of oxidized tea leaves.",
    reference: "Black tea leaves (aroma)",
  },
  Chamomile: {
    definition: "Sweet, lightly floral/fruity, slightly woody-green note of chamomile tea.",
    reference: "Brewed chamomile tea bag (aroma)",
  },
  Rose: {
    definition: "Soft, sweet, slightly dusty floral of fresh or dried roses.",
    reference: "Rose water (aroma)",
  },
  Jasmine: {
    definition: "Intense, sweet, slightly pungent floral with green and dusty undertones.",
    reference: "Jasmine extract (aroma)",
  },
};

/**
 * Lexicon entry for a wheel path. The wheel reuses some names across tiers
 * ("Green/Vegetative", "Floral"), so lookups go by the last segment.
 */
export function lexiconEntry(pathOrName: string): LexiconEntry | undefined {
  const name = pathOrName.split(" > ").at(-1) ?? pathOrName;
  return WCR_LEXICON[name];
}
