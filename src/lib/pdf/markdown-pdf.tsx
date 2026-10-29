/**
 * Client-side markdown → branded PDF (BeanWater lab-instrument aesthetic, print-legible light page).
 * Load via `await import("@/lib/pdf/markdown-pdf")` so @react-pdf/renderer stays out of the initial bundle.
 * Uses built-in Helvetica/Courier only (no remote font fetch) — so text is sanitized to WinAnsi glyphs.
 */
import { Document, Link, Page, Polyline, Line, Rect, StyleSheet, Svg, Text, View, pdf } from "@react-pdf/renderer";
import { marked, type Token, type Tokens } from "marked";
import type { ReactNode } from "react";
import type { CurvePoint } from "@/lib/mock-curve";

export type PdfMeta = { label: string; value: string };
export type RenderMarkdownPdfInput = {
  title: string;
  subtitle?: string;
  markdown: string;
  meta?: PdfMeta[];
  curve?: CurvePoint[];
};

const C = {
  obsidian: "#0E1113",
  titanium: "#161B1E",
  line: "#2A3237",
  teal: "#47918F",
  tealTint: "#E6F0EF",
  amber: "#E27D60",
  amberTint: "#FBEDE8",
  sterile: "#E4E7EB",
  muted: "#8F9AA3",
  ink: "#1B2226",
  inkSoft: "#4A555C",
  rule: "#D5DBDF",
  paper: "#FFFFFF",
  codeBg: "#F2F4F5",
};

const SANS = "Helvetica";
const MONO = "Courier";

const s = StyleSheet.create({
  page: { backgroundColor: C.paper, color: C.ink, fontFamily: SANS, fontSize: 10, lineHeight: 1.45, paddingTop: 0, paddingBottom: 54, paddingHorizontal: 0 },
  band: { backgroundColor: C.obsidian, paddingHorizontal: 40, paddingTop: 26, paddingBottom: 20, borderBottomWidth: 3, borderBottomColor: C.teal },
  bandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  wordmark: { fontWeight: "bold", fontSize: 16, color: C.sterile, letterSpacing: 0.3 },
  stamp: { fontFamily: MONO, fontSize: 8, color: C.muted, letterSpacing: 0.5 },
  docTitle: { fontWeight: "bold", fontSize: 20, color: C.sterile, marginTop: 14, lineHeight: 1.2 },
  docSub: { fontSize: 10, color: C.muted, marginTop: 4 },
  body: { paddingHorizontal: 40, paddingTop: 18 },
  sectionLabel: { fontFamily: MONO, fontWeight: "bold", fontSize: 7.5, color: C.teal, letterSpacing: 1.2, marginBottom: 6 },
  tiles: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -3, marginBottom: 14 },
  tile: { width: "20%", paddingHorizontal: 3, marginBottom: 6 },
  tileInner: { borderWidth: 1, borderColor: C.rule, borderTopWidth: 2, borderTopColor: C.teal, borderRadius: 3, paddingVertical: 6, paddingHorizontal: 7, backgroundColor: "#FAFBFB" },
  tileLabel: { fontFamily: MONO, fontSize: 6.5, color: C.inkSoft, letterSpacing: 0.6 },
  tileValue: { fontFamily: MONO, fontWeight: "bold", fontSize: 11, color: C.ink, marginTop: 2 },
  chartBox: { borderWidth: 1, borderColor: C.rule, borderRadius: 3, padding: 10, marginBottom: 16 },
  legendRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  legendSwatch: { width: 10, height: 2, marginRight: 4 },
  legendText: { fontFamily: MONO, fontSize: 7, color: C.inkSoft, marginRight: 12 },
  h1: { fontWeight: "bold", fontSize: 16, color: C.ink, marginTop: 10, marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1.5, borderBottomColor: C.teal },
  h2: { fontWeight: "bold", fontSize: 13, color: C.teal, marginTop: 12, marginBottom: 5 },
  h3: { fontWeight: "bold", fontSize: 11, color: C.ink, marginTop: 9, marginBottom: 4 },
  p: { marginBottom: 7 },
  code: { fontFamily: MONO, fontSize: 9, color: "#2F6E6C", backgroundColor: C.codeBg },
  math: { fontFamily: MONO, fontSize: 9, color: "#B4553A" },
  link: { color: C.teal, textDecoration: "underline" },
  pre: { fontFamily: MONO, fontSize: 8.5, backgroundColor: C.codeBg, borderLeftWidth: 2, borderLeftColor: C.teal, padding: 8, marginBottom: 8, lineHeight: 1.35 },
  mathBlock: { fontFamily: MONO, fontSize: 10, color: "#B4553A", backgroundColor: C.amberTint, borderLeftWidth: 2, borderLeftColor: C.amber, padding: 8, marginBottom: 8, textAlign: "center" },
  quote: { borderLeftWidth: 3, borderLeftColor: C.amber, backgroundColor: C.amberTint, paddingVertical: 6, paddingHorizontal: 10, marginBottom: 8 },
  listItem: { flexDirection: "row", marginBottom: 3 },
  bullet: { width: 16, color: C.teal, fontWeight: "bold" },
  checkbox: { width: 8, height: 8, borderWidth: 1, borderColor: C.teal, borderRadius: 1, marginTop: 2.5, marginRight: 8, alignItems: "center", justifyContent: "center" },
  checkboxOn: { width: 4, height: 4, backgroundColor: C.amber },
  table: { borderWidth: 1, borderColor: C.rule, borderRadius: 2, marginBottom: 10 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.rule },
  trHead: { backgroundColor: C.tealTint, borderBottomWidth: 1, borderBottomColor: C.teal },
  td: { flex: 1, paddingVertical: 4, paddingHorizontal: 6, fontSize: 9 },
  th: { flex: 1, paddingVertical: 4, paddingHorizontal: 6, fontSize: 9, fontWeight: "bold", color: C.ink },
  hr: { borderBottomWidth: 1, borderBottomColor: C.rule, marginVertical: 10 },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.rule, paddingTop: 6 },
  footerText: { fontFamily: MONO, fontSize: 7, color: C.muted, letterSpacing: 0.4 },
});

