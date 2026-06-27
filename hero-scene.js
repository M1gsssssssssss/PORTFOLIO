import * as THREE from 'three';

export function initHeroScene(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // ── Renderer ──────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = true;

  // ── Scene / Camera ────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 1.8, 4.2);
  camera.lookAt(0, 0.5, 0);

  // ── Lights ────────────────────────────────────────────────────────────────
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 8, 5);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const pointLight = new THREE.PointLight(0x06b6d4, 1.5, 10);
  pointLight.position.set(0, 2, 1);
  scene.add(pointLight);

  // ── Materials ─────────────────────────────────────────────────────────────
  // Colors for Light Mode
  const matMetal = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.8,
    roughness: 0.2,
  });
  const matBody = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.5,
    roughness: 0.3,
  });
  const matEyeGlow = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const matEyeAngry = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const matWood = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
  const matBrick = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.6 });
  const matRoof = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
  const matFloor = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 });

  // ── Ground Plane ──────────────────────────────────────────────────────────
  const floorGeo = new THREE.PlaneGeometry(10, 10);
  const floor = new THREE.Mesh(floorGeo, matFloor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.5;
  floor.receiveShadow = true;
  scene.add(floor);

  // Grid Helper
  const gridHelper = new THREE.GridHelper(6, 12, 0x06b6d4, 0xcbd5e1);
  gridHelper.position.y = -0.49;
  scene.add(gridHelper);

  // ── 3D Robot Group ────────────────────────────────────────────────────────
  const robotGroup = new THREE.Group();
  robotGroup.position.set(0.9, 0, 0);
  scene.add(robotGroup);

  // Body
  const bodyGeo = new THREE.BoxGeometry(0.5, 0.6, 0.4);
  const body = new THREE.Mesh(bodyGeo, matBody);
  body.position.y = 0.3;
  body.castShadow = true;
  robotGroup.add(body);

  // Head
  const headGeo = new THREE.BoxGeometry(0.4, 0.35, 0.35);
  const head = new THREE.Mesh(headGeo, matMetal);
  head.position.y = 0.8;
  head.castShadow = true;
  robotGroup.add(head);

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.1, 16);
  const neck = new THREE.Mesh(neckGeo, matMetal);
  neck.position.y = 0.58;
  robotGroup.add(neck);

  // Eyes
  const eyeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16);
  eyeGeo.rotateX(Math.PI / 2);
  const leftEye = new THREE.Mesh(eyeGeo, matEyeGlow);
  leftEye.position.set(-0.1, 0.82, 0.17);
  const rightEye = new THREE.Mesh(eyeGeo, matEyeGlow);
  rightEye.position.set(0.1, 0.82, 0.17);
  robotGroup.add(leftEye, rightEye);

  // Antenna
  const antPoleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8);
  const antPole = new THREE.Mesh(antPoleGeo, matMetal);
  antPole.position.y = 1.05;
  robotGroup.add(antPole);

  const antBallGeo = new THREE.SphereGeometry(0.04, 16, 16);
  const antBall = new THREE.Mesh(antBallGeo, matEyeGlow);
  antBall.position.y = 1.15;
  robotGroup.add(antBall);

  // Left Arm (Hammer Arm)
  const armGroup = new THREE.Group();
  armGroup.position.set(-0.3, 0.45, 0);
  robotGroup.add(armGroup);

  const shoulderGeo = new THREE.SphereGeometry(0.07, 16, 16);
  const shoulder = new THREE.Mesh(shoulderGeo, matMetal);
  armGroup.add(shoulder);

  const armGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 16);
  const arm = new THREE.Mesh(armGeo, matBody);
  arm.position.y = -0.15;
  armGroup.add(arm);

  // Hammer
  const hammerGroup = new THREE.Group();
  hammerGroup.position.set(0, -0.3, 0);
  armGroup.add(hammerGroup);

  const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
  const handle = new THREE.Mesh(handleGeo, matWood);
  handle.rotation.x = Math.PI / 2;
  hammerGroup.add(handle);

  const headGeo3D = new THREE.BoxGeometry(0.12, 0.12, 0.22);
  const hammerHead = new THREE.Mesh(headGeo3D, matMetal);
  hammerHead.position.z = 0.1;
  hammerGroup.add(hammerHead);

  // Right Arm (Static arm)
  const rightArmGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 16);
  const rightArm = new THREE.Mesh(rightArmGeo, matBody);
  rightArm.position.set(0.3, 0.25, 0);
  robotGroup.add(rightArm);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 16);
  const leftLeg = new THREE.Mesh(legGeo, matMetal);
  leftLeg.position.set(-0.15, -0.15, 0);
  const rightLeg = new THREE.Mesh(legGeo, matMetal);
  rightLeg.position.set(0.15, -0.15, 0);
  robotGroup.add(leftLeg, rightLeg);

  // Feet
  const footGeo = new THREE.BoxGeometry(0.12, 0.06, 0.18);
  const leftFoot = new THREE.Mesh(footGeo, matMetal);
  leftFoot.position.set(-0.15, -0.32, 0.03);
  const rightFoot = new THREE.Mesh(footGeo, matMetal);
  rightFoot.position.set(0.15, -0.32, 0.03);
  robotGroup.add(leftFoot, rightFoot);


  // ── 3D House Group ────────────────────────────────────────────────────────
  const houseGroup = new THREE.Group();
  houseGroup.position.set(-0.7, -0.5, 0);
  scene.add(houseGroup);

  // House Foundation
  const foundGeo = new THREE.BoxGeometry(1.2, 0.08, 1.0);
  const foundation = new THREE.Mesh(foundGeo, matFloor);
  foundation.position.y = 0.04;
  foundation.receiveShadow = true;
  houseGroup.add(foundation);

  // Dynamic bricks
  const bricks = [];
  const brickGeo = new THREE.BoxGeometry(0.24, 0.1, 0.18);
  const rows = 5;
  const cols = 4;

  // Pre-generate grid of positions for bricks
  const brickPositions = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Don't fill middle completely (leave door/window spaces)
      if (r < 3 && c === 1) continue; // Door space
      if (r === 3 && c === 2) continue; // Window space
      
      const x = -0.36 + c * 0.25;
      const y = 0.13 + r * 0.105;
      const z = 0;
      brickPositions.push({ x, y, z });
    }
  }

  // Roof mesh (starts invisible / scaled down)
  const roofGeo = new THREE.ConeGeometry(0.75, 0.4, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(roofGeo, matRoof);
  roof.position.set(0, 0.13 + rows * 0.105 + 0.18, 0);
  roof.scale.set(0.001, 0.001, 0.001);
  roof.castShadow = true;
  houseGroup.add(roof);


  // ── Particles for Steam/Puffs ─────────────────────────────────────────────
  const particleGeo = new THREE.SphereGeometry(0.03, 8, 8);
  const particleMat = new THREE.MeshBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.6
  });
  const particleGroup = new THREE.Group();
  scene.add(particleGroup);

  const activeParticles = [];

  function spawnPuff(x, y, z, color = 0x94a3b8) {
    const pMat = particleMat.clone();
    pMat.color.setHex(color);
    const p = new THREE.Mesh(particleGeo, pMat);
    p.position.set(x, y, z);
    particleGroup.add(p);
    activeParticles.push({
      mesh: p,
      mat: pMat,
      vx: (Math.random() - 0.5) * 0.04,
      vy: 0.03 + Math.random() * 0.04,
      vz: (Math.random() - 0.5) * 0.04,
      life: 1.0
    });
  }


  // ── Click / Angry Mode Raycaster ──────────────────────────────────────────
  let mode = 'building'; // 'building' | 'angry'
  let angryTimer = 0;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(robotGroup.children, true);

    if (intersects.length > 0) {
      triggerAngry();
    }
  });

  function triggerAngry() {
    if (mode === 'angry') return;
    mode = 'angry';
    angryTimer = 3.0; // 3 seconds of anger

    leftEye.material = matEyeAngry;
    rightEye.material = matEyeAngry;
    antBall.material = matEyeAngry;
  }

  function triggerNormal() {
    mode = 'building';
    leftEye.material = matEyeGlow;
    rightEye.material = matEyeGlow;
    antBall.material = matEyeGlow;
  }


  // ── Building Loop / Animations ────────────────────────────────────────────
  let animTime = 0;
  let brickIndex = 0;
  let animState = 'swinging'; // 'swinging' | 'resetting' | 'waiting'
  let stateTimer = 0;
  let roofProgress = 0;

  function resetConstruction() {
    bricks.forEach(b => houseGroup.remove(b));
    bricks.length = 0;
    brickIndex = 0;
    roof.scale.set(0.001, 0.001, 0.001);
    roofProgress = 0;
    animState = 'swinging';
    stateTimer = 0;
  }

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const dt = clock.getDelta();
    animTime += dt;

    // Subtle Robot Bobbing (Idle)
    const bob = Math.sin(animTime * 2.5) * 0.02;
    body.position.y = 0.3 + bob;
    head.position.y = 0.8 + bob;
    neck.position.y = 0.58 + bob;
    leftEye.position.y = 0.82 + bob;
    rightEye.position.y = 0.82 + bob;
    antPole.position.y = 1.05 + bob;
    antBall.position.y = 1.15 + bob;
    armGroup.position.y = 0.45 + bob;
    rightArm.position.y = 0.25 + bob;

    // ── Update Particles ────────────────────────────────────────────────────
    for (let i = activeParticles.length - 1; i >= 0; i--) {
      const p = activeParticles[i];
      p.mesh.position.x += p.vx;
      p.mesh.position.y += p.vy;
      p.mesh.position.z += p.vz;
      p.life -= dt * 2.0;
      p.mat.opacity = p.life * 0.6;
      p.mesh.scale.setScalar(1 + (1 - p.life) * 1.5);
      
      if (p.life <= 0) {
        particleGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mat.dispose();
        activeParticles.splice(i, 1);
      }
    }

    // ── Angry State Handler ─────────────────────────────────────────────────
    if (mode === 'angry') {
      angryTimer -= dt;
      
      // Fast robot shake
      const shakeAmp = 0.06;
      robotGroup.position.x = 0.9 + (Math.random() - 0.5) * shakeAmp;
      robotGroup.position.z = (Math.random() - 0.5) * shakeAmp;

      // Pulse red eye glow
      const intensity = 0.5 + Math.sin(animTime * 15) * 0.5;
      matEyeAngry.color.setRGB(1, intensity * 0.3, intensity * 0.3);

      // Shoot out steam particles
      if (Math.random() < 0.25) {
        // From head sides
        spawnPuff(robotGroup.position.x - 0.18, 0.9 + bob, 0, 0xef4444);
        spawnPuff(robotGroup.position.x + 0.18, 0.9 + bob, 0, 0xef4444);
      }

      if (angryTimer <= 0) {
        robotGroup.position.set(0.9, 0, 0);
        triggerNormal();
      }
    } else {
      // ── Building Animation State Machine ──────────────────────────────────
      stateTimer += dt;

      if (animState === 'swinging') {
        // Swing hammer arm down
        const progress = Math.min(stateTimer / 0.4, 1);
        // Rotation range from -0.5 to 1.0 rad
        armGroup.rotation.x = -0.5 + progress * 1.4;

        if (stateTimer >= 0.4) {
          animState = 'impact';
          stateTimer = 0;
        }
      } else if (animState === 'impact') {
        // Impact! Spawn a brick
        if (brickIndex < brickPositions.length) {
          const pos = brickPositions[brickIndex];
          const newBrick = new THREE.Mesh(brickGeo, matBrick);
          newBrick.position.set(pos.x, pos.y, pos.z);
          newBrick.castShadow = true;
          newBrick.receiveShadow = true;
          // Spawn animation scale
          newBrick.scale.set(0.01, 0.01, 0.01);
          houseGroup.add(newBrick);
          bricks.push(newBrick);

          // Impact dust puff
          spawnPuff(houseGroup.position.x + pos.x, houseGroup.position.y + pos.y + 0.05, pos.z, 0xcbd5e1);

          brickIndex++;
        }
        animState = 'resetting';
        stateTimer = 0;
      } else if (animState === 'resetting') {
        // Ease back hammer arm
        const progress = Math.min(stateTimer / 0.5, 1);
        armGroup.rotation.x = 0.9 - progress * 1.4;

        // Animate last spawned brick scale
        if (bricks.length > 0) {
          const lastB = bricks[bricks.length - 1];
          if (lastB.scale.x < 1) {
            const sc = Math.min(lastB.scale.x + dt * 6, 1);
            lastB.scale.set(sc, sc, sc);
          }
        }

        if (stateTimer >= 0.5) {
          animState = 'waiting';
          stateTimer = 0;
        }
      } else if (animState === 'waiting') {
        // Wait a bit before next swing
        armGroup.rotation.x = -0.5;

        // If house wall complete, scale up the roof
        if (brickIndex >= brickPositions.length) {
          roofProgress = Math.min(roofProgress + dt * 0.8, 1);
          roof.scale.set(roofProgress, roofProgress, roofProgress);
          
          if (roofProgress >= 1 && stateTimer > 3.5) {
            // Done! Reset construction after pause
            resetConstruction();
          }
        } else {
          if (stateTimer >= 0.7) {
            animState = 'swinging';
            stateTimer = 0;
          }
        }
      }
    }

    renderer.render(scene, camera);
  }

  animate();

  // Resize handler
  const ro = new ResizeObserver(() => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  ro.observe(canvas);

  return () => {
    ro.disconnect();
    renderer.dispose();
  };
}
