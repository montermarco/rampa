"use client";

import { useEffect, useRef } from "react";
import { currentReveal, glassStore } from "@/lib/reveal-store";
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
// Imagen del proyecto actual, revelada por la luz (ver src/lib/reveal-store.ts).
uniform sampler2D u_image;
uniform float u_hasImage;
uniform vec4 u_rect;        // x, y, ancho, alto en píxeles del canvas (origen abajo-izquierda)
uniform float u_imgAspect;  // ancho / alto de la textura
uniform float u_imgScale;   // zoom interno
uniform float u_reveal;
uniform float u_envelope;

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
  float revealSum = 0.0;      // luz ancha y suave de todos los haces: revela la imagen

  for (int i = 0; i < BUNDLES; i++) {
    float fi = float(i);
    float h1 = hash(vec2(fi, 1.0));
    float h2 = hash(vec2(fi, 2.0));
    float h3 = hash(vec2(fi, 3.0));
    float dirSign = mod(fi, 2.0) < 1.0 ? 1.0 : -1.0;

    // Ángulo: reparto irregular alrededor del círculo, con una respiración lenta y
    // un giro leve ligado al scroll.
    float ang = fi * 0.79 + h1 * 0.9
      + sin(t * 0.06 + fi * 1.7) * 0.16
      + sin(u_scroll * (0.5 + 0.3 * h2) + fi) * 0.18 * dirSign;
    vec2 dir = vec2(cos(ang), sin(ang));
    vec2 nrm = vec2(-dir.y, dir.x);

    // Centro: deriva a lo largo de su normal con el tiempo y, sobre todo, con el
    // scroll. El vaivén es un seno con fase propia por haz: cada uno viaja a su
    // ritmo, cruza la pantalla y vuelve, sin salirse nunca aunque el scroll siga.
    vec2 c = vec2(h2 * aspect, h3)
      + nrm * (sin(t * 0.05 + fi * 2.3) * 0.11 + sin(t * 0.13 + fi * 0.7) * 0.03
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
    revealSum += exp(-d0 * d0 / (2.0 * 0.045 * 0.045));
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

  // Imagen del proyecto: dentro de su rectángulo, con ajuste tipo cover y bordes
  // suaves. Su opacidad es la luz que la toca (bandas de los haces y destellos) más
  // el revelado global que aporta el scroll; la envolvente la apaga por completo
  // fuera de su tramo.
  if (u_hasImage > 0.5) {
    vec2 uv = (gl_FragCoord.xy - u_rect.xy) / u_rect.zw;
    float rectAspect = u_rect.z / u_rect.w;
    vec2 cuv = uv - 0.5;
    if (u_imgAspect > rectAspect) cuv.x *= rectAspect / u_imgAspect;
    else cuv.y *= u_imgAspect / rectAspect;
    cuv /= u_imgScale;
    vec3 tex = texture2D(u_image, cuv + 0.5).rgb;

    float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    vec2 f = smoothstep(0.0, 0.08, uv) * smoothstep(0.0, 0.08, 1.0 - uv);
    float edge = f.x * f.y * inside;

    float light = smoothstep(0.0, 1.0, revealSum * 0.75 + bloom * 1.4 + flare);
    float alpha = clamp(u_reveal + light * (1.15 - u_reveal), 0.0, 1.0) * edge * u_envelope;
    // Mientras la revela la luz, la imagen toma un leve tinte iridiscente.
    tex = mix(tex * (0.85 + 0.3 * irid), tex, u_reveal);
    col = mix(col, tex, alpha);
  }

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

// Segunda pasada: la escena ya dibujada se ve a través de "RAMPA" en vidrio líquido.
// La forma llega como campo de distancia (SDF): d < 0 dentro de la letra, en píxeles.
// Con él se engrosa y redondea el glifo, se construye un perfil de lente en el borde
// (cuarto de círculo) y se obtienen normales lisas para refractar la escena.
const GLASS = /* glsl */ `
precision highp float;
uniform sampler2D u_scene;
uniform sampler2D u_sdf;
uniform vec2 u_resolution;
uniform vec2 u_mouse;     // en píxeles del canvas
uniform vec4 u_rect;      // x, y, ancho, alto en píxeles del canvas (origen abajo-izquierda)
uniform float u_range;    // distancia (px) que representa el extremo del SDF codificado
uniform float u_size;     // tamaño de la fuente en px
uniform float u_glass;
uniform float u_time;

vec3 iridescence(float a){ return 0.5 + 0.5 * cos(6.28318 * a + vec3(0.0, 2.2, 4.2)); }
float sdf(vec2 t){ return (texture2D(u_sdf, t).r * 2.0 - 1.0) * u_range; }

void main(){
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec3 scene = texture2D(u_scene, uv).rgb;
  vec2 tuv = (gl_FragCoord.xy - u_rect.xy) / u_rect.zw;
  if (u_glass < 0.001 || tuv.x < 0.0 || tuv.x > 1.0 || tuv.y < 0.0 || tuv.y > 1.0) {
    gl_FragColor = vec4(scene, 1.0);
    return;
  }
  vec2 texel = 1.0 / u_rect.zw;
  // Un leve engrosado redondea las esquinas.
  float d = sdf(tuv) - u_size * 0.02;
  float inside = 1.0 - smoothstep(-1.0, 1.0, d);
  if (inside < 0.001) {
    gl_FragColor = vec4(scene, 1.0);
    return;
  }

  // Perfil de lente: x = 0 en el borde, 1 a un radio r hacia dentro; altura h = cuarto
  // de círculo. Su pendiente es la inclinación de la normal.
  float r = u_size * 0.3;
  float x = clamp(-d / r, 0.0, 1.0);
  float c = 1.0 - x;
  float h = sqrt(max(1.0 - c * c, 0.0));
  float slope = min(c / max(h, 0.08), 5.0);

  // Gradiente sobre 3 texeles: suaviza la cuantización del SDF en 8 bits.
  vec2 e = texel * 3.0;
  vec2 g = vec2(sdf(tuv + vec2(e.x, 0.0)) - sdf(tuv - vec2(e.x, 0.0)),
                sdf(tuv + vec2(0.0, e.y)) - sdf(tuv - vec2(0.0, e.y)));
  g = normalize(g + vec2(1e-5, 0.0)); // hacia fuera de la letra
  vec3 N = normalize(vec3(g * slope * 0.55, 1.0));
  float strength = u_glass * inside;

  // Refracción: el borde grueso trae la escena de fuera hacia dentro, con dispersión.
  vec2 off = g * slope * u_size * 0.14 / u_resolution;
  vec3 refr = vec3(
    texture2D(u_scene, uv + off * 1.10).r,
    texture2D(u_scene, uv + off).g,
    texture2D(u_scene, uv + off * 0.90).b);

  float fres = pow(1.0 - N.z, 1.6);
  vec2 m = (u_mouse / u_resolution - 0.5) * 2.0;
  vec3 L1 = normalize(vec3(m.x * 0.8 - 0.4, m.y * 0.8 + 0.6, 0.5));
  vec3 L2 = normalize(vec3(0.6, -0.55, 0.55));
  float spec = pow(max(dot(N, L1), 0.0), 48.0) + 0.45 * pow(max(dot(N, L2), 0.0), 64.0);
  float ang = length(g) > 1e-5 ? atan(g.y, g.x) : 0.0;

  vec3 col = mix(scene, refr, strength);
  col = mix(col, vec3(1.0), 0.07 * strength);                       // cuerpo lechoso
  col -= vec3(0.14) * smoothstep(0.4, 1.0, fres) * strength;        // banda oscura del filo
  col += vec3(1.0) * pow(fres, 2.0) * 0.45 * strength;              // luz del contorno
  col += iridescence(ang / 6.28318 + u_time * 0.03) * fres * 0.10 * strength;
  col += vec3(1.0) * spec * (0.5 + fres) * 1.1 * strength;          // brillos
  gl_FragColor = vec4(col, 1.0);
}
`;

/** Umbral por debajo del cual se considera que el shader va lento (50 fps). */
const SLOW_FRAME_MS = 1000 / 50;

// Transformada de distancia euclidiana (Felzenszwalb & Huttenlocher), 1D sobre un
// arreglo de distancias al cuadrado; se aplica por columnas y luego por filas.
function edt1d(f: Float64Array, d: Float64Array, v: Int32Array, z: Float64Array, n: number) {
  let k = 0;
  v[0] = 0;
  z[0] = -Infinity;
  z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
}

/** Distancia al cuadrado, por píxel, hasta la celda más cercana con `inside` true. */
function edt2d(inside: Uint8Array, w: number, h: number, invert: boolean) {
  const INF = 1e20;
  const grid = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) grid[i] = (inside[i] === 1) !== invert ? 0 : INF;
  const n = Math.max(w, h);
  const f = new Float64Array(n), d = new Float64Array(n), z = new Float64Array(n + 1);
  const v = new Int32Array(n);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = grid[y * w + x];
    edt1d(f, d, v, z, h);
    for (let y = 0; y < h; y++) grid[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = grid[y * w + x];
    edt1d(f, d, v, z, w);
    for (let x = 0; x < w; x++) grid[y * w + x] = d[x];
  }
  return grid;
}

/**
 * Canvas fijo detrás de todo el inicio. Sus parámetros:
 * - el cursor y la velocidad de scroll (amortiguada con velocity *= 0.90) lo encienden;
 * - pasado el hero, la energía baja de forma progresiva al 35 % para no competir con
 *   las imágenes;
 * - si el sistema pide reducción de movimiento se dibuja un solo cuadro estático;
 * - si los cuadros tardan más de 20 ms de forma sostenida, el DPR baja a 1.
 * Además dibuja la portada del proyecto activo (revealStore) y el RAMPA de vidrio
 * líquido del hero (glassStore.anchor), ambos dentro del shader.
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
    const link = (fragment: string) => {
      const vs = compile(gl.VERTEX_SHADER, VERTEX);
      const fs = compile(gl.FRAGMENT_SHADER, fragment);
      if (!vs || !fs) return null;
      const prog = gl.createProgram()!;
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(prog));
        return null;
      }
      return prog;
    };
    const program = link(FRAGMENT);
    const glassProgram = link(GLASS);
    if (!program || !glassProgram) return;

    // Un solo triángulo que cubre la pantalla, compartido por las dos pasadas.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const useProgram = (prog: WebGLProgram) => {
      gl.useProgram(prog);
      const position = gl.getAttribLocation(prog, "a");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    };

    const makeTexture = () => {
      const texture = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return texture;
    };

    // Pasada 1 → textura de escena; pasada 2 la lleva a pantalla a través del vidrio.
    const sceneTexture = makeTexture();
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTexture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    useProgram(program);
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uScroll = gl.getUniformLocation(program, "u_scrollSpeed");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uEnergy = gl.getUniformLocation(program, "u_energy");
    const uScrollPos = gl.getUniformLocation(program, "u_scroll");
    const uImage = gl.getUniformLocation(program, "u_image");
    const uHasImage = gl.getUniformLocation(program, "u_hasImage");
    const uRect = gl.getUniformLocation(program, "u_rect");
    const uImgAspect = gl.getUniformLocation(program, "u_imgAspect");
    const uImgScale = gl.getUniformLocation(program, "u_imgScale");
    const uReveal = gl.getUniformLocation(program, "u_reveal");
    const uEnvelope = gl.getUniformLocation(program, "u_envelope");
    gl.uniform1i(uImage, 0);

    useProgram(glassProgram);
    const gScene = gl.getUniformLocation(glassProgram, "u_scene");
    const gSdf = gl.getUniformLocation(glassProgram, "u_sdf");
    const gResolution = gl.getUniformLocation(glassProgram, "u_resolution");
    const gRect = gl.getUniformLocation(glassProgram, "u_rect");
    const gRange = gl.getUniformLocation(glassProgram, "u_range");
    const gSize = gl.getUniformLocation(glassProgram, "u_size");
    const gGlass = gl.getUniformLocation(glassProgram, "u_glass");
    const gMouse = gl.getUniformLocation(glassProgram, "u_mouse");
    const gScrollPos = gl.getUniformLocation(glassProgram, "u_scroll");
    const gTime = gl.getUniformLocation(glassProgram, "u_time");
    gl.uniform1i(gScene, 0);
    gl.uniform1i(gSdf, 1);

    // Una textura por imagen de proyecto, subida la primera vez que se necesita.
    const textures = new WeakMap<HTMLImageElement, WebGLTexture>();
    const textureFor = (img: HTMLImageElement) => {
      if (!img.complete || !img.naturalWidth) return null;
      let texture = textures.get(img);
      if (!texture) {
        texture = makeTexture();
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        textures.set(img, texture);
      }
      return texture;
    };

    let maxDpr = 2;
    let dpr = 1;

    // SDF del texto de vidrio. El texto se dibuja en un canvas 2D con la fuente que
    // el elemento ancla ya tiene cargada, se binariza y se calcula la distancia con
    // signo a su contorno; se codifica en 8 bits alrededor de ±range píxeles.
    const sdfTexture = makeTexture();
    let sdfReady = false;
    let sdfRange = 1;
    let sdfSize = 1;
    let sdfKey = "";
    const buildSdf = () => {
      const anchor = glassStore.anchor;
      if (!anchor) return;
      const style = getComputedStyle(anchor);
      const size = parseFloat(style.fontSize) * dpr;
      const rect = anchor.getBoundingClientRect();
      const w = Math.ceil(rect.width * dpr);
      const h = Math.ceil(rect.height * dpr);
      const key = `${w}x${h}@${size}`;
      if (!w || !h || key === sdfKey) return;
      // Solo la primera familia: con la lista completa (fallbacks locales) check() falla.
      const family = style.fontFamily.split(",")[0];
      if (!document.fonts.check(`${style.fontWeight} ${style.fontSize} ${family}`)) return;
      sdfKey = key;

      const c2d = document.createElement("canvas");
      c2d.width = w;
      c2d.height = h;
      const ctx = c2d.getContext("2d")!;
      ctx.font = `${style.fontWeight} ${size}px ${family}`;
      if ("letterSpacing" in ctx) {
        (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
          `${parseFloat(style.letterSpacing) * dpr || 0}px`;
      }
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.fillText(anchor.textContent ?? "", w / 2, h / 2);
      const pixels = ctx.getImageData(0, 0, w, h).data;
      const inside = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) inside[i] = pixels[i * 4 + 3] > 127 ? 1 : 0;

      const outside = edt2d(inside, w, h, false);
      const inner = edt2d(inside, w, h, true);
      sdfRange = size * 0.25;
      sdfSize = size;
      const encoded = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) {
        const d = Math.sqrt(outside[i]) - Math.sqrt(inner[i]);
        encoded[i] = Math.round(Math.min(Math.max(d / sdfRange * 0.5 + 0.5, 0), 1) * 255);
      }
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, sdfTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, w, h, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, encoded);
      gl.activeTexture(gl.TEXTURE0);
      sdfReady = true;
    };

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
      gl.useProgram(program);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.useProgram(glassProgram);
      gl.uniform2f(gResolution, canvas.width, canvas.height);
      gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, canvas.width, canvas.height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
      sdfKey = "";
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

    // Sube al shader la pieza que toca dibujar, si hay una y su imagen ya cargó.
    const bindReveal = () => {
      const item = currentReveal();
      const texture = item && textureFor(item.img);
      if (!item || !texture) {
        // La unidad 0 no puede quedarse con la textura de escena: es el destino de
        // esta pasada y WebGL descartaría el dibujo por retroalimentación.
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.uniform1f(uHasImage, 0);
        return;
      }
      const r = item.el.getBoundingClientRect();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1f(uHasImage, 1);
      gl.uniform4f(uRect, r.left * dpr, canvas.height - r.bottom * dpr, r.width * dpr, r.height * dpr);
      gl.uniform1f(uImgAspect, item.img.naturalWidth / item.img.naturalHeight);
      gl.uniform1f(uImgScale, item.scale);
      gl.uniform1f(uReveal, item.reveal);
      gl.uniform1f(uEnvelope, item.envelope);
    };

    const draw = (time: number) => {
      // Pasada 1: hilos, destellos e imagen del proyecto, a la textura de escena.
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform2f(uMouse, mouse[0], mouse[1]);
      gl.uniform1f(uScroll, still ? 0 : smoothVel);
      gl.uniform1f(uTime, still ? 8 : time);
      gl.uniform1f(uEnergy, energy);
      gl.uniform1f(uScrollPos, scrollPos);
      bindReveal();
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Pasada 2: la escena a pantalla, refractada por el RAMPA de vidrio. Su
      // rectángulo es el del elemento ancla, así que se desplaza con la página.
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      useProgram(glassProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, sdfTexture);
      const anchor = glassStore.anchor;
      let glass = 0;
      if (anchor) {
        if (!sdfReady || !sdfKey) buildSdf();
        const r = anchor.getBoundingClientRect();
        const onScreen = r.bottom > 0 && r.top < window.innerHeight;
        glass = sdfReady && onScreen ? 1 : 0;
        // Flota: vaivén lento y una inclinación mínima hacia el cursor.
        const bob = still ? 0 : Math.sin(time * 0.6) * 5 * dpr;
        const px = (mouse[0] - canvas.width * 0.5) * 0.01;
        const py = (mouse[1] - canvas.height * 0.5) * 0.01;
        gl.uniform4f(gRect, r.left * dpr + px, canvas.height - r.bottom * dpr + bob + py, r.width * dpr, r.height * dpr);
      }
      gl.uniform1f(gGlass, glass);
      gl.uniform2f(gMouse, mouse[0], mouse[1]);
      gl.uniform1f(gScrollPos, scrollPos);
      gl.uniform1f(gRange, sdfRange);
      gl.uniform1f(gSize, sdfSize);
      gl.uniform1f(gTime, still ? 8 : time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.activeTexture(gl.TEXTURE0);
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

    // La fuente del ancla puede llegar después del primer cuadro: se reintenta.
    document.fonts?.ready.then(() => {
      sdfKey = "";
      if (still) draw(8);
    });

    if (still) {
      scrollPos = targetScrollPos;
      draw(8);
    } else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      // No se fuerza la pérdida del contexto: en desarrollo React monta el efecto dos
      // veces sobre el mismo canvas y un contexto perdido ya no compila shaders.
    };
  }, []);

  return <canvas ref={ref} className={styles.canvas} aria-hidden="true" />;
}
