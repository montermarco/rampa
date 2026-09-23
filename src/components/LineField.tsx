"use client";

import { useEffect, useRef } from "react";
import styles from "./LineField.module.css";

// Shader del hero. Parte de reference/hero-shader.html (núcleo nítido + halo
// iridiscente, cruces blancos, destellos, grano) pero en vez de rectas fijas dibuja
// haces de hilos finos que se abren en abanico y se desplazan con el scroll.

const VERTEX = "attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }";

const FRAGMENT = /* glsl */ `
precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_scrollSpeed;
uniform float u_scroll;
uniform float u_time;
uniform float u_energy;

const int BUNDLES = 8;
const int STRANDS = 9;

vec3 iridescence(float angle, float thickness){
  float delta = angle * 6.28318 + thickness * 8.0;
  return 0.5 + 0.5 * cos(delta + vec3(0.0, 2.2, 4.2));
}

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

// distancia con signo de p a la recta que pasa por c con dirección dir (unitaria)
float lineDist(vec2 p, vec2 c, vec2 dir){
  vec2 d = p - c;
  return d.x * dir.y - d.y * dir.x;
}

void main(){
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = vec2(st.x * aspect, st.y);
  vec2 mouse = u_mouse / u_resolution.xy;
  mouse.x *= aspect;
  float t = u_time;
  float sp = clamp(abs(u_scrollSpeed), 0.0, 1.0);

  float core = 0.0;    // núcleo nítido de los hilos
  float glow = 0.0;    // halo suave
  float angleAcc = 0.0;
  float bundleEnv[BUNDLES];   // envolvente estrecha del haz (destello en estrella)
  float bundleWide[BUNDLES];  // envolvente ancha (resplandor iridiscente)

  for (int i = 0; i < BUNDLES; i++) {
    float fi = float(i);
    float h1 = hash(vec2(fi, 1.0));
    float h2 = hash(vec2(fi, 2.0));
    float h3 = hash(vec2(fi, 3.0));
    float dirSign = mod(fi, 2.0) < 1.0 ? 1.0 : -1.0;

    // Ángulo: reparto irregular alrededor del círculo, con una respiración lenta y
    // un giro leve ligado al scroll.
    float ang = fi * 0.79 + h1 * 0.9
      + sin(t * 0.07 + fi * 1.7) * 0.10
      + sin(u_scroll * (0.5 + 0.3 * h2) + fi) * 0.18 * dirSign;
    vec2 dir = vec2(cos(ang), sin(ang));
    vec2 nrm = vec2(-dir.y, dir.x);

    // Centro: deriva a lo largo de su normal con el tiempo y, sobre todo, con el
    // scroll. El vaivén es un seno con fase propia por haz: cada uno viaja a su
    // ritmo, cruza la pantalla y vuelve, sin salirse nunca aunque el scroll siga.
    vec2 c = vec2(h2 * aspect, h3)
      + nrm * (sin(t * 0.09 + fi * 2.3) * 0.05
      + sin(u_scroll * (0.7 + 0.5 * h1) + fi * 1.9) * (0.28 + 0.2 * h3) * dirSign);

    float d0 = lineDist(p, c, dir);
    float along = dot(p - c, dir);
    float bg = 0.0;

    // Hilos del haz: separación desigual que se abre en abanico a lo largo de la recta.
    for (int k = 0; k < STRANDS; k++) {
      float fk = float(k) - float(STRANDS - 1) * 0.5;
      float spacing = 0.0016 + 0.0016 * hash(vec2(fi, fk + 10.0));
      float off = fk * spacing * (1.0 + along * 1.1 * dirSign)
        + sin(t * 0.25 + fk * 1.3 + fi) * 0.0004;
      float d = abs(d0 - off);
      float w = 0.00035 + 0.00025 * hash(vec2(fk, fi));
      core += smoothstep(w, w * 0.2, d) * (0.6 + 0.4 * hash(vec2(fi + 3.0, fk)));
      float ww = w * 5.0;
      float g = ww / (d + ww);
      bg += g * g * g;
    }
    bundleEnv[i] = exp(-d0 * d0 / (2.0 * 0.005 * 0.005));
    bundleWide[i] = exp(-d0 * d0 / (2.0 * 0.022 * 0.022));
    glow += bg;
    angleAcc += ang * bg;
  }

  // Cruces entre haces: la suma de productos forma una estrella en cada intersección
  // (los halos de los dos haces se prolongan a lo largo de sus rectas).
  float cross = 0.0;
  float bloom = 0.0;
  for (int i = 0; i < BUNDLES; i++) {
    for (int j = 0; j < BUNDLES; j++) {
      if (j > i) {
        cross += bundleEnv[i] * bundleEnv[j];
        bloom += bundleWide[i] * bundleWide[j];
      }
    }
  }
  float flare = smoothstep(0.05, 0.7, cross);
  float flareCore = smoothstep(0.45, 1.0, cross);
  bloom = min(bloom, 1.0);

  float ang = angleAcc / max(glow, 0.001);
  float distToMouse = distance(p, mouse);
  float mouseGlow = smoothstep(0.42, 0.0, distToMouse);

  // color iridiscente: ángulo dominante, posición respecto al cursor y tiempo
  float colorAngle = ang * 0.5 + dot(p - mouse, vec2(1.0, 0.6)) * 1.6 + t * 0.06;
  vec3 irid = iridescence(colorAngle, distToMouse + sp * 0.6);

  // energía: reposo tenue, se enciende con cursor y scroll
  float energy = (0.38 + mouseGlow * 0.9 + sp * 0.8) * u_energy;

  vec3 bg = vec3(0.957, 0.957, 0.949);
  vec3 col = bg;

  // halo de color alrededor de cada hilo
  col += irid * glow * 0.05 * energy;
  // núcleo plateado del hilo
  col += vec3(0.85) * min(core, 1.0) * (0.16 + 0.34 * energy) * u_energy;
  // destellos en los cruces: resplandor iridiscente suave, estrella y centro blanco
  col += irid * bloom * 0.16 * (0.5 + energy) * u_energy;
  col += (irid * 0.6 + 0.4) * flare * (0.5 + 0.9 * energy) * u_energy;
  col += vec3(1.0) * flareCore * (0.6 + 0.6 * energy) * u_energy;
  // chispas de lente en los cruces cuando hay movimiento
  float sparkle = pow(hash(floor(st * u_resolution.xy / 3.0) + floor(t * 14.0)), 9.0);
  col += irid * sparkle * flare * (mouseGlow * 2.0 + sp * 5.0) * u_energy;
  // flash global breve al girar la rueda
  col += irid * glow * sp * sp * 0.12 * u_energy;

  // grano de lienzo
  float grain = hash(gl_FragCoord.xy + fract(t) * 21.0);
  col += (grain - 0.5) * 0.014;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

/** Umbral por debajo del cual se considera que el shader va lento (50 fps). */
const SLOW_FRAME_MS = 1000 / 50;

/**
 * Canvas fijo detrás de todo el inicio. Sus parámetros:
 * - el cursor y la velocidad de scroll (amortiguada con velocity *= 0.90) lo encienden;
 * - pasado el hero, la energía baja de forma progresiva al 35 % para no competir con
 *   las imágenes;
 * - si el sistema pide reducción de movimiento se dibuja un solo cuadro estático;
 * - si los cuadros tardan más de 20 ms de forma sostenida, el DPR baja a 1.
 */
export default function LineField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!gl || gl.isContextLost()) return;

    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    };
    const vs = compile(gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vs || !fs) return;
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // Un solo triángulo que cubre la pantalla.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uScroll = gl.getUniformLocation(program, "u_scrollSpeed");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uEnergy = gl.getUniformLocation(program, "u_energy");
    const uScrollPos = gl.getUniformLocation(program, "u_scroll");

    let maxDpr = 2;
    let dpr = 1;
    const mouse = [0, 0];
    const targetMouse = [0, 0];
    let lastScroll = window.scrollY;
    let velocity = 0;
    let smoothVel = 0;
    let energy = 1;
    // Posición de scroll en pantallas, suavizada: mueve los haces.
    let scrollPos = 0;
    let targetScrollPos = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      targetMouse[0] = canvas.width * 0.5;
      targetMouse[1] = canvas.height * 0.55;
    };
    resize();
    mouse[0] = targetMouse[0];
    mouse[1] = targetMouse[1];

    const onPointerMove = (event: PointerEvent) => {
      targetMouse[0] = event.clientX * dpr;
      targetMouse[1] = (window.innerHeight - event.clientY) * dpr;
    };
    const onScroll = () => {
      const y = window.scrollY;
      velocity += (y - lastScroll) / window.innerHeight;
      lastScroll = y;
      targetScrollPos = y / window.innerHeight;
      // De 1 a 0.35 entre el 60 % y el 140 % de la altura de pantalla.
      const fade = Math.min(Math.max((y - window.innerHeight * 0.6) / (window.innerHeight * 0.8), 0), 1);
      energy = 1 - fade * 0.65;
    };
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = (time: number) => {
      gl.uniform2f(uMouse, mouse[0], mouse[1]);
      gl.uniform1f(uScroll, still ? 0 : smoothVel);
      gl.uniform1f(uTime, still ? 8 : time);
      gl.uniform1f(uEnergy, energy);
      gl.uniform1f(uScrollPos, scrollPos);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    let raf = 0;
    let lastFrame = 0;
    let slowFrames = 0;
    const frame = (ms: number) => {
      mouse[0] += (targetMouse[0] - mouse[0]) * 0.06;
      mouse[1] += (targetMouse[1] - mouse[1]) * 0.06;
      velocity *= 0.9;
      smoothVel += (Math.abs(velocity) * 3.2 - smoothVel) * 0.2;
      scrollPos += (targetScrollPos - scrollPos) * 0.08;
      draw(ms * 0.001);

      // Vigilancia de rendimiento: dos segundos seguidos por debajo de 50 fps bajan el DPR.
      if (maxDpr > 1 && lastFrame) {
        slowFrames = ms - lastFrame > SLOW_FRAME_MS ? slowFrames + 1 : 0;
        if (slowFrames > 100) {
          maxDpr = 1;
          resize();
        }
      }
      lastFrame = ms;
      raf = requestAnimationFrame(frame);
    };

    if (still) {
      scrollPos = targetScrollPos;
      draw(8);
    }
    else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      // No se fuerza la pérdida del contexto: en desarrollo React monta el efecto dos
      // veces sobre el mismo canvas y un contexto perdido ya no compila shaders.
      // El canvas se libera junto con el componente.
    };
  }, []);

  return <canvas ref={ref} className={styles.canvas} aria-hidden="true" />;
}