// ---------- text sanitizing (standard PDF fonts only cover WinAnsi) ----------
const WINANSI_EXTRA = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");
const GLYPH_MAP: Record<string, string> = {
  "→": "->", "←": "<-", "↔": "<->", "⇒": "=>", "≈": "~", "≤": "<=", "≥": ">=", "≠": "!=", "−": "-",
  "Δ": "Delta", "∆": "Delta", "✓": "[x]", "✔": "[x]", "✗": "x", "☐": "[ ]", "☑": "[x]", "′": "'", "″": '"',
  " ": " ", " ": " ", " ": " ",
};
function clean(text: string): string {
  let out = "";
  for (const ch of text) {
    if (GLYPH_MAP[ch] !== undefined) out += GLYPH_MAP[ch];
    else if ((ch.codePointAt(0) ?? 0) <= 0xff || WINANSI_EXTRA.has(ch)) out += ch;
    // else: drop (emoji, CJK, etc. would render as garbage in Helvetica)
  }
  return out;
}

// ---------- LaTeX → plain mono text ----------
export function latexToText(src: string): string {
  let t = src.trim();
  for (let i = 0; i < 6 && /\\[dt]?frac\s*\{/.test(t); i++) {
    t = t.replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1)/($2)");
  }
  t = t
    .replace(/\\sqrt\s*\{([^{}]*)\}/g, "sqrt($1)")
    .replace(/\\(?:text|mathrm|mathbf|mathit|operatorname)\s*\{([^{}]*)\}/g, "$1")
    .replace(/\\left|\\right/g, "")
    .replace(/\^\s*\{?\\circ\}?/g, "°")
    .replace(/\\(?:degree|circ)/g, "°")
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\approx|\\sim/g, "≈")
    .replace(/\\pm/g, "±")
    .replace(/\\(?:le|leq)\b/g, "≤")
    .replace(/\\(?:ge|geq)\b/g, "≥")
    .replace(/\\neq?\b/g, "≠")
    .replace(/\\(?:to|rightarrow)\b/g, "→")
    .replace(/\\Delta/g, "Δ")
    .replace(/\\%/g, "%")
    .replace(/\\[,;:! ]/g, " ")
    .replace(/\\\\/g, " ")
    .replace(/\\([a-zA-Z]+)/g, "$1")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ");
  return t.trim();
}

