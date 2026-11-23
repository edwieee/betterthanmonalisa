import * as THREE from 'three';
import { imageOf, rooms, type Painting } from './museum';

export type GalleryPosition = { x: number; y: number };
type Callbacks = {
  open: (index: number, position: GalleryPosition) => void;
  caption: (index: number | null) => void;
  ready: () => void;
  lost: () => void;
};

const vertexShader = `
  varying vec2 screen;
  void main() {
    screen = vec2(position.x, -position.y);
    gl_Position = vec4(position.xy, 0., 1.);
  }
`;

// The lens acts on the whole printed wall, including its type and column rules.
const fragmentShader = `
  uniform sampler2D atlas;
  uniform vec2 layoutSize, halfView, origin;
  uniform float count, zoom, bend;
  uniform vec2 activeCell;
  varying vec2 screen;
  void main() {
    float r2 = dot(screen, screen);
    vec2 wall = origin + screen * halfView * zoom / (1. + bend * r2);
    vec2 cell = floor(wall);
    float index = mod(cell.x + cell.y * layoutSize.x, count);
    vec2 tile = vec2(mod(index, layoutSize.x), floor(index / layoutSize.x));
    vec2 uv = (tile + clamp(fract(wall), .0015, .9985)) / layoutSize;
    vec4 print = texture2D(atlas, uv);
    vec3 paper = vec3(0.);
    if (all(equal(cell, activeCell))) {
      vec3 pigment = texture2D(atlas, (tile + vec2(.5)) / layoutSize).rgb;
      paper = mix(vec3(.13), pigment, .8);
    }
    vec3 ink = mix(paper, print.rgb, print.a);
    float shade = 1. - .84 * smoothstep(.28, 1.9, r2);
    gl_FragColor = vec4(ink * shade, 1.);
  }
`;

function fitLabel(ctx: CanvasRenderingContext2D, label: string, width: number) {
  if (ctx.measureText(label).width <= width) return label;
  let end = label.length;
  while (end && ctx.measureText(label.slice(0, end) + '…').width > width) end--;
  return label.slice(0, end).trimEnd() + '…';
}

function drawTile(ctx: CanvasRenderingContext2D, image: HTMLImageElement, work: Painting) {
  const fit = Math.min(370 / work.width, 370 / work.height);
  const w = work.width * fit,
    h = work.height * fit;
  ctx.drawImage(image, (512 - w) / 2, (512 - h) / 2, w, h);
  ctx.fillStyle = '#626262';
  ctx.fillRect(0, 0, 1.2, 512);
  ctx.fillStyle = '#eee';
  ctx.font = '500 18px Arial';
  ctx.fillText(fitLabel(ctx, work.artist, 208), 20, 35);
  ctx.textAlign = 'right';
  ctx.font = '14px monospace';
  ctx.fillText(fitLabel(ctx, work.title.toUpperCase(), 241), 492, 35);
  ctx.fillText(work.date.toUpperCase(), 492, 483, 95);
  ctx.textAlign = 'left';
  ctx.fillText(work.period.toUpperCase(), 20, 483, 110);
  const label = rooms[work.category][0].toUpperCase();
  const labelWidth = Math.min(230, ctx.measureText(label).width) + 24;
  ctx.fillStyle = '#252525';
  ctx.beginPath();
  ctx.roundRect(140, 463, labelWidth, 29, 15);
  ctx.fill();
  ctx.fillStyle = '#eee';
  ctx.fillText(label, 152, 483, 230);
}

