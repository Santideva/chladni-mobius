/**
 * Global state object for the Chladni-Möbius grid project.
 * Stores grid settings, transformation parameters, and any other shared data.
 */
export const stateStore = {
    // Grid dimensions (should match the requirements for Hilbert ordering, if applicable)
    grid: {
      rows: 32,  // Increased for more detailed visualization
      cols: 32,  // Increased for more detailed visualization
    },
    // Transformation parameters
    transform: {
      // Chladni wave parameters
      chladniAmplitude: 1.0,
      chladniFrequencyX: 0.5,
      chladniFrequencyY: 0.5,
      
      // Möbius transformation parameters
      mobiusFactor: 0.3,
      
      // Classical Möbius transformation parameters
      useClassicalMobius: true, // Set to true to use classical Möbius transform instead of enhanced
      a_real: 1.0, a_imag: 0.0,  // Default is identity transformation (z → z)
      b_real: 0.0, b_imag: 0.0,
      c_real: 0.0, c_imag: 0.0,
      d_real: 1.0, d_imag: 0.0,
      mobiusAnimationSpeed: 0.1,
      
      // Noise parameters
      noiseScale: 0.5,  // Controls how much noise affects the transformations
      
      // Animation speed multipliers
      timeScaleChladni: 1.0,  // Relative speed of Chladni pattern evolution
      timeScaleMobius: 0.5,   // Relative speed of Möbius twist evolution
      timeScaleNoise: 0.2,    // Relative speed of noise pattern evolution
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
  
  /**
   * Updates transformation parameters
   * @param {Object} newParams - The new parameter values to update
   */
  export function updateTransformParams(newParams) {
    Object.assign(stateStore.transform, newParams);
  }