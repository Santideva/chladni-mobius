import * as THREE from '../../node_modules/three/build/three.module.js';
import { createNoise2D, createNoise3D, createNoise4D } from 'simplex-noise';
import { stateStore } from '../state.js';

// Initialize noise generators - create once for consistent noise patterns
const noise2D = createNoise2D();
const noise3D = createNoise3D();

/**
 * Applies a Chladni transformation using Matrix4 operations with noise modulation.
 * @param {number} x - The original x-coordinate.
 * @param {number} y - The original y-coordinate.
 * @param {number} time - Current time (for animation).
 * @param {number} amplitude - Chladni amplitude factor.
 * @param {number} freqX - Chladni frequency factor along the x-axis.
 * @param {number} freqY - Chladni frequency factor along the y-axis.
 * @param {number} noiseScale - Controls the influence of noise.
 * @returns {THREE.Matrix4} A transformation matrix for the Chladni effect.
 */
export function createChladniMatrix(x, y, time, amplitude, freqX, freqY, noiseScale) {
  // Basic Chladni pattern
  const baseZ = Math.sin(freqX * x + time) * Math.sin(freqY * y + time);
  
  // Add noise modulation
  // Use different time scales for noise to create evolving patterns
  const noise = noise3D(
    x * 0.1, 
    y * 0.1, 
    time * 0.05
  );
  
  // Combine base pattern with noise
  const z = amplitude * (baseZ + noise * noiseScale);
  
  // Create a translation matrix that moves the point in the z-direction
  const translationMatrix = new THREE.Matrix4();
  translationMatrix.makeTranslation(0, 0, z);
  
  return translationMatrix;
}

/**
 * Applies a classical Möbius transformation to a point.
 * The transformation follows the form f(z) = (az + b)/(cz + d) where z = x + iy
 * @param {number} x - The original x-coordinate.
 * @param {number} y - The original y-coordinate.
 * @param {number} time - Current time for animation.
 * @param {object} params - Parameters controlling the Möbius transformation.
 * @returns {THREE.Vector3} The transformed point as a THREE.Vector3.
 */
function applyClassicalMobius(x, y, time, params) {
  const { 
    a_real = 1.0, a_imag = 0.0,
    b_real = 0.0, b_imag = 0.0,
    c_real = 0.0, c_imag = 0.0,
    d_real = 1.0, d_imag = 0.0,
    animationSpeed = 0.1
  } = params;
  
  // Convert (x,y) to complex number z = x + iy
  let z_real = x;
  let z_imag = y;
  
  // Add time-based animation to the parameters
  const timePhase = time * animationSpeed;
  const a = {
    real: a_real * Math.cos(timePhase) - a_imag * Math.sin(timePhase),
    imag: a_real * Math.sin(timePhase) + a_imag * Math.cos(timePhase)
  };
  const b = {
    real: b_real,
    imag: b_imag
  };
  const c = {
    real: c_real,
    imag: c_imag
  };
  const d = {
    real: d_real,
    imag: d_imag
  };
  
  // Calculate (a*z + b)
  const numerator = {
    real: a.real * z_real - a.imag * z_imag + b.real,
    imag: a.real * z_imag + a.imag * z_real + b.imag
  };
  
  // Calculate (c*z + d)
  const denominator = {
    real: c.real * z_real - c.imag * z_imag + d.real,
    imag: c.real * z_imag + c.imag * z_real + d.imag
  };
  
  // Calculate (a*z + b)/(c*z + d)
  const denomMagnitudeSq = denominator.real * denominator.real + denominator.imag * denominator.imag;
  
  // Guard against division by zero
  if (denomMagnitudeSq < 0.0001) {
    // Return a large but finite value in the direction of the numerator
    const numeratorMagnitude = Math.sqrt(numerator.real * numerator.real + numerator.imag * numerator.imag);
    if (numeratorMagnitude < 0.0001) {
      return new THREE.Vector3(0, 0, 0);
    }
    const scale = 1000 / numeratorMagnitude;
    return new THREE.Vector3(numerator.real * scale, numerator.imag * scale, 0);
  }
  
  // Perform complex division
  const result = {
    real: (numerator.real * denominator.real + numerator.imag * denominator.imag) / denomMagnitudeSq,
    imag: (numerator.imag * denominator.real - numerator.real * denominator.imag) / denomMagnitudeSq
  };
  
  // Return the transformed point (z')
  return new THREE.Vector3(result.real, result.imag, 0);
}

/**
 * Creates a matrix for a classical Möbius transformation.
 * @param {number} x - The original x-coordinate.
 * @param {number} y - The original y-coordinate.
 * @param {number} time - Current time for animation.
 * @param {object} params - Parameters controlling the Möbius transformation.
 * @returns {THREE.Matrix4} A transformation matrix for the classical Möbius effect.
 */
