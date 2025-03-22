import { initRenderer } from './renderer.js';
import { initState } from './state.js';
import { initUI } from './ui/uiManager.js';

// Initialize global state
const state = initState();

// Initialize renderer, scene, camera, etc.
initRenderer(state);

// Initialize UI controls (e.g., dat.GUI)
initUI(state);

// Start the animation loop here (or in renderer.js)
