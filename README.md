Chladni–Möbius Grid
A minimal, modular Three.js project exploring a 2D grid with Hilbert ordering, flyweight pattern for cells, and planned Chladni/Möbius transformations.

Overview
This project aims to create a dynamic, audio-responsive visualization using a 2D grid that can be transformed according to Chladni modes (vibrational patterns) and Möbius transformations. Our design focuses on minimalism, locality preservation, and modularity.

Current Status
Grid Generation

Implemented a Flyweight Pattern for grid cells:

Each cell only stores intrinsic (x, y) coordinates.

A factory caches and reuses GridCell instances to reduce duplication.

Hilbert Curve Ordering:

We compute a Hilbert index for each (x, y) coordinate.

This ensures spatial locality in the grid data, which can be beneficial for certain transformations or neighbor-based logic.

Central State Management

A stateStore holds global parameters such as:

Grid dimensions (rows, cols)

Transformation parameters (e.g., chladniAmplitude, chladniFrequencyX, etc.)

Audio-related state (for future integration)

A global time parameter (for animations)

Three.js Integration

A basic renderer module sets up a WebGLRenderer, Scene, and Camera.

The grid cells are displayed as red points in a 3D scene for verification.

We see an 8×8 grid sorted by Hilbert order, confirming the flyweight and ordering logic.

Next Steps

Transformations: Implement Chladni vibrational modes and Möbius transformations (either in a CPU-based loop or via shaders).

Audio Modulation: Integrate pre-recorded audio (or real-time analysis) to modulate transformation parameters.

UI Controls: Add dat.GUI or similar to tweak parameters like grid size, Chladni amplitude, or Möbius factors.

Performance & Optimization: Address any performance bottlenecks, especially when scaling up grid size or adding complex transformations.

File Structure
perl
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
│ ├─ shaders/ # Future custom shaders
│ └─ ui/
│ └─ uiManager.js # Future UI controls
├─ vite.config.js # Bundler config (if using Vite)
├─ package.json
├─ package-lock.json
└─ README.md # This file
How to Run
Install Dependencies

bash
Copy
Edit
npm install
Start the Development Server (if using Vite or another bundler)

bash
Copy
Edit
npm run dev
Open in Browser
Typically, the dev server runs on http://localhost:5173 or similar.

Contributing
Issues & Feedback: Open a GitHub issue or discuss improvements in your preferred channel.

Pull Requests: Fork the repo, make changes, and open a pull request for review.

License
(Add your chosen license here, e.g., MIT, Apache-2.0, etc.)
