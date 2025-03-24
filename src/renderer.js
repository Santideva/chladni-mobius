// src/renderer.js
import * as THREE from 'three';
import createCombinedCellMobiusMaterial from './materials/clothMaterial.js';
import { updateRotationDirection } from './state.js';

export function initRenderer(state) {
  // Retrieve the canvas element
  const canvas = document.getElementById('three-canvas');
  
  // Create the renderer with antialiasing and proper pixel ratio
  const renderer = new THREE.WebGLRenderer({ 
    canvas,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Create the scene and set a dark background for contrast
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);
  
  // Create the perspective camera
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  
  // Set the initial camera position from state
  const { initialPosition } = state.camera;
  camera.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
  
  // Initialize runtime state values
  state.runtime.currentZoom = camera.position.z;
  state.runtime.cameraTarget = new THREE.Vector3(0, 0, 0);
  state.runtime.boundingBox = new THREE.Box3();

  // Create a plane geometry based on grid configuration from state
  // Ensure the geometry is subdivided sufficiently for smooth deformations
  const planeSize = state.grid.size;           // e.g., 2 units wide (or whatever is defined)
  const planeSegments = state.grid.resolution;   // e.g., 64 subdivisions per side
  const geometry = new THREE.PlaneGeometry(
    planeSize, 
    planeSize, 
    planeSegments, 
    planeSegments
  );

  // Instantiate the cloth material using our custom shader material function.
  // Here we initialize with parameters that yield a nearly flat appearance.
  const clothMaterial = createCombinedCellMobiusMaterial({
    chladniAmplitude: state.transform.chladniAmplitude,  // Use your state value
    chladniFrequencyX: state.transform.chladniFrequencyX,
    chladniFrequencyY: state.transform.chladniFrequencyY,
    useClassicalMobius: state.transform.useClassicalMobius,
    mobiusFactor: state.transform.mobiusFactor,
    noiseScale: state.transform.noiseScale,
    animationSpeed: state.transform.animationSpeed,
    gridSize: state.grid.size,
    gridResolution: state.grid.resolution,
    gridDensity: state.grid.density,
    // Appearance values are taken from state.appearance.
    // Ensure state.appearance exists and defines baseColor and activeColor.
    baseColor: new THREE.Color(state.appearance.baseColor),
    activeColor: new THREE.Color(state.appearance.activeColor)
  });
  
  // Create a mesh by combining the plane geometry with the custom cloth material.
  const clothMesh = new THREE.Mesh(geometry, clothMaterial.material);
  scene.add(clothMesh);
  
  // Store references to the cloth mesh and material in the runtime state for later use.
  state.runtime.clothMesh = clothMesh;
  state.runtime.clothMaterial = clothMaterial;
  
  // Create reusable vectors for performance in camera calculations
  const tempVector = new THREE.Vector3();
  const cameraTargetVector = new THREE.Vector3();

  // Add some lights for better visual quality
  const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);

    // Update global time
    state.time += 0.01;
    state.runtime.rotationTimer += 0.01;
    
    // Update rotation direction if needed (for dynamic Möbius effects)
    const rotationDirection = updateRotationDirection(state.time);
    if (state.transform.mobiusFactor) {
      const absValue = Math.abs(state.transform.mobiusFactor);
      state.transform.mobiusFactor = absValue * rotationDirection;
    }
    
    // Update cloth material parameters based on current state
    clothMaterial.updateMobiusChladniParameters({
      chladniAmplitude: state.transform.chladniAmplitude,
      chladniFrequencyX: state.transform.chladniFrequencyX,
      chladniFrequencyY: state.transform.chladniFrequencyY,
      useClassicalMobius: state.transform.useClassicalMobius,
      mobiusFactor: state.transform.mobiusFactor,
      noiseScale: state.transform.noiseScale,
      animationSpeed: state.transform.animationSpeed,
      // Optionally update Mobius coefficients if in classical mode
      a: state.transform.useClassicalMobius ? new THREE.Vector2(
        Math.cos(state.time * 0.1), 
        Math.sin(state.time * 0.1)
      ) : undefined
    });
    
    // Update the material time uniform (this updates uTime, etc.)
    clothMaterial.update(0.01);
    
    // Update grid parameters if they've changed (e.g., from UI interaction)
    if (state.grid.needsUpdate) {
      clothMaterial.updateCellParameters(
        state.grid.size,
        state.grid.resolution,
        state.grid.density
      );
      state.grid.needsUpdate = false;
      
      // Recreate geometry if necessary (e.g., when resizing grid)
      const newGeometry = new THREE.PlaneGeometry(
        state.grid.size, 
        state.grid.size, 
        state.grid.resolution, 
        state.grid.resolution
      );
      clothMesh.geometry.dispose();
      clothMesh.geometry = newGeometry;
    }
    
    // Update the bounding box of the cloth mesh for camera adjustments
    state.runtime.boundingBox.makeEmpty();
    state.runtime.boundingBox.expandByObject(clothMesh);
    
    // Adjust camera if auto-adjust is enabled
    if (state.camera.autoAdjust) {
      state.runtime.boundingBox.getCenter(tempVector);
      const center = { x: tempVector.x, y: tempVector.y, z: tempVector.z };
      
      cameraTargetVector.set(
        state.runtime.cameraTarget.x, 
        state.runtime.cameraTarget.y, 
        state.runtime.cameraTarget.z
      );
      cameraTargetVector.lerp(tempVector, state.camera.followIntensity);
      
      state.runtime.cameraTarget = {
        x: cameraTargetVector.x,
        y: cameraTargetVector.y,
        z: cameraTargetVector.z
      };
      
      // Compute required zoom based on bounding box size
      const gridSizeVec = state.runtime.boundingBox.getSize(new THREE.Vector3());
      const gridRadius = Math.max(gridSizeVec.x, gridSizeVec.y, gridSizeVec.z) / 2;
      const fov = camera.fov * (Math.PI / 180);
      const requiredZ = (gridRadius * state.camera.zoomMargin) / Math.tan(fov / 2);
      const targetZoom = THREE.MathUtils.clamp(requiredZ, state.camera.minZoom, state.camera.maxZoom);
      
      state.runtime.currentZoom += (targetZoom - state.runtime.currentZoom) * state.camera.followIntensity;
      
      camera.position.x = state.runtime.cameraTarget.x;
      camera.position.y = state.runtime.cameraTarget.y;
      camera.position.z = state.runtime.currentZoom;
      
      if (state.camera.lookAtCenter) {
        camera.lookAt(
          state.runtime.cameraTarget.x, 
          state.runtime.cameraTarget.y, 
          state.runtime.cameraTarget.z
        );
      }
    }
    
    // Apply any active cell transformations (if any)
    if (state.interactions.activeCellTransforms.length > 0) {
      clothMaterial.clearCellTransforms();
      state.interactions.activeCellTransforms.forEach(transform => {
        clothMaterial.applyCellTransform(
          { x: transform.center.x, y: transform.center.y },
          transform.radius,
          transform.propagationType
        );
      });
    }

    // Update viewport if needed (e.g., on window resize)
    if (state.runtime.viewportNeedsUpdate) {
      clothMaterial.updateViewport(window.innerWidth, window.innerHeight);
      state.runtime.viewportNeedsUpdate = false;
    }
    
    renderer.render(scene, camera);
  }
  animate();

  // Handle window resize events
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    state.runtime.viewportNeedsUpdate = true;
  });

  return { 
    renderer, 
    scene, 
    camera,
    cloth: clothMesh,
    clothMaterial
  };
}
