// ============================================================
// WEBGL FLUID & ADRENALINE INTERACTION (Custom Shaders + GSAP)
// ============================================================

(function () {
    'use strict';

    if (typeof THREE === 'undefined' || typeof gsap === 'undefined') {
        console.warn('[interaction-fluid] Required libraries not loaded');
        return;
    }

    const canvas = document.getElementById('interaction-canvas');
    const ctaContainer = document.querySelector('.final-cta-container');

    if (!canvas) return;

    // --- 1. WebGL Setup ---
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight;
    renderer.setSize(width, height);

    const scene = new THREE.Scene();
    
    // Orthographic camera for full-screen shader plane
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // --- 2. Fluid Background Shader (Plane) ---
    
    const fluidVertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `;

    const fluidFragmentShader = `
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uSpeed;
        uniform float uIntensity;
        uniform float uGlitch;
        uniform vec2 uResolution;
        varying vec2 vUv;

        // Generic 2D random
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        // Generic 2D noise
        float noise(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        // fBm
        float fbm(vec2 st) {
            float value = 0.0;
            float amplitude = 0.5;
            for (int i = 0; i < 5; i++) {
                value += amplitude * noise(st);
                st *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        void main() {
            vec2 st = vUv;
            st.x *= uResolution.x / uResolution.y;

            float t = uTime * uSpeed;

            // Mouse repulsion/stirring effect
            vec2 mouseSt = uMouse;
            mouseSt.x *= uResolution.x / uResolution.y;
            float dist = distance(st, mouseSt);
            
            // Warp coordinates based on fluid noise and mouse proximity
            vec2 q = vec2(0.);
            q.x = fbm(st + vec2(t * 0.1, t * 0.05));
            q.y = fbm(st + vec2(t * 0.05, t * 0.1));
            
            vec2 r = vec2(0.);
            r.x = fbm(st + 1.0 * q + vec2(t * 0.2, t * 0.3));
            r.y = fbm(st + 1.0 * q + vec2(t * 0.3, t * 0.2));

            // Stir effect if mouse is near
            float stir = smoothstep(0.4, 0.0, dist);
            st += (r - 0.5) * (0.1 + stir * 0.2 * uIntensity);

            // Glitch effect (chromatic & displacement)
            if (uGlitch > 0.0) {
                float glitchNoise = random(vec2(t, st.y));
                if (glitchNoise > 0.95 - (uGlitch * 0.1)) {
                    st.x += (random(vec2(t)) - 0.5) * uGlitch * 0.05;
                }
            }

            // Final fluid noise value
            float f = fbm(st * 3.0);
            
            // Map to very dark, moody web colors (deep reds/blues) based on intensity
            vec3 color = vec3(0.02); // Dark base
            
            // Create moody swirling highlights
            vec3 highlight1 = vec3(0.8, 0.1, 0.2); // Spider red
            vec3 highlight2 = vec3(0.1, 0.3, 0.8); // Spider blue
            
            color = mix(color, highlight1, f * r.x * uIntensity * 0.2);
            color = mix(color, highlight2, f * r.y * uIntensity * 0.2);

            // Apply glitch chromatic aberration
            if (uGlitch > 0.0 && random(vec2(t, st.y)) > 0.9) {
                color.r += 0.2 * uGlitch;
                color.b += 0.2 * uGlitch;
            }

            // Vignette
            float vignette = smoothstep(1.5, 0.2, length(vUv - 0.5));
            color *= vignette;

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    const uniforms = {
        uTime: { value: 0.0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uSpeed: { value: 1.0 },       // Multiplier for time
        uIntensity: { value: 1.0 },   // Multiplier for colors/swirls
        uGlitch: { value: 0.0 },      // 0 = none, 1+ = chaotic
        uResolution: { value: new THREE.Vector2(width, height) }
    };

    const fluidMaterial = new THREE.ShaderMaterial({
        vertexShader: fluidVertexShader,
        fragmentShader: fluidFragmentShader,
        uniforms: uniforms,
        depthWrite: false,
        depthTest: false
    });

    const planeGeometry = new THREE.PlaneGeometry(2, 2);
    const planeMesh = new THREE.Mesh(planeGeometry, fluidMaterial);
    scene.add(planeMesh);

    // --- 3. Particle System (Web-Fluid Trails) ---
    // Creates glowing red/blue trails that track the mouse
    const MAX_PARTICLES = 300;
    let particleIdx = 0;
    
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(MAX_PARTICLES * 3);
    const particleColors = new Float32Array(MAX_PARTICLES * 3);
    const particleAges = new Float32Array(MAX_PARTICLES); // Tracks age for fading
    const particleVelocities = [];

    for (let i = 0; i < MAX_PARTICLES; i++) {
        particlePositions[i * 3] = 9999; // start off-screen
        particlePositions[i * 3 + 1] = 9999;
        particlePositions[i * 3 + 2] = 0;
        
        particleColors[i * 3] = 0;
        particleColors[i * 3 + 1] = 0;
        particleColors[i * 3 + 2] = 0;
        
        particleAges[i] = 0; // 0 = dead, 1 = new
        particleVelocities.push(new THREE.Vector3(0, 0, 0));
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    // We will pass age via a custom attribute if using a custom shader, or just use a standard PointsMaterial and manually fade out vertices by shrinking them or making them transparent.
    // For simplicity and performance, we'll manually update positions in JS.

    const particleMaterial = new THREE.PointsMaterial({
        size: 8.0,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // Mouse tracking variables
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;
    let isMouseMoving = false;
    let mouseTimeout;

    // Convert mouse to WebGL Normalized Device Coordinates (-1 to 1)
    function updateMousePositions(e) {
        const rect = canvas.getBoundingClientRect();
        targetMouseX = e.clientX - rect.left;
        targetMouseY = e.clientY - rect.top;
        
        // Update uniforms for fluid shader (0 to 1)
        uniforms.uMouse.value.x = targetMouseX / rect.width;
        uniforms.uMouse.value.y = 1.0 - (targetMouseY / rect.height);

        isMouseMoving = true;
        clearTimeout(mouseTimeout);
        mouseTimeout = setTimeout(() => { isMouseMoving = false; }, 100);
    }

    window.addEventListener('mousemove', updateMousePositions);

    // --- 4. Adrenaline Trigger (GSAP) ---
    // State object to tween
    const adrenalineState = {
        speed: 1.0,
        intensity: 1.0,
        glitch: 0.0,
        particleSpeed: 1.0
    };

    if (ctaContainer) {
        ctaContainer.addEventListener('mouseenter', () => {
            gsap.to(adrenalineState, {
                speed: 8.0,           // Violently multiply time
                intensity: 6.0,       // Crank brightness
                glitch: 1.5,          // Trigger shader glitch
                particleSpeed: 5.0,   // Spin particles out of control
                duration: 0.3,
                ease: "power2.inOut",
                onUpdate: applyAdrenalineState
            });
        });

        ctaContainer.addEventListener('mouseleave', () => {
            gsap.to(adrenalineState, {
                speed: 1.0,
                intensity: 1.0,
                glitch: 0.0,
                particleSpeed: 1.0,
                duration: 0.6,
                ease: "power2.out",
                onUpdate: applyAdrenalineState
            });
        });
    }

    function applyAdrenalineState() {
        uniforms.uSpeed.value = adrenalineState.speed;
        uniforms.uIntensity.value = adrenalineState.intensity;
        uniforms.uGlitch.value = adrenalineState.glitch;
    }

    // --- 5. Animation Loop ---
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        uniforms.uTime.value += delta;

        // Smooth mouse follow
        mouseX += (targetMouseX - mouseX) * 0.1;
        mouseY += (targetMouseY - mouseY) * 0.1;

        // NDC coordinates for particles
        const parentW = canvas.parentElement.clientWidth || width;
        const parentH = canvas.parentElement.clientHeight || height;
        const ndcX = (mouseX / parentW) * 2 - 1;
        const ndcY = -(mouseY / parentH) * 2 + 1;

        // Spawn new particles if mouse is moving
        if (isMouseMoving) {
            for(let i=0; i<3; i++) { // Spawn a few per frame
                particleIdx = (particleIdx + 1) % MAX_PARTICLES;
                
                // Spawn near cursor
                particlePositions[particleIdx * 3] = ndcX + (Math.random() - 0.5) * 0.02;
                particlePositions[particleIdx * 3 + 1] = ndcY + (Math.random() - 0.5) * 0.02;
                particlePositions[particleIdx * 3 + 2] = 0;
                
                // Red or Blue
                const isRed = Math.random() > 0.5;
                particleColors[particleIdx * 3] = isRed ? 1.0 : 0.2; // R
                particleColors[particleIdx * 3 + 1] = 0.1;           // G
                particleColors[particleIdx * 3 + 2] = isRed ? 0.2 : 1.0; // B
                
                particleAges[particleIdx] = 1.0; // Full life
                
                // Initial velocity (swirling out)
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 0.02;
                particleVelocities[particleIdx].set(Math.cos(angle) * speed, Math.sin(angle) * speed, 0);
            }
        }

        // Update existing particles
        const posAttr = particleGeometry.attributes.position;
        const colAttr = particleGeometry.attributes.color;

        for (let i = 0; i < MAX_PARTICLES; i++) {
            if (particleAges[i] > 0) {
                // Decay
                particleAges[i] -= delta * 0.8 * adrenalineState.particleSpeed;
                
                if (particleAges[i] <= 0) {
                    // Hide
                    particleAges[i] = 0;
                    posAttr.array[i * 3] = 9999; 
                } else {
                    // Swirl logic (rotate velocity slightly to create loops)
                    const v = particleVelocities[i];
                    
                    // Simple rotation matrix for velocity to make them spiral
                    const theta = 0.1 * adrenalineState.particleSpeed * (i % 2 === 0 ? 1 : -1); 
                    const cosT = Math.cos(theta);
                    const sinT = Math.sin(theta);
                    const nx = v.x * cosT - v.y * sinT;
                    const ny = v.x * sinT + v.y * cosT;
                    v.x = nx;
                    v.y = ny;

                    // Move
                    posAttr.array[i * 3] += v.x * adrenalineState.particleSpeed;
                    posAttr.array[i * 3 + 1] += v.y * adrenalineState.particleSpeed;
                    
                    // Fade color based on age
                    colAttr.array[i * 3] *= 0.95;
                    colAttr.array[i * 3 + 1] *= 0.95;
                    colAttr.array[i * 3 + 2] *= 0.95;
                }
            }
        }
        
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;

        renderer.render(scene, camera);
    }

    animate();

    // --- 6. Resize Handler ---
    window.addEventListener('resize', () => {
        const w = canvas.parentElement.clientWidth;
        const h = canvas.parentElement.clientHeight;
        renderer.setSize(w, h);
        uniforms.uResolution.value.set(w, h);
        
        // On mobile, reduce particle size slightly
        if (w < 768) {
            particleMaterial.size = 5.0;
        } else {
            particleMaterial.size = 8.0;
        }
    });

})();
