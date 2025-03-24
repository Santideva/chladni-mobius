import * as THREE from 'three';

const createStandaloneCellShaderMaterial = (parameters = {}) => {
  // Default parameters
  const defaults = {
    propagationType: 'gradient',
    snapIntensity: 1.0,
    heavisideThreshold: 0.5,
    baseColor: new THREE.Color(0x444444),
    activeColor: new THREE.Color(0x0088ff),
    // Constants previously from gridModule
    MIN_SPHERICITY: 0.1,
    MAX_SPHERICITY: 0.9,
    gridSize: 10.0,
    gridResolution: 8.0,
    gridDensity: 1.0
  };
  
  // Merge defaults with provided parameters
  const params = { ...defaults, ...parameters };
  
  // Internal state tracking for viewport
  const state = {
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };
  
  // Create a uniform object to hold all data
  const uniforms = {
    uBaseColor: { value: new THREE.Color(params.baseColor) },
    uActiveColor: { value: new THREE.Color(params.activeColor) },
    uPropagationType: { value: ['gradient', 'sharp', 'blended', 'heaviside'].indexOf(params.propagationType) },
    uSnapIntensity: { value: params.snapIntensity },
    uHeavisideThreshold: { value: params.heavisideThreshold },
    uTransformCount: { value: 0 },
    uGridSize: { value: params.gridSize },
    uGridResolution: { value: params.gridResolution },
    uGridDensity: { value: params.gridDensity },
    uViewportWidth: { value: state.viewport.width },
    uViewportHeight: { value: state.viewport.height },
    uMinSphericity: { value: params.MIN_SPHERICITY },
    uMaxSphericity: { value: params.MAX_SPHERICITY },
    // Array to store active transforms (up to 10 transforms)
    uTransformCenters: { value: Array(10).fill().map(() => new THREE.Vector2(0, 0)) },
    uTransformRadii: { value: new Float32Array(10) }
  };
  
  // Vertex shader for cell shape transformations
  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  
  // Fragment shader to handle all cell shape transformations
  const fragmentShader = `
    uniform vec3 uBaseColor;
    uniform vec3 uActiveColor;
    uniform int uPropagationType;
    uniform float uSnapIntensity;
    uniform float uHeavisideThreshold;
    uniform int uTransformCount;
    uniform float uGridSize;
    uniform float uGridResolution;
    uniform float uGridDensity;
    uniform float uViewportWidth;
    uniform float uViewportHeight;
    uniform float uMinSphericity;
    uniform float uMaxSphericity;
    uniform vec2 uTransformCenters[10];
    uniform float uTransformRadii[10];
    
    varying vec2 vUv;
    varying vec3 vPosition;
    
    // Calculate cell shape properties
    float calculateCellSphericity() {
      float aspectRatio = uViewportWidth / uViewportHeight;
      return max(
        uMinSphericity,
        min(
          uMaxSphericity,
          1.0 - (aspectRatio / uGridResolution)
        )
      );
    }
    
    int calculateRotationalSymmetry() {
      float size = uGridSize;
      float density = uGridDensity;
      int maxSymmetry = 8;
      int symmetryOrder = int(floor(size * density)) % maxSymmetry;
      return max(1, symmetryOrder);
    }
    
    int calculateAxisSymmetry() {
      return (int(uGridResolution) % 4) + 1;
    }
    
    float calculateCellRugosity() {
      return max(0.0, min(1.0, uGridResolution / 10.0));
    }
    
    float calculateGaussianCurvature() {
      return max(0.0, 1.0 / (uGridResolution + 1.0));
    }
    
    float calculateMeanCurvature() {
      return max(0.0, (1.0 / (uGridResolution + 1.0)) * 0.5);
    }
    
    float calculateAnisotropy() {
      return 0.8 + (float(int(uGridResolution) % 3) * 0.1);
    }
    
    int calculateTranslationalSymmetry() {
      return max(1, (int(floor(uGridSize)) % 5) + 1);
    }
    
    int calculateReflectionSymmetry() {
      return (int(uGridResolution) % 2 == 0) ? 2 : 1;
    }
    
    // Calculate transformation intensity based on propagation type
    float calculateIntensity(vec2 point, vec2 center, float radius) {
      float distance = length(point - center);
      if (distance > radius) return 0.0;
      
      if (uPropagationType == 0) {
        // Gradient
        return 1.0 - (distance / radius);
      } else if (uPropagationType == 1) {
        // Sharp
        return 1.0;
      } else if (uPropagationType == 2) {
        // Blended
        return cos((distance / radius) * 3.14159 / 2.0);
      } else if (uPropagationType == 3) {
        // Heaviside
        return distance < radius * uHeavisideThreshold ? 1.0 : 0.0;
      }
      
      return 0.0;
    }
    
    // Get effective shape based on all transformations
    void getEffectiveShape(vec2 point, out float sphericity, out float rotationalAngle, 
                           out float axisCount, out float rugosity) {
      // Base shape
      float baseSph = calculateCellSphericity();
      float baseRotSym = float(calculateRotationalSymmetry());
      float baseAxisSym = float(calculateAxisSymmetry());
      float baseRugosity = calculateCellRugosity();
      
      // Start with base values
      sphericity = baseSph;
      rotationalAngle = (3.14159 * 2.0) / baseRotSym;
      axisCount = baseAxisSym;
      rugosity = baseRugosity;
      
      // Accumulate transformation effects
      float totalIntensity = 0.0;
      
      for (int i = 0; i < 10; i++) {
        if (i >= uTransformCount) break;
        
        float intensity = calculateIntensity(point, uTransformCenters[i], uTransformRadii[i]);
        if (intensity > 0.0) {
          totalIntensity += intensity;
          
          // Apply transformation effects
          sphericity = max(
            uMinSphericity,
            min(
              uMaxSphericity,
              sphericity * (1.0 - (intensity * 0.5)) // Reduce sphericity by up to 50%
            )
          );
          
          rotationalAngle = rotationalAngle * (1.0 - (intensity * 0.3)); // Modify rotation
          axisCount = max(1.0, axisCount * (1.0 - (intensity * 0.2))); // Modify axis count
          rugosity = rugosity + (intensity * 0.4); // Increase rugosity
        }
      }
      
      // Apply snap intensity to discretize values if needed
      if (uSnapIntensity > 0.0) {
        float snapFactor = floor(sphericity / uSnapIntensity) * uSnapIntensity;
        sphericity = mix(sphericity, snapFactor, uSnapIntensity);
        
        snapFactor = floor(rotationalAngle / uSnapIntensity) * uSnapIntensity;
        rotationalAngle = mix(rotationalAngle, snapFactor, uSnapIntensity);
        
        axisCount = floor(axisCount + 0.5); // Round to nearest integer
      }
    }
    
    void main() {
      vec2 point = vPosition.xy;
      
      // Calculate effective shape at this point
      float sphericity, rotationalAngle, axisCount, rugosity;
      getEffectiveShape(point, sphericity, rotationalAngle, axisCount, rugosity);
      
      // Calculate color based on transformation intensity
      float totalIntensity = 0.0;
      for (int i = 0; i < 10; i++) {
        if (i >= uTransformCount) break;
        totalIntensity += calculateIntensity(point, uTransformCenters[i], uTransformRadii[i]);
      }
      totalIntensity = min(1.0, totalIntensity);
      
      // Apply cell shape visualization
      // This is a simple visualization - you can customize based on your needs
      vec3 color = mix(uBaseColor, uActiveColor, totalIntensity);
      
      // Apply rotation symmetry effect
      float angle = atan(point.y, point.x);
      float rotSymEffect = mod(angle, rotationalAngle) / rotationalAngle;
      color = mix(color, color * vec3(0.8, 1.0, 1.2), rotSymEffect * totalIntensity);
      
      // Apply rugosity effect (noise-like pattern)
      float noiseEffect = fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453);
      color = mix(color, color * vec3(1.0 + noiseEffect * 0.2), rugosity * totalIntensity);
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;
  
  // Create the shader material
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.DoubleSide
  });
  
  // Public API methods
  return {
    material,
    
    // Update viewport dimensions
    updateViewport: (width, height) => {
      state.viewport.width = width;
      state.viewport.height = height;
      material.uniforms.uViewportWidth.value = width;
      material.uniforms.uViewportHeight.value = height;
    },
    
    // Update grid parameters
    updateGridParameters: (size, resolution, density) => {
      material.uniforms.uGridSize.value = size !== undefined ? size : material.uniforms.uGridSize.value;
      material.uniforms.uGridResolution.value = resolution !== undefined ? resolution : material.uniforms.uGridResolution.value;
      material.uniforms.uGridDensity.value = density !== undefined ? density : material.uniforms.uGridDensity.value;
    },
    
    // Apply a transformation
    applyTransform: (center, radius, type = 'gradient') => {
      const count = material.uniforms.uTransformCount.value;
      if (count >= 10) return false; // Maximum 10 transforms
      
      // Add new transform
      material.uniforms.uTransformCenters.value[count].set(center.x, center.y);
      material.uniforms.uTransformRadii.value[count] = radius;
      material.uniforms.uTransformCount.value = count + 1;
      
      // Update propagation type if specified
      if (type) {
        const typeIndex = ['gradient', 'sharp', 'blended', 'heaviside'].indexOf(type);
        if (typeIndex >= 0) {
          material.uniforms.uPropagationType.value = typeIndex;
        }
      }
      
      return true;
    },
    
    // Clear all transformations
    clearTransforms: () => {
      material.uniforms.uTransformCount.value = 0;
    },
    
    // Set snap intensity
    setSnapIntensity: (intensity) => {
      material.uniforms.uSnapIntensity.value = Math.max(0, Math.min(1, intensity));
    },
    
    // Set colors
    setColors: (baseColor, activeColor) => {
      if (baseColor) material.uniforms.uBaseColor.value.set(baseColor);
      if (activeColor) material.uniforms.uActiveColor.value.set(activeColor);
    },
    
    // Update heaviside threshold
    setHeavisideThreshold: (threshold) => {
      material.uniforms.uHeavisideThreshold.value = Math.max(0, Math.min(1, threshold));
    },
    
    // Get current state of the shader
    getState: () => ({
      viewport: { ...state.viewport },
      gridSize: material.uniforms.uGridSize.value,
      gridResolution: material.uniforms.uGridResolution.value,
      gridDensity: material.uniforms.uGridDensity.value,
      propagationType: ['gradient', 'sharp', 'blended', 'heaviside'][material.uniforms.uPropagationType.value],
      snapIntensity: material.uniforms.uSnapIntensity.value,
      heavisideThreshold: material.uniforms.uHeavisideThreshold.value,
      transformCount: material.uniforms.uTransformCount.value
    })
  };
};

export { createStandaloneCellShaderMaterial };