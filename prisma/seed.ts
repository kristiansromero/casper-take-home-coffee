import { PrismaClient } from "@prisma/client";
import { generateCurve } from "../src/lib/mock-curve";
import { tagPath as t } from "../src/lib/sca-wheel";

const db = new PrismaClient();

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000);

const USERS = [
  {
    email: "reviewer1@beanwater.demo",
    name: "Mara Quintero",
    handle: "mara",
    credentials: "Q Grader, National Barista Finalist",
    bio: "Light roasts, long ratios, and too many refractometer readings.",
    isPro: true,
  },
  {
    email: "reviewer2@beanwater.demo",
    name: "Theo Lindqvist",
    handle: "theo",
    credentials: "Coffee Educator & Sensory Analyst",
    bio: "Teaching people to taste what's actually in the cup.",
  },
  { email: "ines@beanwater.demo", name: "Ines Okafor", handle: "ines", credentials: "SCA Roasting Professional", bio: "Small-batch roaster on a Skywalker V2." },
  { email: "kenji@beanwater.demo", name: "Kenji Watanabe", handle: "kenji", credentials: "Head Barista, 6 yrs", bio: "Espresso dialer. Flat burrs or bust." },
  { email: "priya@beanwater.demo", name: "Priya Raman", handle: "priya", credentials: "SCA Brewing Intermediate", bio: "Pour-over nerd, Kalita Wave loyalist." },
  { email: "sol@beanwater.demo", name: "Sol Herrera", handle: "sol", credentials: "Green Coffee Buyer", bio: "Sourcing from Huila and Nariño." },
  { email: "dag@beanwater.demo", name: "Dag Eriksen", handle: "dag", credentials: "Home Roaster", bio: "Nordic light roasts at home." },
];

const ROASTERS = [
  { name: "Tidewater Roasting Co.", location: "Portland, OR" },
  { name: "Northbound Coffee Lab", location: "Oslo, Norway" },
  { name: "Copperleaf Roasters", location: "Melbourne, Australia" },
  { name: "Altura House", location: "Mexico City, Mexico" },
  { name: "Slow Signal Coffee", location: "Kyoto, Japan" },
];

const BEANS = [
  { name: "Guji Hambela", roaster: 0, origin: "Ethiopia", varietal: "Heirloom", process: "Natural", elevation: "2,100 masl" },
  { name: "Huila El Diviso", roaster: 3, origin: "Colombia", varietal: "Pink Bourbon", process: "Washed", elevation: "1,750 masl" },
  { name: "Nyeri Gatomboya AA", roaster: 1, origin: "Kenya", varietal: "SL28, SL34", process: "Washed", elevation: "1,850 masl" },
  { name: "Finca Deborah Geisha", roaster: 2, origin: "Panama", varietal: "Geisha", process: "Anaerobic", elevation: "1,950 masl" },
  { name: "Cerrado Mineiro", roaster: 0, origin: "Brazil", varietal: "Yellow Catuai", process: "Natural", elevation: "1,100 masl" },
  { name: "Kayanza Ninga", roaster: 4, origin: "Burundi", varietal: "Red Bourbon", process: "Honey", elevation: "1,800 masl" },
  { name: "Aceh Gayo", roaster: 1, origin: "Indonesia", varietal: "Ateng, Tim Tim", process: "Wet-hulled", elevation: "1,500 masl" },
  { name: "Santa Barbara Blend", roaster: 2 },
];

