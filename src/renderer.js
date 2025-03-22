import * as THREE from '../node_modules/three/build/three.module.js';
import { generateGrid } from './geometry/gridGenerator.js';
import { stateStore } from './state.js';
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
  camera.position.z = 10;

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

  // Create reusable vector for performance
  const tempVector = new THREE.Vector3();
  const colorVector = new THREE.Color();

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);

    // Update the state time
    state.time += 0.01;

    // Update positions based on transformation
    grid.forEach((cell, i) => {
      // Get transformed position
      const transformedPos = transformPosition(cell.baseX, cell.baseY);
      
      // Update position buffer
      positions[i * 3] = transformedPos.x;
      positions[i * 3 + 1] = transformedPos.y;
      positions[i * 3 + 2] = transformedPos.z;
      
      // Calculate color based on displacement (optional visual enhancement)
      // Normalize z value to range 0-1 for color mapping
      const normalizedZ = (transformedPos.z + state.transform.chladniAmplitude) / 
                          (2 * state.transform.chladniAmplitude);
      
      colorVector.setHSL(normalizedZ, 1.0, 0.5);
      
      colors[i * 3] = colorVector.r;
      colors[i * 3 + 1] = colorVector.g;
      colors[i * 3 + 2] = colorVector.b;
    });

    // Mark attributes as needing update
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;

    renderer.render(scene, camera);
  }
  animate();

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { renderer, scene, camera };
}