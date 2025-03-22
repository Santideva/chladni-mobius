// src/state.js

/**
 * Global state object for the Chladni-Möbius grid project.
 * Stores grid settings, transformation parameters, and any other shared data.
 */
export const stateStore = {
    // Grid dimensions (should match the requirements for Hilbert ordering, if applicable)
    grid: {
      rows: 8,  // Example: 8 rows (must be a power of 2 for Hilbert ordering)
      cols: 8,  // Example: 8 columns
    },
    // Transformation parameters
    transform: {
      chladniAmplitude: 1.0,
      chladniFrequencyX: 0.5,
      chladniFrequencyY: 0.5,
      mobiusFactor: 0.3,
    },
    // Audio-related state (if needed)
    audio: {
      currentTrack: null,
      isPlaying: false,
      // Additional parameters extracted from the audio analysis can go here
    },
    // Time parameter for animation (can be updated in the render loop)
    time: 0,
  };
  
  export function updateTime(newTime) {
    stateStore.time = newTime;
  }
  