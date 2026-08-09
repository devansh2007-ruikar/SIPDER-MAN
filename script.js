// --- 1. COUNTDOWN TIMER ---
const initCountdown = () => {
    // Target date: December 15 of the current year (or next year if already passed)
    const now = new Date();
    let targetYear = now.getFullYear();
    let targetDate = new Date(targetYear, 11, 15, 0, 0, 0); // Month is 0-indexed, so 11 = December

    if (now > targetDate) {
        targetYear += 1;
        targetDate = new Date(targetYear, 11, 15, 0, 0, 0);
    }

    const updateTimer = () => {
        const currentTime = new Date();
        const difference = targetDate - currentTime;

        if (difference < 0) return; // Reached target

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        const daysEl = document.getElementById('days');
        if (daysEl) {
            daysEl.textContent = days.toString().padStart(2, '0');
            document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
            document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
            document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
        }
    };

    updateTimer();
    setInterval(updateTimer, 1000);
};

// --- 2. INTERSECTION OBSERVER (Scroll Reveal) ---
const initScrollReveal = () => {
    const reveals = document.querySelectorAll('.reveal');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Trigger when 15% of the element is visible
    };

    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: Stop observing once revealed to only animate once
                observer.unobserve(entry.target);
            }
        });
    };

    const observer = new IntersectionObserver(revealCallback, observerOptions);

    reveals.forEach(reveal => {
        observer.observe(reveal);
    });
};

// --- 3. SPIDEY EASTER EGG ---
const initSpideyEasterEgg = () => {
    // Only run if GSAP is loaded and the elements exist
    if (typeof gsap === 'undefined') return;

    const webString = document.querySelector('.web-string');
    const spidey = document.getElementById('spidey-hanging');

    if (webString && spidey) {
        // Trigger 1 second after page load
        setTimeout(() => {
            const tl = gsap.timeline();

            tl.to(webString, {
                height: 120,
                duration: 1.5,
                ease: "bounce.out"
            }, 0) // start at timeline 0
                .to(spidey, {
                    y: 0,
                    duration: 1.5,
                    ease: "bounce.out"
                }, 0); // start at timeline 0
        }, 1000);
    }
};

