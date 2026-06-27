import * as THREE from 'three';

export function initHero3D(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // ── Renderer ──────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // ── Scene / Camera ────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.z = 3.2;

  // ── Colors (match CSS vars) ───────────────────────────────────────────────
  const COLOR_CYAN   = new THREE.Color(0x45f3ff);
  const COLOR_PURPLE = new THREE.Color(0x9d4edd);
  const COLOR_WHITE  = new THREE.Color(0xffffff);

  // ────────────────────────────────────────────────────────────────────────
  // 1. Outer wireframe icosahedron (neon shell)
  // ────────────────────────────────────────────────────────────────────────
  const icoGeo = new THREE.IcosahedronGeometry(1.1, 1);
  const icoMat = new THREE.MeshBasicMaterial({
    color: COLOR_CYAN,
    wireframe: true,
    transparent: true,
    opacity: 0.25,
  });
  const icosahedron = new THREE.Mesh(icoGeo, icoMat);
  scene.add(icosahedron);

  // ────────────────────────────────────────────────────────────────────────
  // 2. Inner pulsing sphere
  // ────────────────────────────────────────────────────────────────────────
  const innerGeo = new THREE.SphereGeometry(0.55, 32, 32);
  const innerMat = new THREE.MeshBasicMaterial({
    color: COLOR_PURPLE,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });
  const innerSphere = new THREE.Mesh(innerGeo, innerMat);
  scene.add(innerSphere);

  // ────────────────────────────────────────────────────────────────────────
  // 3. Particle cloud (floating dots)
  // ────────────────────────────────────────────────────────────────────────
  const PARTICLE_COUNT = 1800;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const basePositions = new Float32Array(PARTICLE_COUNT * 3);  // rest positions
  const velocities   = new Float32Array(PARTICLE_COUNT * 3);
  const colors       = new Float32Array(PARTICLE_COUNT * 3);
  const sizes        = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Distribute on/near the surface of a sphere
    const phi   = Math.acos(2 * Math.random() - 1);
    const theta = 2 * Math.PI * Math.random();
    const r     = 0.9 + Math.random() * 0.55;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    basePositions[i * 3]     = positions[i * 3]     = x;
    basePositions[i * 3 + 1] = positions[i * 3 + 1] = y;
    basePositions[i * 3 + 2] = positions[i * 3 + 2] = z;

    // Mix cyan / purple / white
    const t = Math.random();
    const c = t < 0.5
      ? COLOR_CYAN.clone().lerp(COLOR_WHITE, t * 1.5)
      : COLOR_PURPLE.clone().lerp(COLOR_WHITE, (t - 0.5) * 1.5);
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    sizes[i] = 2.5 + Math.random() * 3.5;
  }

  const partGeo = new THREE.BufferGeometry();
  partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  partGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  partGeo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

  const partMat = new THREE.PointsMaterial({
    vertexColors: true,
    sizeAttenuation: true,
    size: 0.04,
    transparent: true,
    opacity: 0.9,
  });

  const particles = new THREE.Points(partGeo, partMat);
  scene.add(particles);

  // ────────────────────────────────────────────────────────────────────────
  // 4. Orbital rings
  // ────────────────────────────────────────────────────────────────────────
  function makeRing(radius, color, opacity, rotX, rotZ) {
    const geo = new THREE.TorusGeometry(radius, 0.008, 8, 120);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = rotX;
    ring.rotation.z = rotZ;
    scene.add(ring);
    return ring;
  }

  const ring1 = makeRing(1.35, COLOR_CYAN,   0.55, Math.PI / 2,        0);
  const ring2 = makeRing(1.48, COLOR_PURPLE,  0.4,  Math.PI / 4,  Math.PI / 5);
  const ring3 = makeRing(1.6,  COLOR_CYAN,   0.25,  Math.PI / 6, -Math.PI / 4);

  // ────────────────────────────────────────────────────────────────────────
  // 5. Mouse interaction state
  // ────────────────────────────────────────────────────────────────────────
  const mouse = { x: 0, y: 0 };           // normalised [-1,1]
  const mouseWorld = new THREE.Vector3();  // mouse in 3-D
  let isDragging = false;
  let prevMouse  = { x: 0, y: 0 };
  let autoRotX   = 0;
  let autoRotY   = 0;
  let dragVelX   = 0;
  let dragVelY   = 0;
  let exploding  = false;
  let explodeT   = 0;

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;

    mouseWorld.set(mouse.x * 1.6, mouse.y * 1.6, 0.5).unproject(camera);

    if (isDragging) {
      dragVelX = (e.clientY - prevMouse.y) * 0.012;
      dragVelY = (e.clientX - prevMouse.x) * 0.012;
      prevMouse = { x: e.clientX, y: e.clientY };
    }
  });

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    prevMouse  = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mouseup', () => { isDragging = false; });

  // Click → particle explosion
  canvas.addEventListener('click', () => {
    exploding = true;
    explodeT  = 0;
    // Give every particle a random outward velocity
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const bx = basePositions[i * 3];
      const by = basePositions[i * 3 + 1];
      const bz = basePositions[i * 3 + 2];
      const len = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
      const speed = 0.04 + Math.random() * 0.09;
      velocities[i * 3]     = (bx / len) * speed;
      velocities[i * 3 + 1] = (by / len) * speed;
      velocities[i * 3 + 2] = (bz / len) * speed;
    }
  });

  // Touch support
  canvas.addEventListener('touchmove', (e) => {
    const rect  = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    mouse.x = ((touch.clientX - rect.left) / rect.width)  * 2 - 1;
    mouse.y = -((touch.clientY - rect.top)  / rect.height) * 2 + 1;
    e.preventDefault();
  }, { passive: false });

  // ────────────────────────────────────────────────────────────────────────
  // 6. Resize observer
  // ────────────────────────────────────────────────────────────────────────
  const ro = new ResizeObserver(() => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  ro.observe(canvas);

  // Initial size
  const w0 = canvas.clientWidth;
  const h0 = canvas.clientHeight;
  renderer.setSize(w0, h0, false);
  camera.aspect = w0 / h0;
  camera.updateProjectionMatrix();

  // ────────────────────────────────────────────────────────────────────────
  // 7. Animation loop
  // ────────────────────────────────────────────────────────────────────────
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // ── Mouse-driven rotation (smooth lerp) ──────────────────────────────
    if (!isDragging) {
      dragVelX *= 0.92;
      dragVelY *= 0.92;
    }
    autoRotX += dragVelX;
    autoRotY += dragVelY;

    // Drift toward mouse with slow auto-spin
    const targetX = autoRotX + mouse.y * 0.4;
    const targetY = autoRotY + mouse.x * 0.4;

    icosahedron.rotation.x += (targetX - icosahedron.rotation.x) * 0.06 + 0.003;
    icosahedron.rotation.y += (targetY - icosahedron.rotation.y) * 0.06 + 0.005;

    innerSphere.rotation.x = -icosahedron.rotation.x * 0.6 + t * 0.3;
    innerSphere.rotation.y =  icosahedron.rotation.y * 0.6 - t * 0.2;

    particles.rotation.x += (targetX - particles.rotation.x) * 0.04 + 0.002;
    particles.rotation.y += (targetY - particles.rotation.y) * 0.04 + 0.004;

    // ── Rings ────────────────────────────────────────────────────────────
    ring1.rotation.z = t * 0.4;
    ring2.rotation.y = t * 0.25;
    ring3.rotation.x = t * 0.18;
    ring3.rotation.z = -t * 0.3;

    // ── Pulsing scale ────────────────────────────────────────────────────
    const pulse = 1 + Math.sin(t * 2.2) * 0.025;
    icosahedron.scale.setScalar(pulse);
    innerSphere.scale.setScalar(1 + Math.sin(t * 3.5 + 1) * 0.04);

    // ── Particle explosion / re-gather ───────────────────────────────────
    const pos = partGeo.attributes.position.array;

    if (exploding) {
      explodeT += 0.018;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos[i * 3]     += velocities[i * 3];
        pos[i * 3 + 1] += velocities[i * 3 + 1];
        pos[i * 3 + 2] += velocities[i * 3 + 2];
        // Slow down
        velocities[i * 3]     *= 0.97;
        velocities[i * 3 + 1] *= 0.97;
        velocities[i * 3 + 2] *= 0.97;
      }
      if (explodeT > 1.2) exploding = false;
    } else {
      // Gently float back to base positions with mouse repulsion
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const bx = basePositions[i * 3];
        const by = basePositions[i * 3 + 1];
        const bz = basePositions[i * 3 + 2];

        // Subtle wave offset
        const wave = Math.sin(t * 1.2 + i * 0.01) * 0.03;

        pos[i * 3]     += ((bx + wave) - pos[i * 3])     * 0.04;
        pos[i * 3 + 1] += ((by + wave) - pos[i * 3 + 1]) * 0.04;
        pos[i * 3 + 2] += ((bz)        - pos[i * 3 + 2]) * 0.04;
      }
    }
    partGeo.attributes.position.needsUpdate = true;

    // ── Opacity pulse on icosahedron edges ───────────────────────────────
    icoMat.opacity = 0.2 + Math.sin(t * 1.8) * 0.08;

    renderer.render(scene, camera);
  }

  animate();

  // Cleanup
  return () => { ro.disconnect(); renderer.dispose(); };
}
