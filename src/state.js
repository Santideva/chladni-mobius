import * as THREE from 'three';

export const stateStore = {
  // Grid dimensions...
  grid: {
    rows: 32,
    cols: 32,
    resolution: 64,
    density: 1.0,
    needsUpdate: false
  },
  
  // Transformation parameters...
  transform: {
    chladniAmplitude: 1.0,
    chladniFrequencyX: 0.5,
    chladniFrequencyY: 0.5,
    mobiusFactor: 0.3,
    useClassicalMobius: true,
    a_real: 1.0, a_imag: 0.0,
    b_real: 0.0, b_imag: 0.0,
    c_real: 0.0, c_imag: 0.0,
    d_real: 1.0, d_imag: 0.0,
    mobiusAnimationSpeed: 0.1,
    noiseScale: 0.5,
    timeScaleChladni: 1.0,
    timeScaleMobius: 0.5,
    timeScaleNoise: 0.2,
    rotationModulation: {
      enabled: true,
      interval: 5.0,
      pattern: "kaprekar",
      patternThreshold: 3
    }
  },
  
  // Appearance settings
appearance: {
  baseColor: 0xffffff,
  activeColor: 0xffffff,
  useTexture: false,
  textureSource: null,
  textureType: 'image' // or 'video'
},
  
  // Camera control parameters...
  camera: {
    autoAdjust: true,
    followIntensity: 0.05,
    minZoom: 5,
    maxZoom: 15,
    zoomMargin: 1.5,
    rotationDamping: 0.3,
    lookAtCenter: true,
    initialPosition: { x: 0, y: 0, z: 10 }
  },
  
  // Audio-related state...
  audio: {
    currentTrack: null,
    isPlaying: false
  },
  
  // Time parameter
  time: 0,
  
  // Runtime state
  runtime: {
    rotationDirection: 1,
    lastRotationTime: 0,
    rotationTimer: 0,
    boundingBox: new THREE.Box3(),  // <-- Now THREE is defined
    cameraTarget: { x: 0, y: 0, z: 0 },
    currentZoom: 10,
    viewportNeedsUpdate: false
  },
  
  // Interactions state
  interactions: {
    activeCellTransforms: [],
    defaultRadius: 0.5,
    defaultPropagationType: 'gradient'
  }
};

/**
 * Updates the time parameter.
 * @param {number} newTime - The new time value.
 */
export function updateTime(newTime) {
  stateStore.time = newTime;
}

/**
 * Updates transformation parameters.
 * @param {Object} newParams - The new parameter values to update.
 */
export function updateTransformParams(newParams) {
  Object.assign(stateStore.transform, newParams);
}

/**
 * Updates camera control parameters.
 * @param {Object} newParams - The new camera parameters to update.
 */
export function updateCameraParams(newParams) {
  Object.assign(stateStore.camera, newParams);
}

/**
 * Toggles camera auto-adjustment.
 * @returns {boolean} The new state of autoAdjust.
 */
export function toggleCameraAutoAdjust() {
  stateStore.camera.autoAdjust = !stateStore.camera.autoAdjust;
  return stateStore.camera.autoAdjust;
}

/**
 * Updates runtime state parameters.
 * @param {Object} newParams - The new runtime parameters to update.
 */
export function updateRuntimeState(newParams) {
  Object.assign(stateStore.runtime, newParams);
}

/**
 * Changes rotation direction based on specified pattern.
 * @param {number} currentTime - The current animation time.
 * @returns {number} The new rotation direction (1 or -1).
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