// Equipment per user index.
const EQUIPMENT: Record<number, { category: string; name: string; blurb: string }[]> = {
  0: [
    { category: "espresso", name: "Decent DE1XL", blurb: "Profiling for blooming espresso and long allongés." },
    { category: "grinder", name: "Weber EG-1", blurb: "Ultra-low retention; single-dosed for every shot." },
    { category: "brewer", name: "Orea V4", blurb: "Flat bed, fast drawdown — my daily pour-over." },
    { category: "kettle", name: "Fellow Stagg EKG Pro", blurb: "Held at 94°C for light roasts." },
    { category: "scale", name: "Acaia Lunar", blurb: "Auto-start timer, flow rate readout." },
  ],
  1: [
    { category: "grinder", name: "Comandante C40", blurb: "The hand grinder I teach with." },
    { category: "brewer", name: "Hario V60 02", blurb: "Classic cone for cupping comparisons." },
    { category: "brewer", name: "AeroPress Original", blurb: "Inverted, 2-minute steep for workshops." },
  ],
  2: [
    { category: "roaster", name: "Skywalker V2", blurb: "Modded with a thermocouple feeding Artisan." },
    { category: "grinder", name: "Baratza Encore ESP", blurb: "Workhorse for cupping roast batches." },
  ],
  3: [
    { category: "espresso", name: "La Marzocco Linea Micra", blurb: "Pre-infusion paddle mod." },
    { category: "grinder", name: "Lagom P64", blurb: "SSP high-uniformity burrs." },
  ],
  4: [
    { category: "brewer", name: "Kalita Wave 185", blurb: "Three-pulse recipe, every morning." },
    { category: "grinder", name: "1Zpresso ZP6", blurb: "Bright, clarity-forward grind." },
  ],
  5: [{ category: "roaster", name: "Aillio Bullet R2", blurb: "Sample roasting green lots." }],
  6: [{ category: "roaster", name: "Skywalker V2", blurb: "Stock unit, roasting 250g batches." }],
};

