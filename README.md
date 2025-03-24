Chladni–Möbius Grid
A minimal, modular Three.js project that visualizes dynamic grid transformations using Chladni and Möbius patterns with Hilbert ordering, paving the way for audio-responsive, real-time visual effects.

Overview
This project aims to create a dynamic visualization using a 2D grid that can be transformed according to Chladni modes (vibrational patterns) and Möbius transformations. Our design focuses on minimalism, locality preservation, and modularity. The grid is generated using a flyweight pattern and Hilbert ordering to ensure spatial locality, while transformations are applied via custom shader materials. Eventually, these transformations will respond to audio input to create immersive, real-time effects.

Current Status
Grid Generation
Flyweight Pattern:

Each grid cell stores only its intrinsic (x, y) coordinates.

A factory caches and reuses GridCell instances to minimize duplication.

Hilbert Curve Ordering:

A Hilbert index is computed for each (x, y) coordinate, ensuring that spatially close cells remain nearby in memory.

The grid is sorted accordingly for efficient processing.

Central State Management
A stateStore holds global parameters including:

Grid dimensions (rows, cols)

Transformation parameters (e.g., chladniAmplitude, chladniFrequencyX, etc.)

Audio-related state (for future integration)

A global time parameter (for animations)

Three.js Integration
A basic renderer module sets up a WebGLRenderer, Scene, and Camera.

Initially, grid cells are rendered as points (for testing), and later the grid will be rendered as a continuous mesh.

The grid (an 8×8 grid sorted by Hilbert order) confirms the flyweight and ordering logic.

Custom Shader Material
A custom ShaderMaterial is built using GLSL shaders:

Vertex Shader: Applies grid transformations (Chladni, Möbius, noise) to the vertices.

Fragment Shader: Handles coloring and texture mapping.

The ShaderMaterial is designed as a reusable component to be applied to any geometry (e.g., a plane) for dynamic visual effects.

For now, transformation parameters are set so that without audio input, the canvas remains essentially flat, displaying a projected image or video unaltered.

Next Steps
Mesh Integration & Texture Projection:

Convert the grid from discrete points to a continuous mesh (using a plane geometry with sufficient subdivisions).

Project an image or video onto the mesh, so that vertex deformations cause the texture to undulate.

Transformations:

Implement and refine Chladni vibrational modes and Möbius transformations either in a CPU-based loop or via custom vertex shaders.

Audio Modulation:

Integrate pre-recorded audio (or real-time analysis) to drive transformation parameters, so that the grid deforms in response to sound.

Consider using Particle Swarm Optimization (PSO) to optimize transformation parameters for visually pleasing effects.

UI Controls:

Optionally add a UI (e.g., via dat.GUI) to tweak parameters like grid size, transformation intensities, and color settings.

Performance & Optimization:

Address any performance bottlenecks as the grid size increases or as more complex transformations are added.

File Structure
graphql
Copy
Edit
chladni-mobius/
├─ public/
│ ├─ audio/ # Pre-recorded audio files
│ ├─ images/ # Textures/images
│ └─ index.html # Entry point for the web app
├─ src/
│ ├─ app.js # Main bootstrap file (init state, renderer, UI)
│ ├─ state.js # Centralized global state store
│ ├─ renderer.js # Three.js scene setup & animation loop
│ ├─ geometry/
│ │ ├─ GridCell.js # Flyweight cell class
│ │ ├─ gridCellFactory.js # Factory for creating & caching GridCells
│ │ ├─ hilbert.js # Hilbert curve ordering logic
│ │ └─ gridGenerator.js # Generates the grid, sorted by Hilbert index
│ ├─ transforms/ # Future transformations (Chladni, Möbius)
│ ├─ audio/ # Future audio management & processing
│ ├─ shaders/ # Custom shaders (clothVertex.glsl, clothFragment.glsl, etc.)
│ └─ ui/
│ └─ uiManager.js # Future UI controls
├─ materials/
│ └─ clothMaterial.js # Custom ShaderMaterial module (createCombinedCellMobiusMaterial)
├─ vite.config.js # Bundler configuration (if using Vite)
├─ package.json
├─ package-lock.json
└─ README.md # This file

How to Run
Install Dependencies:

bash
Copy
Edit
npm install
Start the Development Server:

bash
Copy
Edit
npm run dev
Open in Browser: Typically, the dev server runs on http://localhost:5173.

Contributing
Issues & Feedback:
Open a GitHub issue or discuss improvements in your preferred channel.

Pull Requests:
Fork the repo, make changes, and open a pull request for review.

License
