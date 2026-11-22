import * as THREE from 'three';
import { imageOf, paintings } from '../lib/museum';

type Callbacks = {
  caption: (hover: number | null, centre: number) => void;
  select: (index: number) => void;
  lost: () => void;
};
export type GalleryPosition = { column: number; level: number };
const columns = Math.ceil(paintings.length / 3);
const rowAt = (index: number) => [0, 1, -1][Math.floor(index / columns)];
const rowIndex = (height: number) => (height > 0.5 ? 1 : height < -0.5 ? 2 : 0);
const spacing = (Math.PI * 2) / columns;
const radius = 10;
const rowGap = 2.7;
const clamp = THREE.MathUtils.clamp;
const damp = THREE.MathUtils.damp;

export function mountGallery(
  host: HTMLDivElement,
  initial: number,
  callback: Callbacks,
  saved?: GalleryPosition,
) {
  const render = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  render.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  render.setClearColor(0x151611, 0);
  const canvas = render.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);
  const world = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 75);
  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2(4, 4);
  const loader = new THREE.TextureLoader();
  let disposed = false;
  let target = clamp(saved?.column ?? initial % columns, 0, columns - 1),
    travel = target;
  let aimY = clamp(saved?.level ?? rowAt(initial), -1, 1),
    level = aimY;
  let lastCentre = -1,
    lastHover: number | null = null;
  let press: {
    id: number;
    x: number;
    y: number;
    lastX: number;
    time: number;
    target: number;
    level: number;
  } | null = null;
  let dragged = false,
    velocity = 0;
  let focus: number | null = null,
    focusTime = 0;
  let previousTime = 0,
    frame = 0,
    visible = true;
  const meshes = paintings.map((p, index) => {
    const aspect = p.width / p.height;
    const width = Math.min(3.75, 2.13 * aspect),
      height = width / aspect;
    const geo = new THREE.PlaneGeometry(width, height, 20, 8);
    const verts = geo.attributes.position;
    for (let i = 0; i < verts.count; i++) {
      const angle = verts.getX(i) / radius;
      verts.setXYZ(
        i,
        Math.sin(angle) * radius,
        verts.getY(i),
        (Math.cos(angle) - 1) * radius - 0.014 * verts.getY(i) ** 2,
      );
    }
    geo.computeBoundingSphere();
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const panel = new THREE.Mesh(geo, mat);
    panel.userData.index = index;
    panel.userData.emphasis = 0;
    world.add(panel);
    return panel;
  });
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render.setSize(width, height, false);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  const selectedPos = new THREE.Vector3();
  function tick(time: number) {
    frame = 0;
    if (disposed || !visible) return;
    const dt = Math.min((time - (previousTime || time)) / 1000, 0.05);
    previousTime = time;
    if (!press && focus === null) {
      target = clamp(target + velocity * dt, 0, columns - 1);
      velocity *= Math.exp(-6.5 * dt);
    }
    travel = damp(travel, target, 7.8, dt);
    level = damp(level, aimY, 8, dt);
    const overCanvas = Math.abs(pointer.x) <= 1 && Math.abs(pointer.y) <= 1;
    camera.position.set(
      damp(camera.position.x, overCanvas ? pointer.x * 0.18 : 0, 5, dt),
      damp(camera.position.y, overCanvas ? pointer.y * 0.14 : 0, 5, dt),
      damp(camera.position.z || 7.4, press && dragged ? 8.15 : 7.4, 6, dt),
    );
    camera.updateMatrixWorld();
    if (focus !== null) focusTime = Math.min(1, focusTime + dt / 0.55);
    const mix = 1 - Math.pow(1 - focusTime, 3);
    meshes.forEach((mesh, i) => {
      const row = rowAt(i);
      const angle = ((i % columns) - travel) * spacing + row * 0.065;
      const cos = Math.cos(angle),
        sin = Math.sin(angle);
      mesh.visible = cos > 0.18 || focus === i;
      if (!mesh.visible) return;
      if (!mesh.userData.requested) {
        mesh.userData.requested = true;
        loader.load(
          imageOf(paintings[i], true),
          (texture) => {
            if (disposed) {
              texture.dispose();
              return;
            }
            texture.colorSpace = THREE.SRGBColorSpace;
            mesh.material.map = texture;
            mesh.material.needsUpdate = true;
          },
          undefined,
          () => {
            if (!disposed) callback.lost();
          },
        );
      }
      const boost = damp(mesh.userData.emphasis, lastHover === i && !dragged ? 1 : 0, 10, dt);
      mesh.userData.emphasis = boost;
      mesh.rotation.y = angle;
      mesh.rotation.x = -row * 0.09;
      mesh.position.set(
        radius * sin,
        (row - level) * rowGap,
        radius * (cos - 1) - Math.abs(row) * 0.38 + boost * 0.32,
      );
      mesh.scale.setScalar(1 + boost * 0.045);
      const light =
        (lastHover !== null && lastHover !== i ? 0.69 : 1) * (0.63 + 0.37 * Math.max(0, cos));
      mesh.material.color.setScalar(
        damp(mesh.material.color.r, mesh.material.map ? light : 0.055, 9, dt),
      );
      if (focus === i) {
        selectedPos.set(0, 0, 2.8);
        mesh.position.lerp(selectedPos, mix);
        mesh.rotation.y = Math.atan2(sin, cos) * (1 - mix);
        mesh.rotation.x *= 1 - mix;
      } else if (focus !== null) mesh.material.color.multiplyScalar(1 - mix * 0.8);
    });
    world.updateMatrixWorld();
    ray.setFromCamera(pointer, camera);
    const hit =
      !press && focus === null && overCanvas
        ? ray.intersectObjects(meshes, false).find((h) => h.object.visible)
        : undefined;
    const hover = hit ? (hit.object.userData.index as number) : null;
    const centre = Math.min(paintings.length - 1, rowIndex(level) * columns + Math.round(travel));
    if (lastCentre !== centre || lastHover !== hover) {
      lastCentre = centre;
      lastHover = hover;
      callback.caption(hover, centre);
    }
    canvas.style.cursor = press ? 'grabbing' : hover !== null ? 'pointer' : 'grab';
    render.render(world, camera);
    if (focus !== null && focusTime >= 1) {
      callback.select(focus);
      return;
    }
    frame = requestAnimationFrame(tick);
  }
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !frame) {
      previousTime = 0;
      frame = requestAnimationFrame(tick);
    }
  });
  visibility.observe(host);
  function point(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      (2 * (e.clientX - rect.left)) / rect.width - 1,
      1 - (2 * (e.clientY - rect.top)) / rect.height,
    );
  }
  function down(e: PointerEvent) {
    if (focus !== null || e.button !== 0 || press) return;
    point(e);
    dragged = false;
    velocity = 0;
    press = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      lastX: e.clientX,
      time: e.timeStamp,
      target,
      level: aimY,
    };
    canvas.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent) {
    point(e);
    if (!press || e.pointerId !== press.id) return;
    const dx = e.clientX - press.x,
      dy = e.clientY - press.y;
    if (Math.hypot(dx, dy) < 5 && !dragged) return;
    dragged = true;
    const unit = canvas.clientWidth * 0.27;
    target = clamp(press.target - dx / unit, 0, columns - 1);
    aimY = clamp(press.level + dy / (canvas.clientHeight * 0.37), -1, 1);
    velocity = clamp(
      -(e.clientX - press.lastX) / unit / Math.max(0.012, (e.timeStamp - press.time) / 1000),
      -6,
      6,
    );
    press.lastX = e.clientX;
    press.time = e.timeStamp;
  }
  function open(index: number) {
    if (focus === null) {
      focus = index;
      velocity = 0;
    }
  }
  function up(e: PointerEvent) {
    if (!press || e.pointerId !== press.id) return;
    if (!dragged && e.type !== 'pointercancel') {
      point(e);
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(meshes, false).find((h) => h.object.visible);
      if (hit) open(hit.object.userData.index);
    }
    if (e.timeStamp - press.time > 110) velocity = 0;
    press = null;
    dragged = false;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  }
  function leave() {
    if (!press) pointer.set(4, 4);
  }
  function wheel(e: WheelEvent) {
    if (e.ctrlKey || focus !== null) return;
    const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    const step =
      raw * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? canvas.clientHeight : 1) * 0.0024;
    if ((target <= 0 && step < 0) || (target >= columns - 1 && step > 0)) return;
    e.preventDefault();
    velocity = 0;
    target = clamp(target + step, 0, columns - 1);
  }
  function contextLost(e: Event) {
    e.preventDefault();
    callback.lost();
  }
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', leave);
  canvas.addEventListener('wheel', wheel, { passive: false });
  return {
    position: (): GalleryPosition => ({ column: travel, level }),
    go(index: number) {
      velocity = 0;
      target = index % columns;
      aimY = rowAt(index);
      pointer.set(4, 4);
    },
    open,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('wheel', wheel);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      canvas.removeEventListener('pointerleave', leave);
      meshes.forEach((m) => {
        m.geometry.dispose();
        m.material.map?.dispose();
        m.material.dispose();
      });
      render.dispose();
      canvas.remove();
    },
  };
}