export function mountGallery(
  host: HTMLDivElement,
  works: Painting[],
  start: GalleryPosition,
  callbacks: Callbacks,
) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' });
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);
  const columns = Math.ceil(Math.sqrt(works.length));
  const rows = Math.ceil(works.length / columns);
  const sheet = document.createElement('canvas');
  const size = Math.min(512, Math.floor(renderer.capabilities.maxTextureSize / columns));
  sheet.width = columns * size;
  sheet.height = rows * size;
  const ctx = sheet.getContext('2d')!;
  const texture = new THREE.CanvasTexture(sheet);
  texture.flipY = false;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  const origin = new THREE.Vector2(start.x, start.y);
  const view = new THREE.Vector2();
  const ambient = new THREE.Vector2(),
    cursor = new THREE.Vector2();
  const velocity = new THREE.Vector2();
  const uniforms = {
    atlas: { value: texture },
    layoutSize: { value: new THREE.Vector2(columns, rows) },
    halfView: { value: view },
    origin: { value: origin.clone() },
    count: { value: works.length },
    zoom: { value: 1 },
    bend: { value: 0 },
    activeCell: { value: new THREE.Vector2(1e9, 1e9) },
  };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(geometry, material));
  const camera = new THREE.Camera();
  let disposed = false,
    ready = false,
    frame = 0,
    previous = 0,
    cellSize = 1;
  let hover: number | null = null,
    pointing = false,
    keyboard = false;
  let press: {
    id: number;
    x: number;
    y: number;
    lastX: number;
    lastY: number;
    time: number;
    drag: boolean;
  } | null = null;

  function resize() {
    const { clientWidth: w, clientHeight: h } = host;
    cellSize = w <= 700 ? Math.max(162, Math.min(w * 0.6, h * 0.55)) : Math.min(w / 5, h / 2.7);
    view.set(w / (2 * cellSize), h / (2 * cellSize));
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.setSize(w, h, false);
    wake();
  }
  const cell = new THREE.Vector2();
  function indexAt(x: number, y: number) {
    const lens = uniforms.zoom.value / (1 + uniforms.bend.value * (x * x + y * y));
    const centre = uniforms.origin.value;
    const col = Math.floor(centre.x + x * view.x * lens);
    const row = Math.floor(centre.y + y * view.y * lens);
    cell.set(col, row);
    return THREE.MathUtils.euclideanModulo(col + row * columns, works.length);
  }
  function tick(time: number) {
    frame = 0;
    if (!ready || disposed || document.hidden) return;
    const dt = Math.min((time - previous) / 1000, 0.05);
    previous = time;
    if (!press) {
      origin.addScaledVector(velocity, dt);
      velocity.multiplyScalar(Math.exp(-6 * dt));
    }
    const blend = 1 - Math.exp(-8 * dt);
    ambient.lerp(cursor, blend);
    const zoom = press?.drag ? 1.18 : 1;
    uniforms.zoom.value += (zoom - uniforms.zoom.value) * blend;
    const bend = host.clientWidth <= 700 ? 0.012 : 0.22;
    uniforms.bend.value += (bend - uniforms.bend.value) * blend;
    uniforms.origin.value.copy(origin).addScaledVector(ambient, 0.075);
    const next = keyboard
      ? indexAt(0, 0)
      : pointing && !press?.drag
        ? indexAt(cursor.x, cursor.y)
        : null;
    if (next === null) uniforms.activeCell.value.set(1e9, 1e9);
    else uniforms.activeCell.value.copy(cell);
    renderer.render(scene, camera);
    if (next !== hover) {
      hover = next;
      callbacks.caption(next);
    }
    if (
      velocity.lengthSq() > 0.00001 ||
      ambient.distanceToSquared(cursor) > 0.00001 ||
      Math.abs(zoom - uniforms.zoom.value) > 0.0001 ||
      Math.abs(bend - uniforms.bend.value) > 0.0001
    )
      wake();
  }
  function wake() {
    if (ready && !disposed && !frame && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function point(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    cursor.set(
      ((e.clientX - rect.left) * 2) / rect.width - 1,
      ((e.clientY - rect.top) * 2) / rect.height - 1,
    );
    keyboard = false;
    pointing = e.pointerType !== 'touch';
  }
  function down(e: PointerEvent) {
    if (press || e.button !== 0) return;
    point(e);
    host.focus({ preventScroll: true });
    canvas.setPointerCapture(e.pointerId);
    press = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      time: e.timeStamp,
      drag: false,
    };
    velocity.set(0, 0);
    wake();
  }
  function move(e: PointerEvent) {
    if (press && e.pointerId !== press.id) return;
    point(e);
    if (press) {
      if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > 5) press.drag = true;
      if (press.drag) {
        const dx = (press.lastX - e.clientX) / cellSize,
          dy = (press.lastY - e.clientY) / cellSize;
        const dt = Math.max(0.008, (e.timeStamp - press.time) / 1000);
        origin.x += dx;
        origin.y += dy;
        velocity.set(THREE.MathUtils.clamp(dx / dt, -8, 8), THREE.MathUtils.clamp(dy / dt, -8, 8));
        canvas.style.cursor = 'grabbing';
      }
      press.lastX = e.clientX;
      press.lastY = e.clientY;
      press.time = e.timeStamp;
    }
    wake();
  }
  function end(e: PointerEvent) {
    if (!press || press.id !== e.pointerId) return;
    const tap = e.type === 'pointerup' && !press.drag;
    if (!press.drag || e.timeStamp - press.time > 90 || e.type !== 'pointerup') velocity.set(0, 0);
    press = null;
    canvas.style.cursor = '';
    if (tap) {
      point(e);
      callbacks.open(indexAt(cursor.x, cursor.y), { x: origin.x, y: origin.y });
    }
    if (!pointing) cursor.set(0, 0);
    wake();
  }
  function leave() {
    if (press) return;
    pointing = false;
    cursor.set(0, 0);
    wake();
  }
  function wheel(e: WheelEvent) {
    if (e.ctrlKey) return;
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? host.clientHeight : 1;
    origin.x += (e.deltaX * unit) / cellSize;
    origin.y += (e.deltaY * unit) / cellSize;
    velocity.set(0, 0);
    keyboard = false;
    wake();
  }
  function key(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      callbacks.open(indexAt(0, 0), { x: origin.x, y: origin.y });
      return;
    }
    const directions: Record<string, number[]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const direction = directions[e.key];
    if (!direction) return;
    e.preventDefault();
    origin.set(
      Math.floor(origin.x) + 0.5 + direction[0],
      Math.floor(origin.y) + 0.5 + direction[1],
    );
    velocity.set(0, 0);
    cursor.set(0, 0);
    ambient.set(0, 0);
    uniforms.origin.value.copy(origin);
    keyboard = true;
    hover = indexAt(0, 0);
    callbacks.caption(hover);
    wake();
  }
  const events = new AbortController();
  const options = { signal: events.signal };
  canvas.addEventListener('pointerdown', down, options);
  canvas.addEventListener('pointermove', move, options);
  canvas.addEventListener('pointerup', end, options);
  canvas.addEventListener('pointercancel', end, options);
  canvas.addEventListener('lostpointercapture', end, options);
  canvas.addEventListener('pointerleave', leave, options);
  canvas.addEventListener('wheel', wheel, { ...options, passive: false });
  canvas.addEventListener('webglcontextlost', callbacks.lost, options);
  host.addEventListener('keydown', key, options);
  document.addEventListener('visibilitychange', wake, options);
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  Promise.all(
    works.map(async (work, i) => {
      const image = new Image();
      image.src = imageOf(work, true);
      await image.decode();
      if (disposed) return;
      ctx.save();
      ctx.translate((i % columns) * size, Math.floor(i / columns) * size);
      ctx.scale(size / 512, size / 512);
      drawTile(ctx, image, work);
      ctx.restore();
    }),
  )
    .then(() => {
      if (disposed) return;
      texture.needsUpdate = true;
      ready = true;
      tick(performance.now());
      callbacks.ready();
    })
    .catch(() => {
      if (!disposed) callbacks.lost();
    });

  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    events.abort();
    observer.disconnect();
    texture.dispose();
    material.dispose();
    geometry.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    sheet.width = sheet.height = 0;
  };
}