function createClassicalMobiusMatrix(x, y, time, params) {
  // Apply the Möbius transformation to get the new position
  const transformedPos = applyClassicalMobius(x, y, time, params);
  
  // Create a translation matrix from the original position to the transformed position
  const translationMatrix = new THREE.Matrix4();
  translationMatrix.makeTranslation(
    transformedPos.x - x,
    transformedPos.y - y,
    transformedPos.z
  );
  
  return translationMatrix;
}

/**
 * Creates a matrix for an enhanced Möbius-like transformation with complex twist calculations.
 * @param {number} x - The original x-coordinate.
 * @param {number} y - The original y-coordinate.
 * @param {number} z - The current z-coordinate (for 3D twist effects).
 * @param {number} time - Current time for animation.
 * @param {object} params - Parameters controlling the twist behaviors.
 * @returns {THREE.Matrix4} A combined rotation matrix for the Möbius effect.
 */
export function createEnhancedMobiusMatrix(x, y, z, time, params) {
  // Destructure compensationFactor with a default value (range: 0 to 1)
  const { factor, noiseScale, compensationFactor = 0.5 } = params;
  
  const distanceFromOrigin = Math.sqrt(x * x + y * y);
  const noiseFactor = noise2D(x * 0.2, y * 0.2) * noiseScale;
  
  // Original twist calculation
  let twistAngle = factor * distanceFromOrigin;
  twistAngle *= (1 + 0.5 * Math.sin(z * 0.5));
  twistAngle += time * 0.1 * (1 + noiseFactor);
  
  // **Hybrid Behavior:**
  // Adjust the twist angle to preserve organic motion while reducing the overall rotation.
  // const adjustedTwistAngle = 0;
  
  // Create rotation around the Z-axis with the adjusted angle.
  const rotationZ = new THREE.Matrix4().makeRotationZ(adjustedTwistAngle);
  
  const secondaryAngle = factor * 0.5 * (
    Math.sin(distanceFromOrigin) + 
    noise2D(x * 0.1 + time * 0.05, y * 0.1) * noiseScale * 0.5
  );
  
  const rotationY = new THREE.Matrix4().makeRotationY(secondaryAngle);
  const rotationX = new THREE.Matrix4().makeRotationX(
    factor * 0.3 * noise2D(x * 0.15, time * 0.05) * noiseScale
  );
  
  const combinedRotation = new THREE.Matrix4();
  combinedRotation.multiply(rotationX);
  combinedRotation.multiply(rotationY);
  combinedRotation.multiply(rotationZ);
  
  return combinedRotation;
}

/**
 * Creates a noise-based displacement matrix to add organic variation.
 * @param {number} x - The original x-coordinate.
 * @param {number} y - The original y-coordinate.
 * @param {number} time - Current time for animation.
 * @param {number} scale - Scale of the noise effect.
 * @returns {THREE.Matrix4} A translation matrix for noise-based displacement.
 */
export function createNoiseDisplacementMatrix(x, y, time, scale) {
  // Generate 3D noise for each axis with different frequencies
  const displacementX = noise3D(x * 0.2, y * 0.2, time * 0.1) * scale;
  const displacementY = noise3D(x * 0.2, y * 0.2, time * 0.15 + 100) * scale;
  const displacementZ = noise3D(x * 0.2, y * 0.2, time * 0.05 + 200) * scale * 0.5;
  
  // Create translation matrix for the noise-based displacement
  const displacementMatrix = new THREE.Matrix4();
  displacementMatrix.makeTranslation(displacementX, displacementY, displacementZ);
  
  return displacementMatrix;
}

/**
 * Creates a matrix for the chosen Möbius transformation (either enhanced or classical).
 * @param {number} x - The original x-coordinate.
 * @param {number} y - The original y-coordinate.
 * @param {number} z - The current z-coordinate (for 3D twist effects).
 * @param {number} time - Current time for animation.
 * @param {object} params - Parameters controlling the twist behaviors.
 * @returns {THREE.Matrix4} A transformation matrix for the Möbius effect.
 */
function createMobiusMatrix(x, y, z, time, params) {
  const { 
    useClassicalMobius = false,
    factor = 0.3, 
    noiseScale = 0.5,
    a_real = 1.0, a_imag = 0.0,
    b_real = 0.0, b_imag = 0.0,
    c_real = 0.0, c_imag = 0.0,
    d_real = 1.0, d_imag = 0.0,
    animationSpeed = 0.1,
    compensationFactor // Expect this parameter to be provided in stateStore.transform if desired.
  } = params;
  
  if (useClassicalMobius) {
    return createClassicalMobiusMatrix(x, y, time, {
      a_real, a_imag,
      b_real, b_imag,
      c_real, c_imag,
      d_real, d_imag,
      animationSpeed
    });
  } else {
    return createEnhancedMobiusMatrix(x, y, z, time, {
      factor,
      noiseScale,
      compensationFactor // Pass along the compensationFactor for hybrid behavior.
    });
  }
}

