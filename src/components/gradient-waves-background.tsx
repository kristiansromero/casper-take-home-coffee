"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Mesh, Program, Renderer, Triangle } from "ogl";
import { hexToRgb, paletteForPath, type RoutePalette } from "@/lib/route-palette";

// Inspired by React Bits "Gradient Waves" (reactbits.dev/backgrounds/gradient-waves):
// layered, slowly flowing sine + noise bands blended across a 3-color palette.
// The palette follows the current route and cross-fades (~1s) without remounting.

const SPEED = 0.35;
const AMPLITUDE = 0.12;
const OPACITY = 0.5;
const TRANSITION_MS = 1000;
const STATIC_TIME = 12;

const VERT = /* glsl */ `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor0;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uAmplitude;
uniform float uOpacity;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// Soft wave band: fills below a flowing line with a feathered crest.
float wave(vec2 p, float freq, float speed, float offset, float phase, float width) {
  float t = uTime * speed;
  float y = offset
    + sin(p.x * freq + t + phase) * uAmplitude
    + sin(p.x * freq * 0.53 - t * 0.7 + phase * 1.7) * uAmplitude * 0.6
    + (noise(vec2(p.x * 1.5 + t * 0.3, phase)) - 0.5) * uAmplitude * 1.2;
  float d = p.y - y;
  return smoothstep(width, -width * 0.2, d) * smoothstep(-0.9, 0.0, d);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = vec2(uv.x * aspect, uv.y);

  float w1 = wave(p, 2.2, 0.9, 0.62, 0.0, 0.35);
  float w2 = wave(p, 3.1, 0.6, 0.45, 2.1, 0.30);
  float w3 = wave(p, 1.6, 0.45, 0.28, 4.3, 0.28);

  vec3 col = uColor0;
  col = mix(col, mix(uColor1, uColor2, smoothstep(0.0, 1.0, uv.x) * 0.35), w1 * 0.55);
  col = mix(col, mix(uColor1, uColor2, 0.5), w2 * 0.45);
  col = mix(col, uColor2, w3 * 0.35);

  float a = clamp(max(max(w1 * 0.7, w2 * 0.8), w3 * 0.9), 0.0, 1.0);
  a *= smoothstep(1.05, 0.35, uv.y); // keep the top of the page calm
  a *= uOpacity;

  gl_FragColor = vec4(col * a, a);
}
`;

type Rgb = [number, number, number];
const toRgb = (pal: RoutePalette): Rgb[] => pal.map(hexToRgb);

export function GradientWavesBackground() {
  const pathname = usePathname();
  const palette = paletteForPath(pathname);
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  // Shared between the route effect and the render loop (no remount on navigation).
  const targetRef = useRef<Rgb[]>(toRgb(palette));
  const kickRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    targetRef.current = toRgb(palette);
    kickRef.current?.();
  }, [palette]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const current: Rgb[] = targetRef.current.map((c) => [c[0], c[1], c[2]]);
    let renderer: Renderer;
    let program: Program;
    let mesh: Mesh;
    try {
      renderer = new Renderer({
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio || 1, 1.5),
      });
      const gl = renderer.gl;
      if (!gl) throw new Error("WebGL unavailable");
      gl.clearColor(0, 0, 0, 0);

      const geometry = new Triangle(gl);
      if (geometry.attributes.uv) delete geometry.attributes.uv;
      program = new Program(gl, {
        vertex: VERT,
        fragment: FRAG,
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: [1, 1] },
          uColor0: { value: current[0] },
          uColor1: { value: current[1] },
          uColor2: { value: current[2] },
          uAmplitude: { value: AMPLITUDE },
          uOpacity: { value: OPACITY },
        },
      });
      mesh = new Mesh(gl, { geometry, program });
    } catch {
      setWebglFailed(true);
      return;
    }

    const gl = renderer.gl;
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";
    container.appendChild(gl.canvas);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      renderer.setSize(container.offsetWidth, container.offsetHeight);
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
    };

    // Exponential approach: ~95% of the way to the target palette in TRANSITION_MS.
    const k = 3 / TRANSITION_MS;
    const stepColors = (dt: number): boolean => {
      const f = 1 - Math.exp(-k * dt);
      const target = targetRef.current;
      let moving = false;
      for (let i = 0; i < 3; i++) {
        for (let c = 0; c < 3; c++) {
          const d = target[i][c] - current[i][c];
          if (Math.abs(d) > 0.001) {
            current[i][c] += d * f;
            moving = true;
          } else {
            current[i][c] = target[i][c];
          }
        }
      }
      return moving;
    };

    const draw = (t: number) => {
      program.uniforms.uTime.value = t;
      renderer.render({ scene: mesh });
    };

    let frame = 0;
    let last = performance.now();

    if (reducedMotion) {
      // Single static frame; only the color cross-fade animates on route change.
      const fade = (now: number) => {
        const moving = stepColors(Math.min(now - last, 100));
        last = now;
        draw(STATIC_TIME);
        frame = moving ? requestAnimationFrame(fade) : 0;
      };
      kickRef.current = () => {
        if (frame) return;
        last = performance.now();
        frame = requestAnimationFrame(fade);
      };
    } else {
      const loop = (now: number) => {
        stepColors(Math.min(now - last, 100));
        last = now;
        draw((now * 0.001 * SPEED) % 10_000);
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
    }

    const onResize = () => {
      resize();
      if (reducedMotion) draw(STATIC_TIME);
    };
    window.addEventListener("resize", onResize);
    resize();
    if (reducedMotion) draw(STATIC_TIME);

    return () => {
      cancelAnimationFrame(frame);
      kickRef.current = null;
      window.removeEventListener("resize", onResize);
      gl.canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  const [base, mid, accent] = palette;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0E1113]">
      {webglFailed ? (
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 20% 100%, ${mid}aa, transparent 70%), radial-gradient(ellipse 70% 45% at 85% 90%, ${accent}66, transparent 70%), radial-gradient(ellipse 120% 60% at 50% 110%, ${base}, transparent 80%)`,
          }}
        />
      ) : (
        <div ref={containerRef} className="absolute inset-0" />
      )}
      {/* Vignette keeps cards legible */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(14,17,19,0.85)_100%)]" />
    </div>
  );
}
