import * as THREE from '../node_modules/three/build/three.module.js';
import { generateGrid } from './geometry/gridGenerator.js';
import { stateStore, updateRuntimeState, updateRotationDirection } from './state.js';
import { transformPosition } from './transforms/transformation.js';

export function initRenderer(state) {
  // Create the renderer, scene, and camera
  const canvas = document.getElementById('three-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  
  // Set initial camera position from state
  const { initialPosition } = state.camera;
  camera.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
  
  // Initialize runtime state
  state.runtime.currentZoom = camera.position.z;
  state.runtime.cameraTarget = new THREE.Vector3(0, 0, 0);
  state.runtime.boundingBox = new THREE.Box3();

  // Generate the grid
  const grid = generateGrid();

  // Create a BufferGeometry and an initial positions array
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(grid.length * 3);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Add color attribute for visualizing transformations
  const colors = new Float32Array(grid.length * 3);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Use vertex colors in the material
  const material = new THREE.PointsMaterial({ 
    size: 0.2, 
    vertexColors: true
  });
  
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // Create reusable vectors for performance
  const tempVector = new THREE.Vector3();
  const colorVector = new THREE.Color();
  const cameraTargetVector = new THREE.Vector3();

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);

    // Update the state time
    state.time += 0.01;
    state.runtime.rotationTimer += 0.01;
    
    // Update rotation direction based on the configured pattern
    const rotationDirection = updateRotationDirection(state.time);
    
    // Apply rotation direction to the Möbius transformation factor
    if (state.transform.mobiusFactor) {
      // Store the absolute value, then apply direction
      const absValue = Math.abs(state.transform.mobiusFactor);
      state.transform.mobiusFactor = absValue * rotationDirection;
    }

    // Reset the bounding box
    state.runtime.boundingBox.makeEmpty();

    // Update positions based on transformation
    grid.forEach((cell, i) => {
      // Get transformed position
      const transformedPos = transformPosition(cell.baseX, cell.baseY);
      
      // Update position buffer
      positions[i * 3] = transformedPos.x;
      positions[i * 3 + 1] = transformedPos.y;
      positions[i * 3 + 2] = transformedPos.z;
      
      // Calculate color based on displacement
      const normalizedZ = (transformedPos.z + state.transform.chladniAmplitude) / 
                          (2 * state.transform.chladniAmplitude);
      
      colorVector.setHSL(normalizedZ, 1.0, 0.5);
      
      colors[i * 3] = colorVector.r;
      colors[i * 3 + 1] = colorVector.g;
      colors[i * 3 + 2] = colorVector.b;
      
      // Expand bounding box to include this point
      tempVector.set(transformedPos.x, transformedPos.y, transformedPos.z);
      state.runtime.boundingBox.expandByPoint(tempVector);
    });

    // Mark attributes as needing update
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    
    // Adjust camera if auto-adjust is enabled
    if (state.camera.autoAdjust) {
      // Get the center of the grid
      state.runtime.boundingBox.getCenter(tempVector);
      
      // Convert to object to store in state (for use by UI components or other modules)
      const center = { x: tempVector.x, y: tempVector.y, z: tempVector.z };
      
      // Create Vector3 from current camera target
      cameraTargetVector.set(
        state.runtime.cameraTarget.x, 
        state.runtime.cameraTarget.y, 
        state.runtime.cameraTarget.z
      );
      
      // Smoothly move camera target to grid center
      cameraTargetVector.lerp(tempVector, state.camera.followIntensity);
      
      // Update state with new camera target
      state.runtime.cameraTarget = {
        x: cameraTargetVector.x,
        y: cameraTargetVector.y,
        z: cameraTargetVector.z
      };
      
      // Calculate required distance to see the whole grid
      const gridSize = state.runtime.boundingBox.getSize(new THREE.Vector3());
      const gridRadius = Math.max(gridSize.x, gridSize.y) / 2;
      
      // Calculate required camera Z position based on field of view
      const fov = camera.fov * (Math.PI / 180);
      const requiredZ = (gridRadius * state.camera.zoomMargin) / Math.tan(fov / 2);
      
      // Clamp to min/max zoom and smoothly adjust
      const targetZoom = THREE.MathUtils.clamp(
        requiredZ, 
        state.camera.minZoom, 
        state.camera.maxZoom
      );
      
      // Smoothly adjust zoom
      state.runtime.currentZoom += (targetZoom - state.runtime.currentZoom) * state.camera.followIntensity;
      
      // Update camera position
      camera.position.x = state.runtime.cameraTarget.x;
      camera.position.y = state.runtime.cameraTarget.y;
      camera.position.z = state.runtime.currentZoom;
      
      // Look at the center of the grid
      if (state.camera.lookAtCenter) {
        camera.lookAt(
          state.runtime.cameraTarget.x, 
          state.runtime.cameraTarget.y, 
          state.runtime.cameraTarget.z
        );
      }
    }

    renderer.render(scene, camera);
  }
  animate();

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { 
    renderer, 
    scene, 
    camera
  };
}