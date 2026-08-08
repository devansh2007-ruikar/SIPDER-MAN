document.addEventListener("DOMContentLoaded", () => {
    const darkroom = document.getElementById("darkroom-section");

    // Safety check
    if (!darkroom) return;

    // We create a proxy object to hold our X and Y coordinates.
    // GSAP will animate this proxy object, and we use an onUpdate 
    // callback to apply those values to the CSS variables.
    // This gives us that buttery-smooth, cinematic "trailing" flashlight feel.

    const cursorProxy = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
    };

    // Listen for mouse movement over the section
    darkroom.addEventListener("mousemove", (e) => {
        gsap.to(cursorProxy, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.3, // Cinematic "weight" / lag
            ease: "power2.out",
            onUpdate: () => {
                // Apply the smoothly interpolated values to the CSS variables
                darkroom.style.setProperty("--x", `${cursorProxy.x}px`);
                darkroom.style.setProperty("--y", `${cursorProxy.y}px`);
            }
        });
    });

    // Optional: Reset the spotlight to the center when mouse leaves the window
    document.addEventListener("mouseleave", () => {
        gsap.to(cursorProxy, {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            duration: 1,
            ease: "power3.out",
            onUpdate: () => {
                darkroom.style.setProperty("--x", `${cursorProxy.x}px`);
                darkroom.style.setProperty("--y", `${cursorProxy.y}px`);
            }
        });
    });
});
