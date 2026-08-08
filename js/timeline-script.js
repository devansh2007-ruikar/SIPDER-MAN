gsap.registerPlugin(ScrollTrigger);

const carousel = document.querySelector(".carousel");
const suitImg = document.getElementById("main-suit");
const titleEl = document.querySelector(".active-movie-title");
const spiderIndicator = document.querySelector(".spider-indicator");
const dateStops = document.querySelectorAll(".date-stop");

// Arrays matching the 4 poster states
const suits = [
    "assets/images/suit1.png",
    "assets/images/suit2.png",
    "assets/images/suit3.png",
    "assets/images/suit4.png"
];

const movieTitles = [
    "Spider-Man: Homecoming",
    "Spider-Man: Far From Home",
    "Spider-Man: No Way Home",
    "Spider-Man: Brand New Day"
];

let activeIndex = 0;

gsap.to(carousel, {
    rotationY: -270, // Rotate exactly 270 degrees to stop on the 4th poster
    ease: "none",
    scrollTrigger: {
        trigger: "#orbit-timeline",
        start: "center center",
        end: "+=3500", // The length of the scroll/pin duration
        scrub: 1,      // Smooth scrubbing
        pin: true,     // Pin the section while rotating (unpins automatically after 270deg)
        onUpdate: (self) => {
            // MATH LOGIC:
            // Since we only rotate -270 degrees, self.progress (0.0 to 1.0) maps exactly to 3 steps.
            // 0 -> 0 (-0deg), 0.33 -> 1 (-90deg), 0.66 -> 2 (-180deg), 1.0 -> 3 (-270deg)
            let newIndex = Math.round(self.progress * 3);

            // Safety clamp
            if (newIndex < 0) newIndex = 0;
            if (newIndex > 3) newIndex = 3;

            // Move the spider indicator smoothly based on exact progress
            if (spiderIndicator) {
                spiderIndicator.style.top = (self.progress * 100) + "%";
            }

            // Only fire the animation when the index actually changes
            if (newIndex !== activeIndex) {
                activeIndex = newIndex;

                // Highlight the active date stop
                if (dateStops && dateStops.length > 0) {
                    dateStops.forEach((stop, i) => {
                        if (i === activeIndex) {
                            stop.classList.add("active");
                        } else {
                            stop.classList.remove("active");
                        }
                    });
                }

                // Elegant crossfade swap for the suit image
                if (suitImg) {
                    gsap.to(suitImg, {
                        opacity: 0,
                        duration: 0.25,
                        onComplete: () => {
                            suitImg.src = suits[activeIndex];
                            gsap.to(suitImg, { opacity: 1, duration: 0.25 });
                        }
                    });
                }

                // Elegant crossfade swap for the movie title
                if (titleEl) {
                    gsap.to(titleEl, {
                        opacity: 0,
                        duration: 0.25,
                        onComplete: () => {
                            titleEl.textContent = movieTitles[activeIndex];
                            gsap.to(titleEl, { opacity: 1, duration: 0.25 });
                        }
                    });
                }
            }
        }
    }
});
