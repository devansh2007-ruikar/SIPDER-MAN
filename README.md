# Spider-Man: Brand New Day - Cinematic Web Experience 🕸️

Welcome to the **Spider-Man: Brand New Day** web experience. This project is a highly advanced, cinematic front-end marketing website designed to showcase a fictional upcoming Spider-Man movie. 

Our goal was to push the absolute limits of the modern browser, stepping away from standard static web design to create a dynamic, reactive, and breathtaking user journey. From custom 3D WebGL physics engines to meticulously choreographed GSAP scroll-driven storytelling, this project is designed to feel less like a website and more like a high-end interactive movie trailer.

## ✨ Key Features & Interactions

*   **Cinematic Preloader & Hold-to-Reveal**: A custom global cursor interaction that requires the user to click and hold, building tension before bursting into the main experience.
*   **Scroll-Driven Timeline**: Powered by GSAP and ScrollTrigger, the timeline section smoothly guides users through the narrative, pinning elements and dynamically revealing content as they scroll.
*   **3D Video Spiral Tunnel**: A custom Three.js WebGL effect that maps the movie trailer onto a massive 3D tube geometry, flying the camera through the inside of the video tunnel as you scroll, before shrinking into a sleek background element.
*   **"Liquid Sand" Kinetic Particle Canvas**: A high-performance, custom physics engine rendering 24,000 tiny cinematic sand particles. Using a 3D Raycaster, the particles aggressively repel away from the user's cursor and fluidly snap back, creating an incredibly satisfying, viscous drag effect trapped safely behind the final Call to Action section.
*   **Particle Assembly Engine**: A 2D canvas system that mathematically samples the pixels of the Spider-Man logo and scatters them into chaos, violently re-assembling them as the user scrolls into the viewport.
*   **Ultra-Sharp 4K Rendering**: Custom Device Pixel Ratio (DPR) scaling across all HTML5 Canvases and WebGL renderers, paired with anisotropic texture filtering to ensure crystal-clear fidelity on 4K and Retina displays.

## 🛠️ Tech Stack

This project was built entirely without heavy front-end frameworks (like React or Vue) to maximize performance and maintain raw control over the rendering pipeline and DOM manipulation.

*   **Core**: HTML5, CSS3, Vanilla JavaScript (ES6+)
*   **Animation**: GSAP (GreenSock), ScrollTrigger
*   **3D / WebGL**: Three.js
*   **Shaders & Physics**: Custom GLSL Shaders, Float32Array JS Physics Iteration
*   **Assets**: MP4 Video Textures, High-Res Images, SVGs

## 📂 Folder Structure

```text
├── assets/
│   ├── audio/
│   ├── fonts/
│   ├── images/
│   ├── lottie/
│   ├── videos/
│   └── spiderman-logo.png
├── css/
│   ├── base.css
│   ├── cast-style.css
│   ├── hero.css
│   ├── hold-action.css
│   ├── intro.css
│   ├── preloader.css
│   ├── style.css
│   ├── timeline-style.css
│   └── tokens.css
├── js/
│   ├── adrenaline-embers.js      # Legacy particle hover effect
│   ├── cast-script.js
│   ├── hold-action.js            # Click-and-hold cursor logic
│   ├── interaction-fluid.js      # The 24,000-particle Liquid Sand engine
│   ├── intro.js
│   ├── main.js
│   ├── particle-logo.js          # Scatter/Assemble logo canvas
│   ├── preloader.js
│   ├── timeline-script.js        # GSAP scroll animations
│   └── video-spiral.js           # 3D WebGL video tunnel
├── cast.html
├── index.html                    # Main Entry Point
├── preloader.html
├── script.js                     # Global scripts
├── style.css                     # Global styles
└── timeline.html
```

## 🤖 AI Tools Used

This project was developed through an advanced human-AI collaboration workflow:
- **Architected using Gemini**: Leveraged for conceptualizing the high-end interactions, calculating the complex Three.js math and FOV trigonometry, and aggressively debugging WebGL CORS and tainted canvas issues.
- **Executed using Autonomous Coding Agents**: Agents like Open Code and Nimotron-Ultra were utilized for precise file editing, implementing the bespoke shader logic, and rapidly refactoring complex DOM structures on the fly.

## 🚀 How to Run the Project

**🚨 CRITICAL RUN INSTRUCTIONS 🚨**

Because this project utilizes advanced WebGL, local video textures, and Canvas pixel manipulation, it **CANNOT** be opened by simply double-clicking `index.html` (which uses the `file://` protocol). Modern browser security (CORS) will automatically block the 3D textures from loading, resulting in a black/invisible screen.

You **MUST** run this project via a local web server.

### Option 1: VS Code Live Server (Recommended)
1. Open the project folder in Visual Studio Code.
2. Install the **Live Server** extension by Ritwick Dey.
3. Right-click on `index.html` and select **"Open with Live Server"**.
4. The site will automatically open in your browser (usually at `http://127.0.0.1:5500`).

### Option 2: Python HTTP Server (Terminal)
If you have Python installed on your machine, you can instantly start a server:
1. Open your terminal and navigate to the project directory:
   ```bash
   cd path/to/WEBSITE
   ```
2. Run the following command:
   ```bash
   python3 -m http.server 8080
   ```
3. Open your web browser and navigate to exactly: **`http://localhost:8080`**

---
*Enjoy the cinematic experience!*
