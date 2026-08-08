document.addEventListener("DOMContentLoaded", () => {
    // 1. Elements
    const preloader = document.getElementById("preloader");
    const counterEl = document.getElementById("loading-counter");
    const fillLogo = document.querySelector(".fill-logo");
    const heroVideo = document.getElementById("hero-bg-video");

    if (!preloader || !counterEl || !fillLogo) return;

    // GSAP variables for smooth interpolation
    let currentProgress = 0;
    let targetProgress = 0;
    let isLoadingComplete = false;

    // Simulate natural asset loading progress (jumps up to 90% randomly)
    const loadingInterval = setInterval(() => {
        if (targetProgress < 90) {
            targetProgress += Math.random() * 10 + 5; // Random jump between 5% and 15%
            if (targetProgress > 90) targetProgress = 90;
        }
    }, 150);

    // 2. Window Load Event (Actual asset load)
    window.addEventListener("load", () => {
        isLoadingComplete = true;
        targetProgress = 100; // Snap the target to 100% once everything is ready
        clearInterval(loadingInterval);
    });

    // Use GSAP's ticker to smoothly interpolate between currentProgress and targetProgress
    const updateProgress = () => {
        // LERP for silky smooth text counting and masking
        currentProgress += (targetProgress - currentProgress) * 0.1;
        
        const percent = Math.min(100, Math.max(0, Math.floor(currentProgress)));
        
        // Update Counter
        counterEl.innerText = `${percent}%`;

        // Update Fill Clip-Path (Bottom to Top Reveal)
        // inset(100% 0 0 0) means completely clipped from the top.
        // As percent goes to 100, inset goes to 0%.
        const clipVal = 100 - currentProgress;
        fillLogo.style.clipPath = `inset(${clipVal}% 0% 0% 0%)`;
        fillLogo.style.webkitClipPath = `inset(${clipVal}% 0% 0% 0%)`; // Safari support

        // Check if we hit 100% and assets are fully loaded
        if (isLoadingComplete && currentProgress >= 99.5) {
            currentProgress = 100;
            counterEl.innerText = `100%`;
            fillLogo.style.clipPath = `inset(0% 0% 0% 0%)`;
            
            // Stop the ticker
            gsap.ticker.remove(updateProgress); 
            
            // Trigger the exit timeline
            triggerExitReveal();
        }
    };

    gsap.ticker.add(updateProgress);

    // 3. The Exit & Media Reveal
    function triggerExitReveal() {
        const exitTl = gsap.timeline();

        exitTl
            // a) Hold at 100% for 0.5s for dramatic effect
            .to(preloader, { duration: 0.5 }) 
            // b) Smoothly fade out the overlay
            .to(preloader, { opacity: 0, duration: 0.8, ease: "power2.inOut" })
            // c) Remove from interaction flow
            .set(preloader, { pointerEvents: "none", display: "none" })
            // d) Start the video ONLY after the preloader fades completely
            .call(() => {
                if (heroVideo) {
                    heroVideo.play().catch(e => console.warn("Video autoplay prevented by browser:", e));
                }
            });
    }
});