const MATH_MARK = "\u0001M";
/** Turn $$…$$ into ```math fences and $…$ into marked code spans so marked doesn't mangle them. */
function preprocessMath(md: string): string {
  let out = md.replace(/\$\$([\s\S]+?)\$\$/g, (_m, body: string) => `\n\`\`\`math\n${latexToText(body)}\n\`\`\`\n`);
  out = out.replace(/(^|[^\\$])\$(?!\s)([^$\n]+?)(?<!\s)\$(?!\d)/g, (_m, pre: string, body: string) => {
    const txt = latexToText(body).replace(/`/g, "'");
    return `${pre}\`\` ${MATH_MARK}${txt} \`\``;
  });
  return out;
}

// ---------- inline tokens ----------
function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function inline(tokens: Token[] | undefined, keyPrefix = "i"): ReactNode[] {
  if (!tokens) return [];
  return tokens.map((tok, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (tok.type) {
      case "strong":
        return (
          <Text key={key} style={{ fontWeight: "bold" }}>
            {inline((tok as Tokens.Strong).tokens, key)}
          </Text>
        );
      case "em":
        return (
          <Text key={key} style={{ fontStyle: "italic" }}>
            {inline((tok as Tokens.Em).tokens, key)}
          </Text>
        );
      case "del":
        return (
          <Text key={key} style={{ textDecoration: "line-through" }}>
            {inline((tok as Tokens.Del).tokens, key)}
          </Text>
        );
      case "codespan": {
        const raw = decode((tok as Tokens.Codespan).text);
        if (raw.startsWith(MATH_MARK)) {
          return (
            <Text key={key} style={s.math}>
              {clean(raw.slice(MATH_MARK.length))}
            </Text>
          );
        }
        return (
          <Text key={key} style={s.code}>
            {clean(` ${raw} `)}
          </Text>
        );
      }
      case "link": {
        const l = tok as Tokens.Link;
        return (
          <Link key={key} src={l.href} style={s.link}>
            {inline(l.tokens, key)}
          </Link>
        );
      }
      case "checkbox":
        return null;
      case "br":
        return <Text key={key}>{"\n"}</Text>;
      case "text": {
        const t = tok as Tokens.Text;
        if (t.tokens?.length) return <Text key={key}>{inline(t.tokens, key)}</Text>;
        return <Text key={key}>{clean(decode(t.text))}</Text>;
      }
      case "escape":
        return <Text key={key}>{clean(decode((tok as Tokens.Escape).text))}</Text>;
      case "image":
        return <Text key={key}>{clean(`[${(tok as Tokens.Image).text || "image"}]`)}</Text>;
      default:
        return <Text key={key}>{clean(decode("text" in tok && typeof tok.text === "string" ? tok.text : tok.raw))}</Text>;
    }
  });
}

// ---------- block tokens ----------
function blocks(tokens: Token[], keyPrefix = "b"): ReactNode[] {
  return tokens.map((tok, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (tok.type) {
      case "heading": {
        const h = tok as Tokens.Heading;
        const style = h.depth === 1 ? s.h1 : h.depth === 2 ? s.h2 : s.h3;
        return (
          <Text key={key} style={style} minPresenceAhead={40}>
            {inline(h.tokens, key)}
          </Text>
        );
      }
      case "paragraph":
        return (
          <Text key={key} style={s.p}>
            {inline((tok as Tokens.Paragraph).tokens, key)}
          </Text>
        );
      case "text": {
        const t = tok as Tokens.Text;
        return (
          <Text key={key} style={s.p}>
            {t.tokens ? inline(t.tokens, key) : clean(decode(t.text))}
          </Text>
        );
      }
      case "list": {
        const l = tok as Tokens.List;
        const start = typeof l.start === "number" ? l.start : 1;
        return (
          <View key={key} style={{ marginBottom: 7 }}>
            {l.items.map((item, j) => (
              <View key={`${key}-${j}`} style={s.listItem} wrap={false}>
                {item.task ? (
                  <View style={s.checkbox}>{item.checked ? <View style={s.checkboxOn} /> : null}</View>
                ) : (
                  <Text style={s.bullet}>{l.ordered ? `${start + j}.` : "•"}</Text>
                )}
                <View style={{ flex: 1 }}>{listItemBody(item, `${key}-${j}`)}</View>
              </View>
            ))}
          </View>
        );
      }
      case "table": {
        const t = tok as Tokens.Table;
        const headerEmpty = t.header.every((c) => !c.text.trim());
        return (
          <View key={key} style={s.table}>
            {!headerEmpty && (
              <View style={[s.tr, s.trHead]} wrap={false}>
                {t.header.map((c, j) => (
                  <Text key={j} style={[s.th, { textAlign: t.align[j] ?? "left" }]}>
                    {inline(c.tokens, `${key}-h${j}`)}
                  </Text>
                ))}
              </View>
            )}
            {t.rows.map((row, r) => (
              <View
                key={r}
                style={[s.tr, r === t.rows.length - 1 ? { borderBottomWidth: 0 } : {}, r % 2 ? { backgroundColor: "#FAFBFB" } : {}]}
                wrap={false}
              >
                {row.map((c, j) => (
                  <Text
                    key={j}
                    style={[
                      s.td,
                      { textAlign: t.align[j] ?? "left" },
                      headerEmpty && j === 0 ? { fontWeight: "bold", color: C.inkSoft, flex: 0.8 } : {},
                      headerEmpty && j > 0 ? { fontFamily: MONO, color: C.ink } : {},
                    ]}
                  >
                    {inline(c.tokens, `${key}-${r}-${j}`)}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        );
      }
      case "blockquote":
        return (
          <View key={key} style={s.quote} wrap={false}>
            {blocks((tok as Tokens.Blockquote).tokens, key).map((n, j) => (
              <View key={j} style={{ marginBottom: -4 }}>
                {n}
              </View>
            ))}
          </View>
        );
      case "code": {
        const c = tok as Tokens.Code;
        if (c.lang === "math") {
          return (
            <Text key={key} style={s.mathBlock}>
              {clean(c.text)}
            </Text>
          );
        }
        return (
          <Text key={key} style={s.pre}>
            {clean(c.text)}
          </Text>
        );
      }
      case "hr":
        return <View key={key} style={s.hr} />;
      case "space":
      case "def":
        return null;
      case "html":
        return (
          <Text key={key} style={s.p}>
            {clean((tok as Tokens.HTML).text.replace(/<[^>]+>/g, ""))}
          </Text>
        );
      default:
        return tok.raw?.trim() ? (
          <Text key={key} style={s.p}>
            {clean(tok.raw)}
          </Text>
        ) : null;
    }
  });
}

function listItemBody(item: Tokens.ListItem, key: string): ReactNode[] {
  // Tight lists put a `text` token with inline tokens; loose lists nest paragraphs.
  const toks = item.tokens.filter((t) => t.type !== "checkbox");
  return toks.map((t, k) => {
    if (t.type === "text") {
      const tt = t as Tokens.Text;
      return <Text key={`${key}-t${k}`}>{tt.tokens ? inline(tt.tokens, `${key}-t${k}`) : clean(decode(tt.text))}</Text>;
    }
    if (t.type === "paragraph") {
      return <Text key={`${key}-t${k}`}>{inline((t as Tokens.Paragraph).tokens, `${key}-t${k}`)}</Text>;
    }
    return <View key={`${key}-t${k}`}>{blocks([t], `${key}-t${k}`)}</View>;
  });
}

// ---------- curve ----------
function CurveChart({ curve }: { curve: CurvePoint[] }) {
  const W = 493;
  const H = 150;
  const pad = { l: 28, r: 6, t: 6, b: 16 };
  const tMax = Math.max(...curve.map((p) => p.t), 1);
  const temps = curve.flatMap((p) => [p.bt, p.et]).filter((v) => Number.isFinite(v));
  const yMin = Math.floor(Math.min(...temps) / 50) * 50;
  const yMax = Math.ceil(Math.max(...temps) / 50) * 50 || yMin + 50;
  const x = (t: number) => pad.l + (t / tMax) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - yMin) / (yMax - yMin || 1)) * (H - pad.t - pad.b);
  const pts = (k: "bt" | "et") => curve.map((p) => `${x(p.t).toFixed(1)},${y(p[k]).toFixed(1)}`).join(" ");
  const yTicks: number[] = [];
  for (let v = yMin; v <= yMax; v += 50) yTicks.push(v);
  const minuteStep = tMax > 900 ? 180 : 120;
  const xTicks: number[] = [];
  for (let t = 0; t <= tMax; t += minuteStep) xTicks.push(t);

  return (
    <View style={s.chartBox} wrap={false}>
      <Text style={s.sectionLabel}>ROAST CURVE</Text>
      <View style={{ position: "relative", width: W, height: H }}>
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <Rect x={pad.l} y={pad.t} width={W - pad.l - pad.r} height={H - pad.t - pad.b} fill="#FAFBFB" />
          {yTicks.map((v) => (
            <Line key={`y${v}`} x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke={C.rule} strokeWidth={0.5} />
          ))}
          {xTicks.map((t) => (
            <Line key={`x${t}`} x1={x(t)} x2={x(t)} y1={pad.t} y2={H - pad.b} stroke={C.rule} strokeWidth={0.5} />
          ))}
          <Polyline points={pts("et")} fill="none" stroke={C.teal} strokeWidth={1.4} />
          <Polyline points={pts("bt")} fill="none" stroke={C.amber} strokeWidth={1.8} />
        </Svg>
        {yTicks.map((v) => (
          <Text key={`yl${v}`} style={[s.footerText, { position: "absolute", left: 0, top: y(v) - 4, width: pad.l - 4, textAlign: "right" }]}>
            {v}
          </Text>
        ))}
        {xTicks.map((t) => (
          <Text key={`xl${t}`} style={[s.footerText, { position: "absolute", left: x(t) - 12, top: H - pad.b + 4, width: 24, textAlign: "center" }]}>
            {`${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}`}
          </Text>
        ))}
      </View>
      <View style={s.legendRow}>
        <View style={[s.legendSwatch, { backgroundColor: C.amber }]} />
        <Text style={s.legendText}>BT (bean temp, °C)</Text>
        <View style={[s.legendSwatch, { backgroundColor: C.teal }]} />
        <Text style={s.legendText}>ET (environment temp, °C)</Text>
      </View>
    </View>
  );
}

// ---------- document ----------
function MarkdownDoc({ title, subtitle, markdown, meta, curve, generated }: RenderMarkdownPdfInput & { generated: string }) {
  const tokens = marked.lexer(preprocessMath(markdown), { gfm: true });
  return (
    <Document title={clean(title)} author="BeanWater" creator="BeanWater" producer="BeanWater">
      <Page size="A4" style={s.page}>
        <View style={s.band}>
          <View style={s.bandRow}>
            <Text style={s.wordmark}>
              Bean<Text style={{ color: C.teal }}>Water</Text>
            </Text>
            <Text style={s.stamp}>{`GENERATED ${generated}`}</Text>
          </View>
          <Text style={s.docTitle}>{clean(title)}</Text>
          {subtitle ? <Text style={s.docSub}>{clean(subtitle)}</Text> : null}
        </View>

        <View style={s.body}>
          {meta?.length ? (
            <View wrap={false}>
              <Text style={s.sectionLabel}>KEY MILESTONES</Text>
              <View style={s.tiles}>
                {meta.map((m, i) => (
                  <View key={i} style={s.tile}>
                    <View style={[s.tileInner, i === meta.length - 1 ? { borderTopColor: C.amber } : {}]}>
                      <Text style={s.tileLabel}>{clean(m.label.toUpperCase())}</Text>
                      <Text style={s.tileValue}>{clean(m.value)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
          {curve && curve.length > 1 ? <CurveChart curve={curve} /> : null}
          {blocks(tokens)}
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>BeanWater · beanwater</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

/** Render markdown to a branded BeanWater PDF blob (client-side). */
export async function renderMarkdownPdf(input: RenderMarkdownPdfInput): Promise<Blob> {
  const generated = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";
  return pdf(<MarkdownDoc {...input} generated={generated} />).toBlob();
}
