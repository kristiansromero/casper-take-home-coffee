"use client";

import { useEffect, useRef } from "react";
import { Color, Mesh, Program, Renderer, Triangle } from "ogl";

// Adapted from React Bits "Aurora" (reactbits.dev/backgrounds/aurora): simplex-noise
// aurora bands blended across a three-stop color ramp, drawn on a transparent canvas.

const COLOR_STOPS = ["#0E1113", "#47918F", "#1d3d3c"];
const AMPLITUDE = 0.8;
const BLEND = 0.5;
const SPEED = 0.6;

const VERT = /* glsl */ `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec3 colorRamp(float t) {
  if (t < 0.5) return mix(uColorStops[0], uColorStops[1], t / 0.5);
  return mix(uColorStops[1], uColorStops[2], (t - 0.5) / 0.5);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec3 rampColor = colorRamp(uv.x);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float alpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  vec3 color = intensity * rampColor;

  // Keep it ambient: cap the band's opacity so content stays legible.
  alpha *= 0.55;
  fragColor = vec4(color * alpha, alpha);
}
`;

export function AuroraBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer;
    let program: Program;
    let mesh: Mesh;
    try {
      renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: false, dpr: Math.min(window.devicePixelRatio, 1.5) });
      const gl = renderer.gl;
      if (!gl) return;
      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      const geometry = new Triangle(gl);
      if (geometry.attributes.uv) delete geometry.attributes.uv;

      program = new Program(gl, {
        vertex: VERT,
        fragment: FRAG,
        uniforms: {
          uTime: { value: 0 },
          uAmplitude: { value: AMPLITUDE },
          uColorStops: { value: COLOR_STOPS.map((hex) => { const c = new Color(hex); return [c.r, c.g, c.b]; }) },
          uResolution: { value: [container.offsetWidth, container.offsetHeight] },
          uBlend: { value: BLEND },
        },
      });
      mesh = new Mesh(gl, { geometry, program });
    } catch {
      // WebGL (or WebGL2) unavailable: the CSS gradient fallback below remains visible.
      return;
    }

    const gl = renderer.gl;
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    container.appendChild(gl.canvas);

    const resize = () => {
      const { offsetWidth: w, offsetHeight: h } = container;
      renderer.setSize(w, h);
      program.uniforms.uResolution.value = [w, h];
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const draw = (t: number) => {
      program.uniforms.uTime.value = (t * 0.001 * SPEED) % 10_000;
      renderer.render({ scene: mesh });
    };
    const loop = (t: number) => {
      draw(t);
      frame = requestAnimationFrame(loop);
    };

    const onResize = () => {
      resize();
      if (reducedMotion) draw(4_000);
    };
    window.addEventListener("resize", onResize);
    resize();
    if (reducedMotion) draw(4_000);
    else frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      gl.canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Static fallback glow (also visible under the canvas before the first frame) */}
      <div className="absolute inset-x-0 top-0 h-[50vh] bg-[radial-gradient(ellipse_at_top,rgba(71,145,143,0.12),transparent_70%)]" />
      <div ref={containerRef} className="absolute inset-0" />
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(14,17,19,0.85)_100%)]" />
    </div>
  );
}
