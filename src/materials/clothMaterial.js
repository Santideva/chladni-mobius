import * as THREE from 'three';

const createCombinedCellMobiusMaterial = (parameters = {}) => {
  // Default parameters for both shaders
  const defaults = {
    // Cell shader parameters
    propagationType: 'gradient',
    snapIntensity: 1.0,
    heavisideThreshold: 0.5,
    baseColor: new THREE.Color(0x444444),
    activeColor: new THREE.Color(0x0088ff),
    MIN_SPHERICITY: 0.1,
    MAX_SPHERICITY: 0.9,
    gridSize: 10.0,
    gridResolution: 8.0,
    gridDensity: 1.0,
    
    // Mobius-Chladni parameters
    chladniAmplitude: 0.5,
    chladniFrequencyX: 4.0,
    chladniFrequencyY: 4.0,
    useClassicalMobius: true,
    mobiusFactor: 0.3,
    noiseScale: 0.2,
    animationSpeed: 0.1,
    // Complex coefficients for classical Mobius
    a: new THREE.Vector2(1.0, 0.0),  // Complex number a (real, imag)
    b: new THREE.Vector2(0.0, 0.0),  // Complex number b (real, imag)
    c: new THREE.Vector2(0.0, 0.0),  // Complex number c (real, imag)
    d: new THREE.Vector2(1.0, 0.0),  // Complex number d (real, imag)
  };
  
  // Merge defaults with provided parameters
  const params = { ...defaults, ...parameters };
  
  // Internal state tracking
  const state = {
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    time: 0
  };
  
  // Create uniform object to hold all data
  const uniforms = {
    // Cell shader uniforms
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
    uTransformCenters: { value: Array(10).fill().map(() => new THREE.Vector2(0, 0)) },
    uTransformRadii: { value: new Float32Array(10) },
    
    // Mobius-Chladni uniforms
    uTime: { value: 0.0 },
    uChladniAmplitude: { value: params.chladniAmplitude },
    uChladniFrequencyX: { value: params.chladniFrequencyX },
    uChladniFrequencyY: { value: params.chladniFrequencyY },
    uUseClassicalMobius: { value: params.useClassicalMobius },
    uMobiusFactor: { value: params.mobiusFactor },
    uNoiseScale: { value: params.noiseScale },
    uAnimationSpeed: { value: params.animationSpeed },
    uA: { value: new THREE.Vector2(params.a.x, params.a.y) },
    uB: { value: new THREE.Vector2(params.b.x, params.b.y) },
    uC: { value: new THREE.Vector2(params.c.x, params.c.y) },
    uD: { value: new THREE.Vector2(params.d.x, params.d.y) },
  };
  
  // Vertex shader implementation (from Mobius-Chladni shader)
  const vertexShader = `
    uniform float uTime;

    // Chladni pattern parameters
    uniform float uChladniAmplitude;
    uniform float uChladniFrequencyX;
    uniform float uChladniFrequencyY;

    // Mobius transformation parameters
    uniform bool uUseClassicalMobius;
    uniform float uMobiusFactor;
    uniform float uNoiseScale;
    uniform float uAnimationSpeed;

    // Classical Mobius transformation parameters (complex coefficients)
    uniform vec2 uA;
    uniform vec2 uB;
    uniform vec2 uC;
    uniform vec2 uD;

    varying vec2 vUv;
    varying vec3 vPosition;

    // ======== Utility Functions ========

    // ---- Simplex Noise Implementation ----
    // Credit: Ian McEwan, Ashima Arts (MIT License)

    vec3 mod289(vec3 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 mod289(vec4 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 permute(vec4 x) {
      return mod289(((x*34.0)+1.0)*x);
    }

    vec4 taylorInvSqrt(vec4 r) {
      return 1.79284291400159 - 0.85373472095314 * r;
    }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      // First corner
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      // Other corners
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      // Permutations
      i = mod289(i);
      vec4 p = permute(permute(permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      // Gradients: 7x7 points over a square, mapped onto an octahedron
      float n_ = 0.142857142857; // 1.0/7.0
      vec3 ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);

      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      // Normalise gradients
      vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      // Mix final noise value
      vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
    }

    // 2D simplex noise (uses 3D implementation)
    float snoise(vec2 v) {
      return snoise(vec3(v.x, v.y, 0.0));
    }

    // ---- Complex Number Operations ----

    vec2 complex_mul(vec2 a, vec2 b) {
      return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
    }

    vec2 complex_div(vec2 a, vec2 b) {
      float denominator = b.x * b.x + b.y * b.y;
      if (denominator < 0.0001) {
        // Return a large but finite value for small denominators
        float magnitude = sqrt(a.x * a.x + a.y * a.y);
        if (magnitude < 0.0001) return vec2(0.0, 0.0);
        float scale = 1000.0 / magnitude;
        return vec2(a.x * scale, a.y * scale);
      }
      return vec2(
        (a.x * b.x + a.y * b.y) / denominator,
        (a.y * b.x - a.x * b.y) / denominator
      );
    }

    // ---- Chladni Pattern Transformation ----
    vec3 applyChladniTransform(vec2 pos, float time) {
      // Basic Chladni pattern
      float baseZ = sin(uChladniFrequencyX * pos.x + time) * sin(uChladniFrequencyY * pos.y + time);
      
      // Add noise modulation
      float noise = snoise(vec3(pos.x * 0.1, pos.y * 0.1, time * 0.05));
      
      // Combine base pattern with noise
      float z = uChladniAmplitude * (baseZ + noise * uNoiseScale);
      
      return vec3(pos.x, pos.y, z);
    }

    // ---- Classical Möbius Transformation ----
    vec2 applyClassicalMobius(vec2 pos, float time) {
      // Create time-animated parameters
      float timePhase = time * uAnimationSpeed;
      vec2 a = vec2(
        uA.x * cos(timePhase) - uA.y * sin(timePhase),
        uA.x * sin(timePhase) + uA.y * cos(timePhase)
      );
      vec2 b = uB;
      vec2 c = uC;
      vec2 d = uD;
      
      // z = x + iy (input complex number)
      vec2 z = vec2(pos.x, pos.y);
      
      // Calculate (a*z + b)/(c*z + d)
      vec2 numerator = complex_mul(a, z);
      numerator += b;
      
      vec2 denominator = complex_mul(c, z);
      denominator += d;
      
      return complex_div(numerator, denominator);
    }

    // ---- Enhanced Möbius-like Transformation ----
    vec3 applyEnhancedMobius(vec3 pos, float time) {
      // Calculate distance from origin for radial effects
      float distanceFromOrigin = length(pos.xy);
      
      // Create noise-based twist angle variations
      float noiseFactor = snoise(vec2(pos.x * 0.2, pos.y * 0.2)) * uNoiseScale;
      
      // Base twist calculation (distance-based)
      float twistAngle = uMobiusFactor * distanceFromOrigin;
      
      // Enhance with z-coordinate influence (makes it truly 3D)
      twistAngle *= (1.0 + 0.5 * sin(pos.z * 0.5));
      
      // Add time-based animation and noise variation
      twistAngle += time * 0.1 * (1.0 + noiseFactor);
      
      // Create rotation matrices for Z-axis rotation
      float cosZ = cos(twistAngle);
      float sinZ = sin(twistAngle);
      mat3 rotZ = mat3(
        cosZ, -sinZ, 0.0,
        sinZ, cosZ, 0.0,
        0.0, 0.0, 1.0
      );
      
      // Calculate secondary rotation angle based on position and noise
      float secondaryAngle = uMobiusFactor * 0.5 * (
        sin(distanceFromOrigin) + 
        snoise(vec2(pos.x * 0.1 + time * 0.05, pos.y * 0.1)) * uNoiseScale * 0.5
      );
      
      // Create rotation matrix for Y-axis
      float cosY = cos(secondaryAngle);
      float sinY = sin(secondaryAngle);
      mat3 rotY = mat3(
        cosY, 0.0, sinY,
        0.0, 1.0, 0.0,
        -sinY, 0.0, cosY
      );
      
      // Create rotation around X axis
      float xAngle = uMobiusFactor * 0.3 * snoise(vec2(pos.x * 0.15, time * 0.05)) * uNoiseScale;
      float cosX = cos(xAngle);
      float sinX = sin(xAngle);
      mat3 rotX = mat3(
        1.0, 0.0, 0.0,
        0.0, cosX, -sinX,
        0.0, sinX, cosX
      );
      
      // Apply rotations in sequence
      vec3 rotated = rotX * rotY * rotZ * pos;
      return rotated;
    }

    // ---- Noise-based Displacement ----
    vec3 applyNoiseDisplacement(vec3 pos, float time) {
      float displacementX = snoise(vec3(pos.x * 0.2, pos.y * 0.2, time * 0.1)) * uNoiseScale;
      float displacementY = snoise(vec3(pos.x * 0.2, pos.y * 0.2, time * 0.15 + 100.0)) * uNoiseScale;
      float displacementZ = snoise(vec3(pos.x * 0.2, pos.y * 0.2, time * 0.05 + 200.0)) * uNoiseScale * 0.5;
      
      return pos + vec3(displacementX, displacementY, displacementZ);
    }

    void main() {
      // Start with original vertex position
      vec3 pos = position;
      float time = uTime;

      // Apply transformations in sequence
      
      // 1. Apply noise displacement for organic variety
      pos = applyNoiseDisplacement(pos, time);
      
      // 2. Apply Möbius transformation
      if (uUseClassicalMobius) {
        vec2 mobiusResult = applyClassicalMobius(pos.xy, time);
        pos = vec3(mobiusResult, pos.z);
      } else {
        pos = applyEnhancedMobius(pos, time);
      }
      
      // 3. Apply Chladni pattern
      vec3 chladniPos = applyChladniTransform(pos.xy, time);
      pos.z += chladniPos.z;  // Just add the z component

      // Pass data to fragment shader
      vUv = uv;
      vPosition = pos;

      // Set the final position
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;
  
  // Fragment shader implementation (from cell shader)
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
      vec3 color = mix(uBaseColor, uActiveColor, totalIntensity);
      
      // Apply rotation symmetry effect
      float angle = atan(point.y, point.x);
      float rotSymEffect = mod(angle, rotationalAngle) / rotationalAngle;
      color = mix(color, color * vec3(0.8, 1.0, 1.2), rotSymEffect * totalIntensity);
      
      // Apply rugosity effect (noise-like pattern)
      float noiseEffect = fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453);
      color = mix(color, color * vec3(1.0 + noiseEffect * 0.2), rugosity * totalIntensity);
      
      // Add z-position influence on color (from Chladni patterns)
      float zInfluence = clamp(vPosition.z * 0.5 + 0.5, 0.0, 1.0);
      color = mix(color, color * vec3(1.0 + zInfluence * 0.3, 1.0, 1.0 + zInfluence * 0.1), 0.3);
      
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
    
    // Update time for animations
    update: (deltaTime) => {
      state.time += deltaTime;
      material.uniforms.uTime.value = state.time;
      return material;
    },
    
    // Update viewport dimensions
    updateViewport: (width, height) => {
      state.viewport.width = width;
      state.viewport.height = height;
      material.uniforms.uViewportWidth.value = width;
      material.uniforms.uViewportHeight.value = height;
    },
    
    // Update cell grid parameters
    updateCellParameters: (size, resolution, density) => {
      material.uniforms.uGridSize.value = size !== undefined ? size : material.uniforms.uGridSize.value;
      material.uniforms.uGridResolution.value = resolution !== undefined ? resolution : material.uniforms.uGridResolution.value;
      material.uniforms.uGridDensity.value = density !== undefined ? density : material.uniforms.uGridDensity.value;
    },
    
    // Update Mobius-Chladni parameters
    updateMobiusChladniParameters: (params = {}) => {
      if (params.chladniAmplitude !== undefined) 
        material.uniforms.uChladniAmplitude.value = params.chladniAmplitude;
      
      if (params.chladniFrequencyX !== undefined)
        material.uniforms.uChladniFrequencyX.value = params.chladniFrequencyX;
        
      if (params.chladniFrequencyY !== undefined)
        material.uniforms.uChladniFrequencyY.value = params.chladniFrequencyY;
        
      if (params.useClassicalMobius !== undefined)
        material.uniforms.uUseClassicalMobius.value = params.useClassicalMobius;
        
      if (params.mobiusFactor !== undefined)
        material.uniforms.uMobiusFactor.value = params.mobiusFactor;
        
      if (params.noiseScale !== undefined)
        material.uniforms.uNoiseScale.value = params.noiseScale;
        
      if (params.animationSpeed !== undefined)
        material.uniforms.uAnimationSpeed.value = params.animationSpeed;
        
      // Update Mobius transform complex coefficients if provided
      if (params.a) material.uniforms.uA.value.copy(params.a);
      if (params.b) material.uniforms.uB.value.copy(params.b);
      if (params.c) material.uniforms.uC.value.copy(params.c);
      if (params.d) material.uniforms.uD.value.copy(params.d);
    },
    
    // Apply a cell transformation
    applyCellTransform: (center, radius, type = 'gradient') => {
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
    
    // Clear all cell transformations
    clearCellTransforms: () => {
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
      // Cell shader state
      viewport: { ...state.viewport },
      gridSize: material.uniforms.uGridSize.value,
      gridResolution: material.uniforms.uGridResolution.value,
      gridDensity: material.uniforms.uGridDensity.value,
      propagationType: ['gradient', 'sharp', 'blended', 'heaviside'][material.uniforms.uPropagationType.value],
      snapIntensity: material.uniforms.uSnapIntensity.value,
      heavisideThreshold: material.uniforms.uHeavisideThreshold.value,
      transformCount: material.uniforms.uTransformCount.value,
      
      // Mobius-Chladni state
      time: material.uniforms.uTime.value,
      chladniAmplitude: material.uniforms.uChladniAmplitude.value,
      chladniFrequencyX: material.uniforms.uChladniFrequencyX.value,
      chladniFrequencyY: material.uniforms.uChladniFrequencyY.value,
      useClassicalMobius: material.uniforms.uUseClassicalMobius.value,
      mobiusFactor: material.uniforms.uMobiusFactor.value,
      noiseScale: material.uniforms.uNoiseScale.value,
      animationSpeed: material.uniforms.uAnimationSpeed.value,
      a: { x: material.uniforms.uA.value.x, y: material.uniforms.uA.value.y },
      b: { x: material.uniforms.uB.value.x, y: material.uniforms.uB.value.y },
      c: { x: material.uniforms.uC.value.x, y: material.uniforms.uC.value.y },
      d: { x: material.uniforms.uD.value.x, y: material.uniforms.uD.value.y }
    }),
    
    // Set all parameters from a state object (for saving/loading presets)
    setState: (newState) => {
      // Update viewport if provided
      if (newState.viewport) {
        state.viewport = { ...newState.viewport };
        material.uniforms.uViewportWidth.value = state.viewport.width;
        material.uniforms.uViewportHeight.value = state.viewport.height;
      }
      
      // Update cell shader parameters
      if (newState.gridSize !== undefined) material.uniforms.uGridSize.value = newState.gridSize;
      if (newState.gridResolution !== undefined) material.uniforms.uGridResolution.value = newState.gridResolution;
      if (newState.gridDensity !== undefined) material.uniforms.uGridDensity.value = newState.gridDensity;
      
      if (newState.propagationType !== undefined) {
        const typeIndex = ['gradient', 'sharp', 'blended', 'heaviside'].indexOf(newState.propagationType);
        if (typeIndex >= 0) material.uniforms.uPropagationType.value = typeIndex;
      }
      
      if (newState.snapIntensity !== undefined) material.uniforms.uSnapIntensity.value = newState.snapIntensity;
      if (newState.heavisideThreshold !== undefined) material.uniforms.uHeavisideThreshold.value = newState.heavisideThreshold;
      
      // Update Mobius-Chladni parameters
      if (newState.chladniAmplitude !== undefined) material.uniforms.uChladniAmplitude.value = newState.chladniAmplitude;
      if (newState.chladniFrequencyX !== undefined) material.uniforms.uChladniFrequencyX.value = newState.chladniFrequencyX;
      if (newState.chladniFrequencyY !== undefined) material.uniforms.uChladniFrequencyY.value = newState.chladniFrequencyY;
      if (newState.useClassicalMobius !== undefined) material.uniforms.uUseClassicalMobius.value = newState.useClassicalMobius;
      if (newState.mobiusFactor !== undefined) material.uniforms.uMobiusFactor.value = newState.mobiusFactor;
      if (newState.noiseScale !== undefined) material.uniforms.uNoiseScale.value = newState.noiseScale;
      if (newState.animationSpeed !== undefined) material.uniforms.uAnimationSpeed.value = newState.animationSpeed;
      
      // Update Mobius transform complex coefficients
      if (newState.a) material.uniforms.uA.value.set(newState.a.x, newState.a.y);
      if (newState.b) material.uniforms.uB.value.set(newState.b.x, newState.b.y);
      if (newState.c) material.uniforms.uC.value.set(newState.c.x, newState.c.y);
      if (newState.d) material.uniforms.uD.value.set(newState.d.x, newState.d.y);
      
      // Time is typically not restored as it's an animation parameter
      
      return material;
    },
    
    // Create a preset from current state
    createPreset: (name) => {
      return {
        name: name || 'Unnamed Preset',
        timestamp: Date.now(),
        state: module.exports.getState()
      };
    },
    
    // Apply a preset
    applyPreset: (preset) => {
      if (preset && preset.state) {
        module.exports.setState(preset.state);
        return true;
      }
      return false;
    },
    
    // Get the raw material for direct manipulation
    getRawMaterial: () => material,
    
    // Dispose of resources when no longer needed
    dispose: () => {
      material.dispose();
    }
  };
};

// Export the module
export default createCombinedCellMobiusMaterial;