/**
 * Global state object for the Chladni-Möbius grid project.
 * Stores grid settings, transformation parameters, camera controls, and any other shared data.
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
      
      // Rotation control parameters
      rotationModulation: {
        enabled: true,        // Enable/disable rotation modulation
        interval: 5.0,        // Time interval between direction changes (seconds)
        pattern: "kaprekar",  // Pattern type: "kaprekar", "heaviside", "sine", or "random"
        patternThreshold: 3,  // Threshold value for pattern-based direction changes
      },
    },
    
    // Camera control parameters
    camera: {
      autoAdjust: true,       // Toggle automatic camera adjustment
      followIntensity: 0.05,  // How quickly the camera follows the grid (0-1)
      minZoom: 5,             // Minimum z-distance
      maxZoom: 15,            // Maximum z-distance
      zoomMargin: 1.5,        // Extra zoom-out margin factor
      rotationDamping: 0.3,   // How much to dampen rotation (0-1)
      lookAtCenter: true,     // Whether camera should always look at grid center
      initialPosition: {      // Initial camera position
        x: 0,
        y: 0,
        z: 10
      }
    },
    
    // Audio-related state (if needed)
    audio: {
      currentTrack: null,
      isPlaying: false,
      // Additional parameters extracted from the audio analysis can go here
    },
    
    // Time parameter for animation (can be updated in the render loop)
    time: 0,
    
    // Runtime state
    runtime: {
      rotationDirection: 1,   // Current rotation direction (1 or -1)
      lastRotationTime: 0,    // Last time rotation direction changed
      rotationTimer: 0,       // Timer for rotation modulation
      boundingBox: null,      // Will store the grid's bounding box
      cameraTarget: { x: 0, y: 0, z: 0 }, // Current camera target
      currentZoom: 10,        // Current camera zoom level
    }
  };
  
  /**
   * Updates the time parameter
   * @param {number} newTime - The new time value
   */
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
  
  /**
   * Updates camera control parameters
   * @param {Object} newParams - The new camera parameters to update
   */
  export function updateCameraParams(newParams) {
    Object.assign(stateStore.camera, newParams);
  }
  
  /**
   * Toggles camera auto-adjustment
   * @returns {boolean} The new state of autoAdjust
   */
  export function toggleCameraAutoAdjust() {
    stateStore.camera.autoAdjust = !stateStore.camera.autoAdjust;
    return stateStore.camera.autoAdjust;
  }
  
  /**
   * Updates runtime state parameters
   * @param {Object} newParams - The new runtime parameters to update
   */
  export function updateRuntimeState(newParams) {
    Object.assign(stateStore.runtime, newParams);
  }
  
  /**
   * Changes rotation direction based on specified pattern
   * @param {number} currentTime - The current animation time
   * @returns {number} The new rotation direction (1 or -1)
   */
  export function updateRotationDirection(currentTime) {
    const { rotationModulation } = stateStore.transform;
    const { rotationTimer, lastRotationTime } = stateStore.runtime;
    
    if (!rotationModulation.enabled) {
      return stateStore.runtime.rotationDirection;
    }
    
    // Check if it's time to change direction
    if (rotationTimer - lastRotationTime > rotationModulation.interval) {
      let newDirection = stateStore.runtime.rotationDirection;
      
      // Apply the selected pattern
      switch (rotationModulation.pattern) {
        case "kaprekar":
          // Kaprekar-inspired function - creates a pattern based on modulo
          const kapValue = Math.floor(rotationTimer * 10) % 7;
          newDirection = kapValue < rotationModulation.patternThreshold ? -1 : 1;
          break;
          
        case "heaviside":
          // Heaviside step function - alternates between -1 and 1
          newDirection = stateStore.runtime.rotationDirection * -1;
          break;
          
        case "sine":
          // Sine-based smooth transitions - gradual changes
          newDirection = Math.sin(rotationTimer) > 0 ? 1 : -1;
          break;
          
        case "random":
          // Random direction changes
          newDirection = Math.random() > 0.5 ? 1 : -1;
          break;
          
        default:
          newDirection = stateStore.runtime.rotationDirection * -1;
      }
      
      // Update the runtime state
      stateStore.runtime.rotationDirection = newDirection;
      stateStore.runtime.lastRotationTime = rotationTimer;
    }
    
    return stateStore.runtime.rotationDirection;
  }