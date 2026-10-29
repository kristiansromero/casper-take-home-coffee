// Generates a plausible roast curve (bean temp, environment temp, rate of rise)
// from a few roast parameters. Used for seed data, the /roast preview, and
// as a stand-in for .alog uploads (a Pro feature).

export type CurvePoint = { t: number; bt: number; et: number; ror: number | null };

export type CurveParams = {
  chargeTempC: number;
  firstCrackSec: number;
  dropSec: number;
  dropTempC: number;
  seed?: number;
};

function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export function generateCurve({ chargeTempC, firstCrackSec, dropSec, dropTempC, seed = 7 }: CurveParams): CurvePoint[] {
  const rand = rng(seed);
  const tp = Math.min(95, dropSec * 0.15); // turning point time
  const tpTemp = 85 + rand() * 15;
  const fcTemp = 196;
  const points: CurvePoint[] = [];
  const step = 10;

  for (let t = 0; t <= dropSec; t += step) {
    let bt: number;
    if (t <= tp) {
      // fast drop from charge towards turning point
      const k = t / tp;
      bt = chargeTempC - (chargeTempC - tpTemp) * (1 - Math.pow(1 - k, 2.2));
    } else if (t <= firstCrackSec) {
      // decelerating rise to first crack
      const k = (t - tp) / (firstCrackSec - tp);
      bt = tpTemp + (fcTemp - tpTemp) * (1 - Math.pow(1 - k, 1.35));
    } else {
      // development: gentle linear-ish finish to drop temp
      const k = (t - firstCrackSec) / (dropSec - firstCrackSec);
      bt = fcTemp + (dropTempC - fcTemp) * Math.pow(k, 0.9);
    }
    bt += (rand() - 0.5) * 0.6;
    const et = Math.max(bt + 12, chargeTempC - 25 + 50 * Math.min(1, t / dropSec)) + (rand() - 0.5);
    points.push({ t, bt: round(bt), et: round(et), ror: null });
  }

  // Rate of rise in °C/min over a 30s window, skipped through the turning point.
  for (let i = 3; i < points.length; i++) {
    if (points[i - 3].t <= tp) continue;
    points[i].ror = round(((points[i].bt - points[i - 3].bt) / (3 * step)) * 60);
  }
  return points;
}

const round = (n: number) => Math.round(n * 10) / 10;

export const fmtTime = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;

export function developmentPct(firstCrackSec: number, dropSec: number) {
  return Math.round(((dropSec - firstCrackSec) / dropSec) * 1000) / 10;
}
