// ============================================================
// 3D VIDEO SPIRAL BACKGROUND - Three.js + GSAP ScrollTrigger
// ============================================================

(function () {
  // --------------------------------------------------------
  // 1️⃣  Grab the shared <video> element (already in DOM)
  // --------------------------------------------------------
  const video = document.getElementById('hero-bg-video');
  if (!video) {
    console.warn('[VideoSpiral] #hero-bg-video not found');
    return;
  }

  // Ensure video is ready for WebGL texture
  video.crossOrigin = 'anonymous';
  video.playsInline = true;
  video.muted = true;
  video.loop = true;

  // --------------------------------------------------------
  // 2️⃣  Three.js Boilerplate
  // --------------------------------------------------------
  const canvas = document.getElementById('video-spiral-canvas');
  if (!canvas) {
    console.warn('[VideoSpiral] #video-spiral-canvas not found');
    return;
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: false
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 0, 0); // start inside the tube

  // --------------------------------------------------------
  // 3️⃣  Video Texture
  // --------------------------------------------------------
  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.colorSpace = THREE.SRGBColorSpace;
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  videoTexture.wrapS = THREE.ClampToEdgeWrapping;
  videoTexture.wrapT = THREE.ClampToEdgeWrapping;

  // --------------------------------------------------------
  // 4️⃣  Spiral Geometry (CatmullRomCurve3 → TubeGeometry)
  // --------------------------------------------------------
  const turns = 8;          // how many coils
  const radius = 120;       // tube radius
  const tubeRadius = 180;   // thickness of the tube wall
  const height = 3000;      // total Z depth

  const points = [];
  const segments = turns * 120; // resolution

  for (let i = 0; i <= segments; i++) {
    const t = i / segments; // 0 → 1
    const angle = t * Math.PI * 2 * turns;
    const z = -t * height;  // negative Z = forward into screen
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    points.push(new THREE.Vector3(x, y, z));
  }

  const path = new THREE.CatmullRomCurve3(points);
  path.closed = false;

  const tubeGeo = new THREE.TubeGeometry(path, segments * 2, tubeRadius, 16, false);
  // TubeGeometry UVs run along the tube (v = length). We want video to map around circumference.
  // Rotate UVs so video wraps around the tube, not along it.
  const uvAttr = tubeGeo.attributes.uv;
  for (let i = 0; i < uvAttr.count; i++) {
    const u = uvAttr.getX(i); // along tube length
    const v = uvAttr.getY(i); // around circumference
    uvAttr.setXY(i, v, 1 - u); // swap + flip so video plays along the spiral
  }
  uvAttr.needsUpdate = true;

  const tubeMat = new THREE.MeshBasicMaterial({
    map: videoTexture,
    side: THREE.BackSide, // view from inside
    toneMapped: false,
    transparent: true,
    opacity: 0.95
  });

  const tube = new THREE.Mesh(tubeGeo, tubeMat);
  scene.add(tube);

  // --------------------------------------------------------
  // 5️⃣  Ambient particles for depth (optional but nice)
  // --------------------------------------------------------
  const particleCount = 800;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(particleCount * 3);
  const pSize = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const t = Math.random();
    const angle = t * Math.PI * 2 * turns;
    const z = -t * height * 1.2;
    const r = radius + tubeRadius + Math.random() * 300;
    pPos[i * 3] = Math.cos(angle) * r;
    pPos[i * 3 + 1] = Math.sin(angle) * r;
    pPos[i * 3 + 2] = z;
    pSize[i] = Math.random() * 2 + 0.5;
  }

  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('size', new THREE.BufferAttribute(pSize, 1));

  const pMat = new THREE.PointsMaterial({
    color: 0xff3333,
    size: 1.5,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: true,
    depthWrite: false
  });

  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // --------------------------------------------------------
  // 6️⃣  Resize Handler
  // --------------------------------------------------------
  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  // --------------------------------------------------------
  // 7️⃣  Render Loop
  // --------------------------------------------------------
  function animate() {
    requestAnimationFrame(animate);
    // Slight rotation for life
    tube.rotation.z += 0.00015;
    particles.rotation.z -= 0.00008;
    renderer.render(scene, camera);
  }
  animate();

  // --------------------------------------------------------
  // 8️⃣  GSAP ScrollTrigger Camera Flight
  // --------------------------------------------------------
  gsap.registerPlugin(ScrollTrigger);

  const triggerSection = document.querySelector('.timeline-outro');
  if (!triggerSection) {
    console.warn('[VideoSpiral] .timeline-outro not found');
    return;
  }

  // Camera path: start at tube entrance (z=0), fly through, exit top-right
  const camStart = { x: 0, y: 0, z: 50, rotX: 0, rotY: 0, rotZ: 0 };
  const camEnd = { x: 400, y: 300, z: -height - 500, rotX: -0.3, rotY: 0.4, rotZ: 0.1 };

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: triggerSection,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
      onUpdate: self => {
        const p = self.progress;
        // Interpolate camera position
        camera.position.x = gsap.utils.interpolate(camStart.x, camEnd.x, p);
        camera.position.y = gsap.utils.interpolate(camStart.y, camEnd.y, p);
        camera.position.z = gsap.utils.interpolate(camStart.z, camEnd.z, p);
        camera.rotation.x = gsap.utils.interpolate(camStart.rotX, camEnd.rotX, p);
        camera.rotation.y = gsap.utils.interpolate(camStart.rotY, camEnd.rotY, p);
        camera.rotation.z = gsap.utils.interpolate(camStart.rotZ, camEnd.rotZ, p);
      }
    }
  });

  // --------------------------------------------------------
  // 9️⃣  Auto-play video when scroll starts (fallback)
  // --------------------------------------------------------
  let videoStarted = false;
  ScrollTrigger.create({
    trigger: triggerSection,
    start: 'top bottom',
    onEnter: () => {
      if (!videoStarted) {
        video.play().catch(() => {});
        videoStarted = true;
      }
    },
    once: true
  });

  // Cleanup on unload (SPA safety)
  window.addEventListener('beforeunload', () => {
    window.removeEventListener('resize', onResize);
    renderer.dispose();
    tubeGeo.dispose();
    tubeMat.dispose();
    pGeo.dispose();
    pMat.dispose();
    videoTexture.dispose();
  });
})();