async function main() {
  // Re-runnable: only the demo accounts (and everything they own) are reset, so real
  // sign-ups survive a reseed. Cascades remove their logs, gear, follows and Benny runs.
  await db.user.deleteMany({ where: { email: { in: USERS.map((u) => u.email) } } });

  const users: Awaited<ReturnType<typeof db.user.create>>[] = [];
  for (const u of USERS) users.push(await db.user.create({ data: { ...u, onboardedAt: new Date() } }));

  const roasters: Awaited<ReturnType<typeof db.roaster.create>>[] = [];
  for (const r of ROASTERS) roasters.push(await db.roaster.upsert({ where: { name: r.name }, update: r, create: r }));

  const beans: Awaited<ReturnType<typeof db.bean.create>>[] = [];
  for (const { roaster, ...b } of BEANS) {
    const roasterId = roasters[roaster].id;
    beans.push(
      await db.bean.upsert({
        where: { name_roasterId: { name: b.name, roasterId } },
        update: b,
        create: { ...b, roasterId },
      }),
    );
  }

  const gear: Record<number, Awaited<ReturnType<typeof db.equipment.create>>[]> = {};
  for (const [i, items] of Object.entries(EQUIPMENT)) {
    gear[+i] = [];
    for (const item of items) gear[+i].push(await db.equipment.create({ data: { ...item, userId: users[+i].id } }));
  }
  const find = (u: number, category: string) => gear[u]?.find((e) => e.category === category)?.id;

  const follows: [number, number][] = [
    [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0],
    [0, 1], [2, 1], [4, 1], [6, 1],
    [0, 2], [6, 2], [0, 3], [4, 3], [1, 4], [0, 5], [2, 6],
  ];
  await db.follow.createMany({
    data: follows.map(([a, b]) => ({ followerId: users[a].id, followingId: users[b].id })),
  });

  const brews = [
    { u: 0, bean: 0, method: "pour-over", dose: 15, yld: 250, grind: "EG-1 6.2", time: 165, temp: 94, rating: 5, h: 2,
      tags: [t("Fruity", "Berry", "Blueberry"), t("Floral", "Floral", "Jasmine"), t("Fruity", "Citrus Fruit", "Lemon"), t("Sweet", "Brown Sugar", "Honey"), t("Floral", "Black Tea"), t("Fruity", "Other Fruit", "Peach"), t("Sweet", "Vanilla")],
      notes: String.raw`Bright and syrupy. **Blueberry jam** on the finish as it cools.

| Pulse | Time | Total (g) |
| --- | --- | --- |
| Bloom | 0:00 | 45 |
| 1 | 0:40 | 130 |
| 2 | 1:10 | 200 |
| 3 | 1:35 | 250 |

Ratio $250 / 15 \approx 1{:}16.7$ · drawdown done at **2:45**.

- [x] Rinse paper, preheat V60
- [x] Swirl after bloom
- [ ] Try 93 °C to tame the lemon edge` },
    { u: 3, bean: 1, method: "espresso", dose: 18, yld: 42, grind: "P64 2.1", time: 30, temp: 93, rating: 4, h: 5,
      tags: [t("Fruity", "Other Fruit", "Cherry"), t("Nutty/Cocoa", "Cocoa", "Chocolate"), t("Sweet", "Brown Sugar", "Caramelized")],
      notes: String.raw`Pulled a touch long; *cherry cola* sweetness.

Refractometer read **TDS 9.2%**:

$$EY = \frac{TDS \times yield}{dose} = \frac{9.2\% \times 42}{18} \approx 21.5\%$$

Right in the 18–22% window, so the length is fine — next shot cut at **38 g** for more body.` },
    { u: 4, bean: 2, method: "pour-over", dose: 20, yld: 320, grind: "ZP6 4.5", time: 210, temp: 96, rating: 5, h: 9,
      tags: [t("Fruity", "Berry", "Blackberry"), t("Fruity", "Citrus Fruit", "Grapefruit"), t("Sour/Fermented", "Sour", "Malic Acid"), t("Fruity", "Other Fruit", "Grape"), t("Sweet", "Brown Sugar", "Molasses"), t("Floral", "Black Tea")],
      notes: "Classic Kenyan blackcurrant; Wave keeps it clean." },
    { u: 1, bean: 3, method: "pour-over", dose: 12, yld: 200, grind: "C40 24 clicks", time: 180, temp: 93, rating: 5, h: 20,
      tags: [t("Floral", "Floral", "Jasmine"), t("Fruity", "Other Fruit", "Pineapple"), t("Sour/Fermented", "Alcohol/Fermented", "Winey"), t("Fruity", "Citrus Fruit", "Lime"), t("Floral", "Floral", "Rose"), t("Sweet", "Overall Sweet"), t("Fruity", "Other Fruit", "Peach"), t("Floral", "Black Tea")],
      notes: "Used this for a sensory workshop — anaerobic funk is restrained." },
    { u: 0, bean: 4, method: "espresso", dose: 18, yld: 36, grind: "EG-1 2.8", time: 28, temp: 92, rating: 4, h: 30,
      tags: [t("Nutty/Cocoa", "Nutty", "Hazelnut"), t("Nutty/Cocoa", "Cocoa", "Dark Chocolate"), t("Sweet", "Brown Sugar", "Caramelized")],
      notes: String.raw`Comfort shot. Great in milk.

- Ratio $1{:}2$ in 28 s, TDS 10.5% → $EY \approx \frac{10.5 \times 36}{18} = 21.0\%$
- [ ] Dial 0.1 finer if it runs under 26 s` },
    { u: 1, bean: 5, method: "aeropress", dose: 15, yld: 220, grind: "C40 18 clicks", time: 120, temp: 90, rating: 4, h: 44,
      tags: [t("Fruity", "Other Fruit", "Apple"), t("Sweet", "Brown Sugar", "Honey"), t("Spices", "Brown Spice", "Cinnamon"), t("Floral", "Black Tea")],
      notes: "Inverted, 2 min steep, gentle press." },
    { u: 3, bean: 6, method: "espresso", dose: 19, yld: 38, grind: "P64 1.8", time: 32, temp: 94, rating: 3, h: 60,
      tags: [t("Spices", "Brown Spice", "Clove"), t("Roasted", "Pipe Tobacco"), t("Green/Vegetative", "Green/Vegetative", "Herb-like"), t("Other", "Papery/Musty", "Musty/Earthy")],
      notes: "Heavy body, earthy. Would go coarser next time." },
    { u: 4, bean: 7, method: "immersion", dose: 30, yld: 500, grind: "ZP6 6.0", time: 240, temp: 95, rating: 4, h: 80,
      tags: [t("Nutty/Cocoa", "Cocoa", "Chocolate"), t("Fruity", "Dried Fruit", "Raisin")],
      notes: "Batch for the office." },
  ];

  for (const b of brews) {
    const isEspresso = b.method === "espresso";
    await db.extraction.create({
      data: {
        userId: users[b.u].id,
        beanId: beans[b.bean].id,
        method: b.method,
        brewerId: find(b.u, isEspresso ? "espresso" : "brewer"),
        grinderId: find(b.u, "grinder"),
        doseG: b.dose,
        yieldG: b.yld,
        grind: b.grind,
        timeSec: b.time,
        tempC: b.temp,
        rating: b.rating,
        flavorTags: b.tags,
        notes: b.notes,
        createdAt: hoursAgo(b.h),
      },
    });
  }

  const roasts = [
    { u: 2, bean: 0, batch: 250, charge: 205, fc: 470, drop: 560, dropT: 204, h: 4,
      tags: [t("Fruity", "Berry", "Strawberry"), t("Fruity", "Berry", "Blueberry"), t("Floral", "Floral", "Jasmine"), t("Sweet", "Brown Sugar", "Honey"), t("Fruity", "Citrus Fruit", "Orange"), t("Sweet", "Vanilla")],
      notes: String.raw`Light Nordic-style. **Pulled heat early** before FC to avoid a crash.

| Phase | End | Duration | Share |
| --- | --- | --- | --- |
| Drying | 4:30 | 4:30 | 48% |
| Maillard | 7:50 | 3:20 | 36% |
| Development | 9:20 | 1:30 | 16% |

$$DTR = \frac{t_{drop} - t_{FC}}{t_{drop}} = \frac{560 - 470}{560} \approx 16.1\%$$

> Next batch: hold P7 to 4:00 so development lands closer to 18%.` },
    { u: 6, bean: 1, batch: 250, charge: 210, fc: 500, drop: 610, dropT: 209, h: 14,
      tags: [t("Fruity", "Other Fruit", "Cherry"), t("Sweet", "Brown Sugar", "Caramelized"), t("Nutty/Cocoa", "Cocoa", "Chocolate")],
      notes: String.raw`Medium for espresso. Smooth **RoR decline**, no flick.

- Development $\frac{610 - 500}{610} \approx 18.0\%$ ($\Delta t = 1{:}50$)
- Weight loss $\frac{250 - 214}{250} = 14.4\%$
- [x] Rest 7 days before dialing in` },
    { u: 5, bean: 2, batch: 100, charge: 200, fc: 450, drop: 530, dropT: 202, h: 26,
      tags: [t("Fruity", "Berry", "Blackberry"), t("Fruity", "Citrus Fruit", "Grapefruit"), t("Sour/Fermented", "Sour", "Citric Acid"), t("Floral", "Black Tea"), t("Sweet", "Brown Sugar", "Molasses"), t("Fruity", "Other Fruit", "Grape"), t("Spices", "Pepper")],
      notes: "Sample roast for cupping a new lot." },
    { u: 2, bean: 4, batch: 250, charge: 215, fc: 520, drop: 660, dropT: 214, h: 50,
      tags: [t("Nutty/Cocoa", "Nutty", "Peanuts"), t("Nutty/Cocoa", "Cocoa", "Dark Chocolate"), t("Roasted", "Cereal", "Malt"), t("Sweet", "Brown Sugar", "Maple Syrup")],
      notes: "Medium-dark espresso roast for milk drinks." },
  ];

  for (const [i, r] of roasts.entries()) {
    const machine = gear[r.u]?.find((e) => e.category === "roaster");
    await db.roast.create({
      data: {
        userId: users[r.u].id,
        beanId: beans[r.bean].id,
        machineId: machine?.id,
        machineName: machine?.name ?? "Skywalker V2",
        batchSizeG: r.batch,
        chargeTempC: r.charge,
        firstCrackSec: r.fc,
        dropSec: r.drop,
        dropTempC: r.dropT,
        flavorTags: r.tags,
        notes: r.notes,
        curve: generateCurve({ chargeTempC: r.charge, firstCrackSec: r.fc, dropSec: r.drop, dropTempC: r.dropT, seed: 11 + i * 17 }),
        createdAt: hoursAgo(r.h),
      },
    });
  }

  console.log(`Seeded ${users.length} users, ${roasters.length} roasters, ${beans.length} beans, ${brews.length + roasts.length} logs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