/**
 * Combines all transformations into one final transformation matrix.
 * @param {number} baseX - Intrinsic x-coordinate from GridCell.
 * @param {number} baseY - Intrinsic y-coordinate from GridCell.
 * @param {number} time - Current time (for animation).
 * @param {object} transformParams - An object containing all relevant parameters.
 * @returns {THREE.Matrix4} The combined transformation matrix.
 */
export function createCombinedMatrix(baseX, baseY, time, params) {
  // Extract parameters with defaults for new fields
  const {
    chladniAmplitude = 1.0,
    chladniFrequencyX = 0.5,
    chladniFrequencyY = 0.5,
    mobiusFactor = 0.3,
    noiseScale = 0.5,
    
    // Classical Möbius parameters
    useClassicalMobius = false,
    a_real = 1.0, a_imag = 0.0,
    b_real = 0.0, b_imag = 0.0,
    c_real = 0.0, c_imag = 0.0,
    d_real = 1.0, d_imag = 0.0,
    mobiusAnimationSpeed = 0.1
  } = params;
  
  // Create individual transformation matrices
  
  // Initial position matrix (place point at its base coordinates)
  const positionMatrix = new THREE.Matrix4();
  positionMatrix.makeTranslation(baseX, baseY, 0);
  
  // Apply noise displacement first for organic variety
  const noiseMatrix = createNoiseDisplacementMatrix(
    baseX, baseY, time, noiseScale * 0.5  // Use half the noiseScale for displacement
  );
  
  // Create temporary vector to extract z position after initial transforms
  // We need this to feed z into the Möbius calculation for 3D twisting
  const tempVector = new THREE.Vector3(0, 0, 0);
  const tempMatrix = new THREE.Matrix4().multiplyMatrices(noiseMatrix, positionMatrix);
  tempVector.setFromMatrixPosition(tempMatrix);
  
  // Create Möbius matrix with either classical or enhanced implementation
  const mobiusMatrix = createMobiusMatrix(
    tempVector.x, tempVector.y, tempVector.z, time, 
    { 
      useClassicalMobius,
      factor: mobiusFactor, 
      noiseScale,
      a_real, a_imag,
      b_real, b_imag,
      c_real, c_imag,
      d_real, d_imag,
      animationSpeed: mobiusAnimationSpeed
    }
  );
  
  // Create Chladni matrix with noise modulation
  const chladniMatrix = createChladniMatrix(
    baseX, baseY, time,
    chladniAmplitude,
    chladniFrequencyX,
    chladniFrequencyY,
    noiseScale
  );
  
  // Combine matrices in sequence:
  // 1. Start at base position
  // 2. Add initial noise displacement for variety
  // 3. Apply Möbius twist/rotation
  // 4. Apply Chladni wave pattern with noise
  
  const combinedMatrix = new THREE.Matrix4();
  combinedMatrix.multiply(chladniMatrix);    // Apply last
  combinedMatrix.multiply(mobiusMatrix);     // Apply third
  combinedMatrix.multiply(noiseMatrix);      // Apply second
  combinedMatrix.multiply(positionMatrix);   // Apply first
  
  return combinedMatrix;
}

/**
 * Transforms a position using the combined matrix approach.
 * @param {number} x - Intrinsic x-coordinate from GridCell.
 * @param {number} y - Intrinsic y-coordinate from GridCell.
 * @returns {{ x: number, y: number, z: number }} The final transformed position.
 */
export function transformPosition(x, y) {
  const { transform, time } = stateStore;
  
  // Create the combined transformation matrix
  const matrix = createCombinedMatrix(x, y, time, transform);
  
  // Create a vector for the original position (0,0,0 because the position is already in the matrix)
  const position = new THREE.Vector3(0, 0, 0);
  
  // Apply the matrix to transform the position
  position.applyMatrix4(matrix);
  
  // Return the transformed position as a plain object
  return {
    x: position.x,
    y: position.y,
    z: position.z
  };
} 

/**
 * Computes the twist angle used in the enhanced Möbius transformation.
 * @param {number} x - The original x-coordinate.
 * @param {number} y - The original y-coordinate.
 * @param {number} z - The current z-coordinate.
 * @param {number} time - Current time (for animation).
 * @param {object} params - Parameters controlling the twist behaviors (must include factor and noiseScale).
 * @returns {number} The computed twist angle.
 */
export function computeTwistAngle(x, y, z, time, params) {
  
  const { factor, noiseScale } = params;
  // Compute distance from origin for radial effects
  const distanceFromOrigin = Math.sqrt(x * x + y * y);
  
  // Create noise-based twist angle variations
  // (Ensure you import and use noise2D consistently)
  const noiseFactor = noise2D(x * 0.2, y * 0.2) * noiseScale;
  
  // Base twist calculation (distance-based)
  let twistAngle = factor * distanceFromOrigin;
  
  // Enhance with z-coordinate influence (makes it truly 3D)
  twistAngle *= (1 + 0.5 * Math.sin(z * 0.5));
  
  // Add time-based animation and noise variation
  twistAngle += time * 0.1 * (1 + noiseFactor);
  
  return twistAngle;
}