// --- 4. CINEMATIC AUDIO & VIDEO TOGGLE ---
const initAudioToggle = () => {
    const audioBtn = document.getElementById('audio-toggle-btn');
    const bgVideo = document.getElementById('hero-bg-video');
    const bgAudio = document.getElementById('bg-audio');
    const btnText = audioBtn ? audioBtn.querySelector('.audio-btn-text') : null;

    if (!audioBtn) return;

    let isPlaying = false;
    let fadeInterval = null;

    // Smooth Volume Fade Utility
    const fadeAudio = (targetVolume, duration = 600, onComplete) => {
        const media = (bgAudio && bgAudio.src && bgAudio.src.length > 0 && !bgAudio.error) ? bgAudio : bgVideo;
        if (!media) return;

        clearInterval(fadeInterval);
        const startVolume = media.volume || 0;
        const steps = 30;
        const stepTime = duration / steps;
        const volumeStep = (targetVolume - startVolume) / steps;
        let currentStep = 0;

        fadeInterval = setInterval(() => {
            currentStep++;
            let newVol = media.volume + volumeStep;

            if (newVol >= 1) newVol = 1;
            if (newVol <= 0) newVol = 0;

            media.volume = newVol;

            if (currentStep >= steps || newVol === targetVolume) {
                clearInterval(fadeInterval);
                media.volume = targetVolume;
                if (onComplete) onComplete();
            }
        }, stepTime);
    };

    const toggleAudio = (forcePlay = false) => {
        const hasSeparateAudioTrack = bgAudio && bgAudio.getAttribute('src') && bgAudio.getAttribute('src').trim() !== '';

        if (!isPlaying || forcePlay) {
            if (isPlaying) return; // Prevent double trigger if already playing

            if (hasSeparateAudioTrack) {
                bgAudio.volume = 0;
                const playPromise = bgAudio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        fadeAudio(1.0, 600);
                        audioBtn.classList.add('is-playing');
                        if (btnText) btnText.textContent = 'MUTE AUDIO';
                        isPlaying = true;
                    }).catch(() => {
                        // Playback prevented by browser autoplay policy
                        // Fallback to background video if it exists
                        if (bgVideo) {
                            bgVideo.muted = false;
                            bgVideo.volume = 0;
                            fadeAudio(1.0, 600);
                            audioBtn.classList.add('is-playing');
                            if (btnText) btnText.textContent = 'MUTE AUDIO';
                            isPlaying = true;
                        } else {
                            // No video fallback and audio blocked. Reset button UI.
                            audioBtn.classList.remove('is-playing');
                            if (btnText) btnText.textContent = 'UNMUTE SOUND';
                            isPlaying = false;

                            // Re-arm the auto-play listener so the next click works
                            document.addEventListener('click', autoPlayOnce);
                        }
                    });
                }
            } else if (bgVideo) {
                bgVideo.muted = false;
                bgVideo.volume = 0;
                fadeAudio(1.0, 600);
                audioBtn.classList.add('is-playing');
                if (btnText) btnText.textContent = 'MUTE AUDIO';
                isPlaying = true;
            }
        } else {
            fadeAudio(0, 500, () => {
                if (hasSeparateAudioTrack) {
                    bgAudio.pause();
                } else if (bgVideo) {
                    bgVideo.muted = true;
                }
            });

            audioBtn.classList.remove('is-playing');
            if (btnText) btnText.textContent = 'UNMUTE SOUND';
            isPlaying = false;
        }
    };

    // Toggle on button click
    audioBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering the global listener below
        toggleAudio();
    });

    // Auto-unmute on the first user interaction anywhere on the page
    const autoPlayOnce = () => {
        if (!isPlaying) toggleAudio(true);
        // Remove listeners after first interaction
        document.removeEventListener('click', autoPlayOnce);
        document.removeEventListener('touchstart', autoPlayOnce);
    };

    // Always attempt auto-play on first interaction, even if we attempt on load
    document.addEventListener('click', autoPlayOnce);
    document.addEventListener('touchstart', autoPlayOnce, { once: true });

    // Check Session Storage for cross-page persistence
    const savedTime = sessionStorage.getItem('spidey_audioTime');
    const wasPlaying = sessionStorage.getItem('spidey_isPlaying') === 'true';

    if (bgAudio && wasPlaying) {
        const attemptPlay = () => {
            if (savedTime) bgAudio.currentTime = parseFloat(savedTime);
            bgAudio.muted = false;
            bgAudio.volume = 1.0;

            const playPromise = bgAudio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    audioBtn.classList.add('is-playing');
                    if (btnText) btnText.textContent = 'MUTE AUDIO';
                    isPlaying = true;
                }).catch(() => {
                    // Silently fail, wait for user interaction
                    isPlaying = false;
                });
            }
        };

        // Try playing immediately, or wait for canplay to prevent the silent play bug
        if (bgAudio.readyState >= 2) {
            attemptPlay();
        } else {
            bgAudio.addEventListener('canplay', attemptPlay, { once: true });
        }
    } else if (bgAudio && savedTime) {
        // Just set the time if it wasn't playing
        bgAudio.currentTime = parseFloat(savedTime);
    }

    // Before leaving the page, save the state
    window.addEventListener('beforeunload', () => {
        if (bgAudio) {
            sessionStorage.setItem('spidey_audioTime', bgAudio.currentTime);
            sessionStorage.setItem('spidey_isPlaying', isPlaying);
        }
    });

    // Handle Trailer Links: Prevent music from starting, or pause it if it is playing
    const trailerLinks = document.querySelectorAll('a[href*="youtu"]');
    trailerLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the global autoPlayOnce from firing
            if (isPlaying) {
                toggleAudio(); // Pause the music so they can watch the trailer in peace
            }
        });
    });
};



// --- 5. HAMBURGER MENU TOGGLE ---
const initHamburgerMenu = () => {
    const hamburger = document.querySelector('.hamburger-menu');
    const navLinks = document.querySelector('.nav-links');

    if (!hamburger || !navLinks) return;

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close menu when a link is tapped
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
};

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initCountdown();
    initScrollReveal();
    initSpideyEasterEgg();
    initAudioToggle();
    initHamburgerMenu();
});
