/**
 * Shaders GLSL maison KDB_OS.
 * Pas de dépendance externe : bruit value-noise + fbm inline.
 */

const NOISE = /* glsl */ `
  vec3 hash3(vec3 p){
    p = vec3(dot(p,vec3(127.1,311.7,74.7)),
             dot(p,vec3(269.5,183.3,246.1)),
             dot(p,vec3(113.5,271.9,124.6)));
    return fract(sin(p)*43758.5453123)*2.0-1.0;
  }
  float vnoise(vec3 x){
    vec3 i = floor(x);
    vec3 f = fract(x);
    vec3 u = f*f*(3.0-2.0*f);
    float n = 0.0;
    for(int dx=0; dx<=1; dx++)
    for(int dy=0; dy<=1; dy++)
    for(int dz=0; dz<=1; dz++){
      vec3 g = vec3(float(dx),float(dy),float(dz));
      vec3 o = hash3(i+g);
      n += (1.0 - length(o)*0.0 + dot(o, f-g)) // pseudo gradient
           * (u.x*g.x + (1.0-u.x)*(1.0-g.x))
           * (u.y*g.y + (1.0-u.y)*(1.0-g.y))
           * (u.z*g.z + (1.0-u.z)*(1.0-g.z));
    }
    return n*0.5+0.5;
  }
  float fbm(vec3 p){
    float a = 0.5;
    float v = 0.0;
    for(int i=0;i<5;i++){
      v += a*vnoise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }
`

// --- Le vide (plan de fond plein écran) -----------------------------------

export const voidVertex = /* glsl */ `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0); // fullscreen triangle/plane
  }
`

export const voidFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uAudio;
  uniform float uScroll;
  uniform vec2  uPointer;
  uniform vec2  uRes;
  uniform vec3  uAccent;
  ${NOISE}

  void main(){
    vec2 uv = vUv;
    vec2 p = (uv - 0.5);
    p.x *= uRes.x / max(uRes.y, 1.0);

    // Nébuleuse lente qui descend avec le scroll
    vec3 q = vec3(p * 2.2, uTime * 0.04 + uScroll * 2.5);
    float n = fbm(q + fbm(q * 0.5 + uTime * 0.02));
    n = pow(n, 3.6); // crush des noirs poussé fort

    // Fond quasi-noir + voile teal SOMBRE (désaturé) dans les creux de bruit.
    // L'accent #00ff9d pur est réservé au halo curseur (le point le + lumineux).
    vec3 bgAccent = mix(uAccent, vec3(0.0, 0.18, 0.14), 0.55);
    vec3 col = vec3(0.01, 0.015, 0.013);
    col += bgAccent * n * (0.045 + uAudio * 0.09);

    // Halo qui suit le pointeur (la "présence") — accent pur, élément le + clair
    vec2 ptr = uPointer * vec2(uRes.x / max(uRes.y,1.0), 1.0) * 0.5;
    float d = length(p - ptr);
    float halo = smoothstep(0.95, 0.0, d);
    col += uAccent * halo * (0.12 + uAudio * 0.18);

    // Scanline fine + vignette
    col *= 0.95 + 0.05 * sin(uv.y * uRes.y * 1.4 + uTime * 2.0);
    float vig = smoothstep(1.3, 0.25, length(p));
    col *= vig;

    gl_FragColor = vec4(col, 1.0);
  }
`

// --- Particules (champ audio-réactif, attiré par le pointeur) --------------

export const particlesVertex = /* glsl */ `
  precision highp float;
  attribute float aSeed;
  uniform float uTime;
  uniform float uAudio;
  uniform vec3  uBands;
  uniform vec3  uPointer;   // position monde de la lumière-curseur
  uniform float uScroll;
  uniform float uSize;
  varying float vGlow;
  varying float vSeed;
  ${NOISE}

  void main(){
    vSeed = aSeed;
    vec3 pos = position;

    // Drift organique (curl approximé via gradient de fbm)
    float t = uTime * 0.12 + aSeed * 6.2831;
    vec3 np = pos * 0.25 + vec3(0.0, 0.0, t);
    float f = fbm(np);
    vec3 flow = vec3(
      fbm(np + vec3(1.7, 0.0, 0.0)) - f,
      fbm(np + vec3(0.0, 1.7, 0.0)) - f,
      fbm(np + vec3(0.0, 0.0, 1.7)) - f
    );
    pos += flow * (1.4 + uBands.x * 2.2);

    // Respiration audio (les graves repoussent le nuage)
    pos *= 1.0 + uAudio * 0.16;

    // Légère attirance vers la lumière-curseur
    vec3 toCursor = uPointer - pos;
    float cd = length(toCursor);
    pos += normalize(toCursor + 1e-4) * smoothstep(6.0, 0.0, cd) * (0.5 + uBands.z);

    // Descente avec le scroll
    pos.y += uScroll * 2.0;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float size = uSize * (0.5 + aSeed) * (1.0 + uBands.z * 1.5);
    gl_PointSize = size * (300.0 / -mv.z);

    vGlow = smoothstep(6.0, 0.0, cd) + uBands.z * 0.6;
  }
`

export const particlesFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vGlow;
  varying float vSeed;

  void main(){
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if(d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, d);
    vec3 col = mix(uColorB, uColorA, clamp(vGlow, 0.0, 1.0));
    col += vGlow * 0.3;
    gl_FragColor = vec4(col, alpha * (0.12 + vGlow * 0.40));
  }
`
