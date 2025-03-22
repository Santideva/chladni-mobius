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
 * Creates a matrix for an enhanced Möbius-like transformation with complex twist calculations.
 * @param {number} x - The original x-coordinate.
 * @param {number} y - The original y-coordinate.
 * @param {number} z - The current z-coordinate (for 3D twist effects).
 * @param {number} time - Current time for animation.
 * @param {object} params - Parameters controlling the twist behaviors.
 * @returns {THREE.Matrix4} A combined rotation matrix for the Möbius effect.
 */
export function createEnhancedMobiusMatrix(x, y, z, time, params) {
  const { factor, noiseScale } = params;
  
  // Calculate distance from origin for radial effects
  const distanceFromOrigin = Math.sqrt(x*x + y*y);
  
  // Create noise-based twist angle variations
  const noiseFactor = noise2D(x * 0.2, y * 0.2) * noiseScale;
  
  // Base twist calculation (distance-based)
  let twistAngle = factor * distanceFromOrigin;
  
  // Enhance with z-coordinate influence (makes it truly 3D)
  twistAngle *= (1 + 0.5 * Math.sin(z * 0.5));
  
  // Add time-based animation and noise variation
  twistAngle += time * 0.1 * (1 + noiseFactor);
  
  // Create rotation matrices for different axes
  const rotationZ = new THREE.Matrix4().makeRotationZ(twistAngle);
  
  // Calculate secondary rotation angle based on position and noise
  const secondaryAngle = factor * 0.5 * (
    Math.sin(distanceFromOrigin) + 
    noise2D(x * 0.1 + time * 0.05, y * 0.1) * noiseScale * 0.5
  );
  
  // Create rotation around Y axis (adds interesting warping)
  const rotationY = new THREE.Matrix4().makeRotationY(secondaryAngle);
  
  // Create rotation around X axis (completes the 3D effect)
  const rotationX = new THREE.Matrix4().makeRotationX(
    factor * 0.3 * noise2D(x * 0.15, time * 0.05) * noiseScale
  );
  
  // Combine matrices: first rotateZ, then rotateY, then rotateX
  // This creates a complex, organic-feeling twist
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
    noiseScale = 0.5,  // Default noise scale if not specified
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
  
  // Create Möbius matrix with knowledge of current z position
  const mobiusMatrix = createEnhancedMobiusMatrix(
    baseX, baseY, tempVector.z, time, 
    { factor: mobiusFactor, noiseScale }
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