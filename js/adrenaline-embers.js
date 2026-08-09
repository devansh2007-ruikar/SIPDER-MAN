// =========================================================
// Adrenaline Embers Particle Engine
// =========================================================

(function() {
    'use strict';
    
    const canvas = document.getElementById('adrenaline-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const ctaContainer = document.querySelector('.final-cta-container');
    
    let particles = [];
    let isAdrenaline = false;

    // Resize handling
    function resize() {
        const parent = canvas.parentElement;
        const rect = parent.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }
    
    window.addEventListener('resize', resize);
    
    class Particle {
        constructor() {
            this.reset();
            // Randomize starting Y so they don't all spawn at once
            const parent = canvas.parentElement;
            const height = parent.clientHeight || window.innerHeight;
            this.y = Math.random() * height;
        }
        
        reset() {
            const parent = canvas.parentElement;
            const width = parent.clientWidth || window.innerWidth;
            const height = parent.clientHeight || window.innerHeight;
            
            this.x = Math.random() * width;
            this.y = height + Math.random() * 100; // Spawn slightly below
            
            // Base slow upward drift
            this.baseVy = -0.3 - Math.random() * 0.8;
            this.baseVx = -0.5 + Math.random();
            this.vy = this.baseVy;
            this.vx = this.baseVx;
            this.size = Math.random() * 2.5 + 0.5;
            
            // Randomly choose colors (Spider-Man red, orange, white)
            const colors = ['#E60012', '#ff4500', '#ffffff'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
            
            this.baseOpacity = Math.random() * 0.3 + 0.1;
            this.opacity = this.baseOpacity;
            
            // Target variables for smooth transition
            this.targetVy = this.baseVy;
            this.targetOpacity = this.baseOpacity;
        }
        
        update() {
            const parent = canvas.parentElement;
            const width = parent.clientWidth || window.innerWidth;
            const height = parent.clientHeight || window.innerHeight;

            // Lerp towards targets
            this.vy += (this.targetVy - this.vy) * 0.05;
            this.opacity += (this.targetOpacity - this.opacity) * 0.05;
            
            // Adds a bit of organic horizontal wavering
            const sway = Math.sin(Date.now() * 0.001 + this.x) * 0.2;
            
            this.y += this.vy;
            this.x += this.vx + sway;
            
            // Respawn at bottom if floats past top
            if (this.y < -20) {
                this.reset();
            }
            if (this.x < -20) this.x = width + 20;
            if (this.x > width + 20) this.x = -20;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.opacity;
            ctx.fill();
        }
    }
    
    function init() {
        resize();
        // Generate 75 ember particles
        for (let i = 0; i < 75; i++) {
            particles.push(new Particle());
        }
        
        if (ctaContainer) {
            ctaContainer.addEventListener('mouseenter', triggerAdrenaline);
            ctaContainer.addEventListener('mouseleave', releaseAdrenaline);
        }
        
        animate();
    }
    
    function triggerAdrenaline() {
        isAdrenaline = true;
        canvas.classList.add('glitch-active');
        particles.forEach(p => {
            // Violently multiply upward speed
            p.targetVy = p.baseVy * (Math.random() * 6 + 6); 
            // Increase opacity
            p.targetOpacity = Math.random() * 0.5 + 0.5; // 50% to 100%
        });
    }
    
    function releaseAdrenaline() {
        isAdrenaline = false;
        canvas.classList.remove('glitch-active');
        particles.forEach(p => {
            // Smoothly return to base state
            p.targetVy = p.baseVy;
            p.targetOpacity = p.baseOpacity;
        });
    }
    
    function animate() {
        const parent = canvas.parentElement;
        const width = parent.clientWidth || window.innerWidth;
        const height = parent.clientHeight || window.innerHeight;
        
        ctx.clearRect(0, 0, width, height);
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    // Initialize immediately (DOM elements are ready as script is at bottom)
    init();
})();
