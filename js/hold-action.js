document.addEventListener("DOMContentLoaded", () => {
    // 1. Setup the custom cursor tracking
    const cursor = document.querySelector(".custom-cursor");
    
    // Perfectly center the custom cursor CSS transforms using GSAP
    gsap.set(cursor, { xPercent: -50, yPercent: -50 });

    window.addEventListener("mousemove", (e) => {
        gsap.to(cursor, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.1,
            ease: "power2.out"
        });
    });

    // 2. Click & Hold Reveal Logic (Trailer Focus)
    const glassCard = document.querySelector(".glass-card");
    const videoOverlay = document.querySelector(".video-overlay");
    const glassNav = document.querySelector(".glass-nav");
    
    // GSAP Timeline to fade out UI and focus on the background trailer
    const revealTl = gsap.timeline({ paused: true });
    
    revealTl
        // Animate the custom cursor's outer ring (rotate 90deg and scale slightly)
        // Targeting .half-circles keeps the inner text upright and legible!
        .to(".half-circles", { rotation: 90, scale: 1.3, duration: 0.4, ease: "power2.out" }, 0)
        // Instantly fade out main text, nav, and center box
        .to([glassCard, glassNav], { opacity: 0, autoAlpha: 0, duration: 0.3 }, 0)
        // Fade out the dark vignette so the trailer becomes crystal clear
        .to(videoOverlay, { opacity: 0, duration: 0.3 }, 0);

    // Bind event listeners to the entire window for maximum reliability
    window.addEventListener("mousedown", (e) => {
        // Prevent interfering with actual buttons or links
        if (e.target.closest("a") || e.target.closest("button")) return;
        revealTl.play();
    });

    window.addEventListener("mouseup", () => {
        revealTl.reverse();
    });

    window.addEventListener("mouseleave", () => {
        revealTl.reverse();
    });
    
    // Mobile Touch Support
    window.addEventListener("touchstart", (e) => {
        if (e.target.closest("a") || e.target.closest("button")) return;
        revealTl.play();
    }, { passive: true });

    window.addEventListener("touchend", () => {
        revealTl.reverse();
    });
    
    window.addEventListener("touchcancel", () => {
        revealTl.reverse();
    });

    // 3. Context-Aware Cursor Text (ScrollTrigger)
    const cursorText = document.querySelector(".cursor-text");
    
    if (cursorText) {
        ScrollTrigger.create({
            trigger: "#orbit-timeline",
            start: "top center", // Trigger when timeline enters the middle of the screen
            onEnter: () => {
                gsap.to(cursorText, {
                    opacity: 0,
                    duration: 0.15,
                    onComplete: () => {
                        cursorText.innerHTML = "SCROLL<br>DOWN";
                        gsap.to(cursorText, { opacity: 1, duration: 0.15 });
                    }
                });
            },
            onLeaveBack: () => {
                gsap.to(cursorText, {
                    opacity: 0,
                    duration: 0.15,
                    onComplete: () => {
                        cursorText.innerHTML = "CLICK<br>& HOLD";
                        gsap.to(cursorText, { opacity: 1, duration: 0.15 });
                    }
                });
            }
        });
    }
});
