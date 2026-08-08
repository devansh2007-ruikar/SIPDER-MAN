document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const preloader = document.getElementById("preloader");
    const counterEl = document.getElementById("loading-counter");
    const clipRect = document.getElementById("spiderClipRect");
    const heroVideo = document.getElementById("hero-bg-video");

    if (!preloader || !counterEl || !clipRect) return;

    // GSAP timeline driving fill and counter
    const tl = gsap.timeline({
        onComplete: () => {
            // Fade out overlay
            preloader.classList.add("hidden");
            // Start video after fade
            if (heroVideo) {
                heroVideo.play().catch(() => {});
            }
            // Remove from DOM after transition
            setTimeout(() => preloader.remove(), 600);
        }
    });

    // Animate clipRect from bottom (y=200,height=0) to top (y=0,height=200)
    tl.to(clipRect, {
        duration: 2.5,
        ease: "power2.inOut",
        attr: { y: 0, height: 200 }
    });

    // Simultaneously animate counter 0 → 100
    tl.to(
        { value: 0 },
        {
            duration: 2.5,
            ease: "power2.inOut",
            value: 100,
            onUpdate: function () {
                const pct = Math.round(this.targets()[0].value);
                counterEl.textContent = `${pct}%`;
            }
        },
        0
    );
});