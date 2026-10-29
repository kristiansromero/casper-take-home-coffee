import JSZip from "jszip";
import { developmentPct, fmtTime, type CurvePoint } from "@/lib/mock-curve";

export type ExportableRoast = {
  beanName: string;
  roasterName: string;
  machineName: string;
  batchSizeG: number;
  chargeTempC: number;
  firstCrackSec: number;
  dropSec: number;
  dropTempC: number;
  flavorTags: string[];
  notes?: string | null;
  curve: CurvePoint[];
  createdAt: string | Date;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "roast";

/** Python literal serializer (Artisan .alog files are a repr()'d Python dict). */
function py(value: unknown): string {
  if (value === null || value === undefined) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "None";
  if (typeof value === "string") return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n")}'`;
  if (Array.isArray(value)) return `[${value.map(py).join(", ")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .map(([k, v]) => `${py(k)}: ${py(v)}`)
    .join(", ")}}`;
}

const nearestIndex = (curve: CurvePoint[], sec: number) =>
  curve.reduce((best, p, i) => (Math.abs(p.t - sec) < Math.abs(curve[best].t - sec) ? i : best), 0);

function turningPoint(curve: CurvePoint[]) {
  return curve.reduce((min, p) => (p.bt < min.bt ? p : min), curve[0]);
}

export function buildAlog(r: ExportableRoast): string {
  const date = new Date(r.createdAt);
  const fcIdx = nearestIndex(r.curve, r.firstCrackSec);
  const dropIdx = nearestIndex(r.curve, r.dropSec);
  const tp = turningPoint(r.curve);

  return py({
    version: "2.10.0",
    revision: "beanwater-mock",
    title: `${r.beanName} — ${r.roasterName}`,
    beans: r.beanName,
    roastertype: r.machineName,
    roastdate: date.toDateString(),
    roastisodate: date.toISOString().slice(0, 10),
    mode: "C",
    weight: [r.batchSizeG, 0, "g"],
    timex: r.curve.map((p) => p.t),
    temp1: r.curve.map((p) => p.et),
    temp2: r.curve.map((p) => p.bt),
    timeindex: [0, 0, 0, fcIdx, 0, 0, dropIdx, 0],
    flavors_labels: r.flavorTags,
    roastingnotes: r.notes ?? "",
    computed: {
      CHARGE_ET: r.curve[0]?.et ?? r.chargeTempC,
      CHARGE_BT: r.chargeTempC,
      TP_time: tp?.t ?? 0,
      TP_BT: tp?.bt ?? 0,
      FCs_time: r.firstCrackSec,
      FCs_BT: r.curve[fcIdx]?.bt ?? 0,
      DROP_time: r.dropSec,
      DROP_BT: r.dropTempC,
      totaltime: r.dropSec,
      dryphasetime: tp ? r.firstCrackSec - tp.t : r.firstCrackSec,
      finishphasetime: r.dropSec - r.firstCrackSec,
      dev_percent: developmentPct(r.firstCrackSec, r.dropSec),
      weightin: r.batchSizeG,
    },
  });
}

export function buildMarkdown(r: ExportableRoast): string {
  const date = new Date(r.createdAt);
  const tp = turningPoint(r.curve);
  const dev = r.dropSec - r.firstCrackSec;
  const rows: [string, string][] = [
    ["Bean", r.beanName],
    ["Roaster", r.roasterName],
    ["Machine", r.machineName],
    ["Date", date.toISOString().slice(0, 10)],
    ["Batch size", `${r.batchSizeG} g`],
    ["Charge temp", `${r.chargeTempC} °C`],
    ["Turning point", tp ? `${fmtTime(tp.t)} @ ${tp.bt} °C` : "—"],
    ["First crack", fmtTime(r.firstCrackSec)],
    ["Drop", `${fmtTime(r.dropSec)} @ ${r.dropTempC} °C`],
    ["Development", `${fmtTime(dev)} (${developmentPct(r.firstCrackSec, r.dropSec)}%)`],
  ];

  return [
    `# Roast profile — ${r.beanName}`,
    "",
    "> Exported from BeanWater. The bundled `.alog` is a **mock/sample export** in an Artisan-style",
    "> format, generated from a simulated curve — it is not a real logger capture.",
    "",
    "| | |",
    "|---|---|",
    ...rows.map(([k, v]) => `| ${k} | ${v} |`),
    "",
    "## Phases",
    "",
    `- **Charge → turning point**: 0:00 – ${tp ? fmtTime(tp.t) : "?"}`,
    `- **Drying + Maillard** (turning point → first crack): ${tp ? fmtTime(tp.t) : "?"} – ${fmtTime(r.firstCrackSec)}`,
    `- **Development** (first crack → drop): ${fmtTime(dev)}, ${developmentPct(r.firstCrackSec, r.dropSec)}% of total roast time`,
    "",
    "## Flavor",
    "",
    r.flavorTags.length ? r.flavorTags.map((t) => `- ${t}`).join("\n") : "_No flavor tags recorded._",
    "",
    "## Notes",
    "",
    r.notes?.trim() || "_No notes._",
    "",
  ].join("\n");
}

/** Bundle the roast as `<slug>.alog` + `<slug>.md` in a zip and trigger a browser download. */
export async function downloadRoastProfile(roast: ExportableRoast) {
  const date = new Date(roast.createdAt).toISOString().slice(0, 10);
  const slug = slugify(`${roast.beanName}-${date}`);

  const zip = new JSZip();
  zip.file(`${slug}.alog`, buildAlog(roast));
  zip.file(`${slug}.md`, buildMarkdown(roast));
  const blob = await zip.generateAsync({ type: "blob" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
