// =========================================================
// Particle Logo Engine — Scroll-driven assemble/shatter
// Loads spider_logo.png, samples pixel positions, creates
// particles that fly in from scattered positions and form
// the logo shape, then shatter on scroll-out.
// =========================================================

(function () {
    'use strict';

    // ---- Guard: require GSAP + ScrollTrigger ----
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.warn('[particle-logo] GSAP or ScrollTrigger not loaded');
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const canvas = document.getElementById('particle-canvas');
    const section = document.getElementById('legacy-transition');
    if (!canvas || !section) return;

    const ctx = canvas.getContext('2d');

    // ---- Configuration ----
    const PARTICLE_SAMPLE_GAP = 4;      // sample every Nth pixel (lower = more particles, slower)
    const PARTICLE_SIZE = 2;            // radius of each dot
    const LOGO_SCALE = 0.45;            // how much of the canvas width the logo should occupy
    const SCATTER_RANGE = 1.5;          // multiplier for how far particles scatter (1.5 = 150% of canvas)
    const RED = '#e60000';
    const WHITE = '#ffffff';
    const WHITE_CHANCE = 0.08;          // 8% of particles are white for sparkle

    // ---- State ----
    let particles = [];
    let progress = 0;                   // 0 = fully scattered, 1 = fully assembled
    let animFrameId = null;
    let isInitialized = false;

    // ---- Resize canvas to match section ----
    function resizeCanvas() {
        const rect = section.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ---- Load the logo and sample pixels ----
    function loadLogoAndCreateParticles() {
        const img = new Image();
        // NOTE: do NOT set crossOrigin — it breaks file:// protocol entirely
        img.src = 'assets/images/spider_logo.png';

        img.onload = function () {
            console.log('[particle-logo] Image loaded:', img.width, '×', img.height);
            try {
                samplePixels(img);
                isInitialized = true;

                // Hide the static watermark — particles replace it
                const watermark = document.querySelector('.legacy-watermark');
                if (watermark) watermark.style.display = 'none';

                startRenderLoop();
            } catch (e) {
                console.error('[particle-logo] Canvas tainted (CORS). Use http://localhost instead of file://', e);
            }
        };

        img.onerror = function () {
            console.error('[particle-logo] Failed to load spider_logo.png');
        };
    }

    function samplePixels(img) {
        // Draw the logo onto an offscreen canvas at a scaled size
        const offscreen = document.createElement('canvas');
        const offCtx = offscreen.getContext('2d');

        const sectionW = canvas.style.width ? parseInt(canvas.style.width) : section.clientWidth;
        const sectionH = canvas.style.height ? parseInt(canvas.style.height) : section.clientHeight;

        // Scale the logo to fit within LOGO_SCALE of the section
        const maxLogoW = sectionW * LOGO_SCALE;
        const maxLogoH = sectionH * LOGO_SCALE;
        const scale = Math.min(maxLogoW / img.width, maxLogoH / img.height);
        const logoW = Math.floor(img.width * scale);
        const logoH = Math.floor(img.height * scale);

        offscreen.width = logoW;
        offscreen.height = logoH;
        offCtx.drawImage(img, 0, 0, logoW, logoH);

        const imageData = offCtx.getImageData(0, 0, logoW, logoH);
        const data = imageData.data;

        // Offset so the logo is centered in the section
        const offsetX = (sectionW - logoW) / 2;
        const offsetY = (sectionH - logoH) / 2;

        particles = [];

        for (let y = 0; y < logoH; y += PARTICLE_SAMPLE_GAP) {
            for (let x = 0; x < logoW; x += PARTICLE_SAMPLE_GAP) {
                const i = (y * logoW + x) * 4;
                const alpha = data[i + 3];

                // Only create particles for non-transparent pixels
                if (alpha > 128) {
                    const targetX = offsetX + x;
                    const targetY = offsetY + y;

                    // Scattered position: random point far off in any direction
                    const angle = Math.random() * Math.PI * 2;
                    const distance = (0.5 + Math.random()) * Math.max(sectionW, sectionH) * SCATTER_RANGE;
                    const scatteredX = sectionW / 2 + Math.cos(angle) * distance;
                    const scatteredY = sectionH / 2 + Math.sin(angle) * distance;

                    // Color: mostly red, occasional white sparkle
                    const color = Math.random() < WHITE_CHANCE ? WHITE : RED;

                    // Slightly varied size for organic feel
                    const size = PARTICLE_SIZE * (0.6 + Math.random() * 0.8);

                    particles.push({
                        // Target (logo) position
                        tx: targetX,
                        ty: targetY,
                        // Scattered (exploded) position
                        sx: scatteredX,
                        sy: scatteredY,
                        // Current position (computed each frame from progress)
                        x: scatteredX,
                        y: scatteredY,
                        // Visual properties
                        color: color,
                        size: size,
                        // Per-particle randomness for organic movement
                        delay: Math.random() * 0.3,    // staggered arrival
                        wobble: Math.random() * 4 - 2   // slight random offset
                    });
                }
            }
        }

        console.log('[particle-logo] Created', particles.length, 'particles');
    }

    // ---- Easing helper: ease individual particles with stagger ----
    function easeParticle(t, delay) {
        // Offset t by the particle's delay, clamped to 0–1
        const adjusted = Math.max(0, Math.min(1, (t - delay) / (1 - delay)));
        // Ease out cubic
        return 1 - Math.pow(1 - adjusted, 3);
    }

    // ---- Render one frame ----
    function render() {
        const sectionW = parseInt(canvas.style.width) || section.clientWidth;
        const sectionH = parseInt(canvas.style.height) || section.clientHeight;

        ctx.clearRect(0, 0, sectionW, sectionH);

        if (particles.length === 0) return;

        // Determine assembly and shatter phases from progress (0 → 1)
        // 0.0 – 0.5: assemble (scattered → logo)
        // 0.5 – 1.0: shatter  (logo → scattered + fade out)
        let assembleT, opacity;

        if (progress <= 0.5) {
            // Assembly phase: map 0–0.5 progress to 0–1 assembly
            assembleT = progress * 2;  // 0 → 1
            opacity = 0.2 + assembleT * 0.8;  // 0.2 → 1.0
        } else {
            // Shatter phase: map 0.5–1.0 to 1–0 assembly (reverse)
            assembleT = (1 - progress) * 2;  // 1 → 0
            opacity = assembleT;  // 1 → 0
        }

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const t = easeParticle(assembleT, p.delay);

            // Interpolate between scattered and target position
            p.x = p.sx + (p.tx - p.sx) * t + p.wobble * (1 - t);
            p.y = p.sy + (p.ty - p.sy) * t + p.wobble * (1 - t);

            // Only draw if on screen (optimization)
            if (p.x < -20 || p.x > sectionW + 20 || p.y < -20 || p.y > sectionH + 20) continue;

            ctx.globalAlpha = opacity;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }

    // ---- Animation loop ----
    function startRenderLoop() {
        function loop() {
            render();
            animFrameId = requestAnimationFrame(loop);
        }
        loop();
    }

    // ---- GSAP ScrollTrigger integration ----
    function setupScrollTrigger() {
        ScrollTrigger.create({
            trigger: '#legacy-transition',
            start: 'top bottom',      // particles begin when section enters viewport from below
            end: 'bottom top',         // end when section leaves viewport above
            scrub: 0.8,                // smooth catch-up
            onUpdate: (self) => {
                progress = self.progress;  // 0 → 1 as user scrolls through
            }
        });
    }

    // ---- Init on DOM ready ----
    function init() {
        resizeCanvas();
        loadLogoAndCreateParticles();
        setupScrollTrigger();

        // Handle window resize: rebuild particles with new positions
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                resizeCanvas();
                // Re-sample with new dimensions
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = 'assets/images/spider_logo.png';
                img.onload = function () {
                    samplePixels(img);
                };
            }, 250);
        });
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
