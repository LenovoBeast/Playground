// A single lightweight WebGL accent used behind the Contact section.
//
// Deliberately dependency-free and small: the page already runs the full-page
// three.js constellation plus per-game canvases, so this stays a raw WebGL1
// context on a small canvas (DPR capped, pixels capped) that is created only
// while the section is near the viewport and destroyed when it leaves.
//
// Everything degrades quietly: no WebGL (or a context loss) simply leaves the
// static aurora layers underneath doing the work.

const VERT = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

// Two octaves of value noise over an animated domain, ramped between the site's
// cobalt and indigo so the accent belongs to the same palette as everything else.
const FRAG = `
precision mediump float;

uniform vec2 uRes;
uniform float uTime;
uniform float uIntensity;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv * vec2(uRes.x / uRes.y, 1.0) * 2.1;
  float t = uTime * 0.05;

  float n = noise(p + vec2(t, -t * 0.7)) * 0.62
          + noise(p * 2.1 + vec2(-t * 1.3, t)) * 0.38;

  vec3 cobalt = vec3(0.231, 0.510, 0.965);
  vec3 indigo = vec3(0.310, 0.275, 0.898);
  vec3 col = mix(cobalt, indigo, smoothstep(0.25, 0.85, n));

  // Fade at the edges so it reads as light in the room, not as a panel.
  // Every smoothstep uses ascending edges: reversed edges are undefined in
  // GLSL and this driver resolves them to 0, which silently erased the glow.
  float vign = smoothstep(0.0, 0.30, uv.y) * (1.0 - smoothstep(0.45, 1.0, uv.y))
             * smoothstep(0.0, 0.18, uv.x) * (1.0 - smoothstep(0.82, 1.0, uv.x));

  float alpha = n * n * vign * uIntensity;
  gl_FragColor = vec4(col, alpha);
}
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    throw new Error(gl.getShaderInfoLog(shader) || 'shader compile failed');
  }
  return shader;
}

export function createShaderAccent(canvas, { reducedMotion = false } = {}) {
  const gl =
    canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: 'low-power',
    }) || null;

  if (!gl) return { ok: false, start() {}, stop() {}, resize() {}, dispose() {} };

  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || 'program link failed');
    }
  } catch (err) {
    console.warn('[shaderAccent] unavailable', err);
    return { ok: false, start() {}, stop() {}, resize() {}, dispose() {} };
  }

  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, 'uRes');
  const uTime = gl.getUniformLocation(program, 'uTime');
  const uIntensity = gl.getUniformLocation(program, 'uIntensity');

  // No blending: one fullscreen triangle is drawn over a cleared buffer, so the
  // fragment can write straight colour + alpha directly. Blending here would
  // write premultiplied rgb *and* square the alpha, and the compositor (with
  // premultipliedAlpha: false) would multiply by that squared alpha again —
  // which rounds a soft glow down to nothing.
  gl.disable(gl.BLEND);
  gl.clearColor(0, 0, 0, 0);

  let raf = 0;
  let running = false;
  let startTime = 0;
  let disposed = false;
  let contextLost = false;

  const draw = (elapsed) => {
    if (contextLost || gl.isContextLost()) return;
    const w = canvas.width;
    const h = canvas.height;
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uRes, w, h);
    gl.uniform1f(uTime, elapsed);
    gl.uniform1f(uIntensity, 0.9);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = (now) => {
    if (!running || disposed || contextLost) return;
    if (!startTime) startTime = now;
    draw((now - startTime) / 1000);
    raf = requestAnimationFrame(frame);
  };

  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else if (running) {
      startTime = 0;
      raf = requestAnimationFrame(frame);
    }
  };

  const onContextLost = (e) => {
    e.preventDefault();
    contextLost = true;
    stop();
  };

  function resize() {
    // Capped DPR and a capped pixel budget: this is a soft glow, it does not
    // need retina resolution, and the frame budget belongs to the games.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    const scale = Math.min(1, 900 / Math.max(w, 1));
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
  }

  function start() {
    if (running || disposed) return;
    running = true;
    startTime = 0;
    document.addEventListener('visibilitychange', onVisibility);
    canvas.addEventListener('webglcontextlost', onContextLost, false);
    if (reducedMotion) {
      // One static frame: present, but perfectly still.
      draw(0);
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.removeEventListener('webglcontextlost', onContextLost);
  }

  function dispose() {
    if (disposed) return;
    stop();
    disposed = true;
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    const lose = gl.getExtension('WEBGL_lose_context');
    lose?.loseContext();
  }

  return { ok: true, start, stop, resize, dispose };
}
