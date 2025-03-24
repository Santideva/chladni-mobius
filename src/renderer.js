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

  // Prepare all material parameters based on comprehensive uniform list
  const materialParams = {
    // Cell Shader Uniforms
    baseColor: new THREE.Color(state.appearance.baseColor),
    activeColor: new THREE.Color(state.appearance.activeColor),
    propagationType: state.interactions.defaultPropagationType === 'gradient' ? 0 : 
                     state.interactions.defaultPropagationType === 'sharp' ? 1 :
                     state.interactions.defaultPropagationType === 'blended' ? 2 : 3,
    snapIntensity: state.appearance.snapIntensity || 0.0,
    heavisideThreshold: state.appearance.heavisideThreshold || 0.5,
    gridSize: state.grid.size,
    gridResolution: state.grid.resolution,
    gridDensity: state.grid.density,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    minSphericity: state.appearance.minSphericity || 0.0,
    maxSphericity: state.appearance.maxSphericity || 1.0,
    useTexture: state.appearance.useTexture,
    texture: state.runtime.texture,
    
    // Mobius-Chladni Uniforms
    chladniAmplitude: state.transform.chladniAmplitude,
    chladniFrequencyX: state.transform.chladniFrequencyX,
    chladniFrequencyY: state.transform.chladniFrequencyY,
    useClassicalMobius: state.transform.useClassicalMobius,
    mobiusFactor: state.transform.mobiusFactor,
    noiseScale: state.transform.noiseScale,
    animationSpeed: state.transform.animationSpeed,
    
    // Classical Möbius transformation parameters
    a: new THREE.Vector2(state.transform.a_real, state.transform.a_imag),
    b: new THREE.Vector2(state.transform.b_real, state.transform.b_imag),
    c: new THREE.Vector2(state.transform.c_real, state.transform.c_imag),
    d: new THREE.Vector2(state.transform.d_real, state.transform.d_imag)
  };

  // Instantiate the cloth material using our custom shader material function
  const clothMaterial = createCombinedCellMobiusMaterial(materialParams);
  
  // Create a mesh by combining the plane geometry with the custom cloth material
  const clothMesh = new THREE.Mesh(geometry, clothMaterial.material);
  scene.add(clothMesh);
  
  // Store references to the cloth mesh and material in the runtime state for later use
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
    
    // Prepare the Möbius transformation parameters
    const mobiusParams = {
      chladniAmplitude: state.transform.chladniAmplitude,
      chladniFrequencyX: state.transform.chladniFrequencyX,
      chladniFrequencyY: state.transform.chladniFrequencyY,
      useClassicalMobius: state.transform.useClassicalMobius,
      mobiusFactor: state.transform.mobiusFactor,
      noiseScale: state.transform.noiseScale,
      animationSpeed: state.transform.animationSpeed,
    };
    
    // Add Möbius complex coefficients if using classical mode
    if (state.transform.useClassicalMobius) {
      // Dynamic parameters if animation is enabled
      if (state.transform.mobiusAnimationSpeed > 0) {
        mobiusParams.a = new THREE.Vector2(
          Math.cos(state.time * state.transform.mobiusAnimationSpeed), 
          Math.sin(state.time * state.transform.mobiusAnimationSpeed)
        );
        // Keep static values for b, c, d from state or update dynamically if needed
        mobiusParams.b = new THREE.Vector2(state.transform.b_real, state.transform.b_imag);
        mobiusParams.c = new THREE.Vector2(state.transform.c_real, state.transform.c_imag);
        mobiusParams.d = new THREE.Vector2(state.transform.d_real, state.transform.d_imag);  
      } else {
        // Static parameters from state
        mobiusParams.a = new THREE.Vector2(state.transform.a_real, state.transform.a_imag);
        mobiusParams.b = new THREE.Vector2(state.transform.b_real, state.transform.b_imag);
        mobiusParams.c = new THREE.Vector2(state.transform.c_real, state.transform.c_imag);
        mobiusParams.d = new THREE.Vector2(state.transform.d_real, state.transform.d_imag);
      }
    }
    
    // Update the appearance parameters
    const appearanceParams = {
      baseColor: new THREE.Color(state.appearance.baseColor),
      activeColor: new THREE.Color(state.appearance.activeColor),
      snapIntensity: state.appearance.snapIntensity || 0.0,
      heavisideThreshold: state.appearance.heavisideThreshold || 0.5,
      minSphericity: state.appearance.minSphericity || 0.0,
      maxSphericity: state.appearance.maxSphericity || 1.0,
      propagationType: state.interactions.defaultPropagationType === 'gradient' ? 0 : 
                      state.interactions.defaultPropagationType === 'sharp' ? 1 :
                      state.interactions.defaultPropagationType === 'blended' ? 2 : 3
    };
    
    // Update cloth material with all parameters
    clothMaterial.updateMobiusChladniParameters(mobiusParams);
    clothMaterial.updateCellParameters(appearanceParams);
    
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

  // Create a texture loader
  const textureLoader = new THREE.TextureLoader();

  // Function to handle file uploads
  function handleTextureUpload(file) {
    if (file.type.startsWith('image/')) {
      // Handle image upload
      const imageUrl = URL.createObjectURL(file);
      textureLoader.load(
        imageUrl,
        (texture) => {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          
          state.runtime.texture = texture;
          state.appearance.useTexture = true;
          state.appearance.textureType = 'image';
          
          // Update material to use the texture
          clothMaterial.updateTextureParameters(texture, true);
          
          // Clean up the temporary URL
          URL.revokeObjectURL(imageUrl);
        }
      );
    } else if (file.type.startsWith('video/')) {
      // Handle video upload
      const videoElement = document.createElement('video');
      videoElement.src = URL.createObjectURL(file);
      videoElement.loop = true;
      videoElement.muted = true;
      videoElement.play();
      
      const videoTexture = new THREE.VideoTexture(videoElement);
      videoTexture.wrapS = THREE.RepeatWrapping;
      videoTexture.wrapT = THREE.RepeatWrapping;
      
      state.runtime.texture = videoTexture;
      state.runtime.videoElement = videoElement;
      state.appearance.useTexture = true;
      state.appearance.textureType = 'video';
      
      // Update material to use the video texture
      clothMaterial.updateTextureParameters(videoTexture, true);
    }
  }  

  // Set up the file upload handler
  const fileInput = document.getElementById('texture-upload');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleTextureUpload(e.target.files[0]);
      }
    });
  }

  return { 
    renderer, 
    scene, 
    camera,
    cloth: clothMesh,
    clothMaterial
  };
}