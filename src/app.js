// src/app.js
// import { createNoise2D, createNoise3D } from 'simplex-noise';

import { initRenderer } from './renderer.js';
import { stateStore as state } from './state.js';
// import { initUI } from './ui/uiManager.js';
import { generateGrid } from './geometry/gridGenerator.js';

const grid = generateGrid();
console.log('Generated grid:', grid);

// Now use the imported state directly.
// Initialize renderer, scene, camera, etc.
initRenderer(state);

// Initialize UI controls (e.g., dat.GUI)
// initUI(state);

// Start the animation loop here (or in renderer.js)
