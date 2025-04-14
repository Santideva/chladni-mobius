// src/ui/uiManager.js
import * as dat from 'dat.gui';
import { updateTransformParams, updateAppearanceParams, updateCameraParams, updateRuntimeState } from '../state.js';

/**
 * Initializes the UI controls using dat.GUI
 * @param {Object} state - The application state store
 * @returns {dat.GUI} - The created GUI instance
 */
export function initUI(state) {
  // Create main GUI instance
  const gui = new dat.GUI({ width: 300 });
  
  // Create separate folders for different parameter groups
  const transformFolder = gui.addFolder('Transform Parameters');
  const chladniFolder = transformFolder.addFolder('Chladni Pattern');
  const mobiusFolder = transformFolder.addFolder('Möbius Transform');
  const noiseFolder = transformFolder.addFolder('Noise Effects');
  const appearanceFolder = gui.addFolder('Appearance');
  const cameraFolder = gui.addFolder('Camera Control');
  
  // --- Chladni Pattern Controls ---
  chladniFolder.add(state.transform, 'chladniAmplitude', 0, 2)
    .name('Amplitude')
    .onChange(value => {
      updateTransformParams({ chladniAmplitude: value });
    });
    
  chladniFolder.add(state.transform, 'chladniFrequencyX', 0, 2)
    .name('Frequency X')
    .onChange(value => {
      updateTransformParams({ chladniFrequencyX: value });
    });
    
  chladniFolder.add(state.transform, 'chladniFrequencyY', 0, 2)
    .name('Frequency Y')
    .onChange(value => {
      updateTransformParams({ chladniFrequencyY: value });
    });
    
  chladniFolder.add(state.transform, 'timeScaleChladni', 0, 2)
    .name('Time Scale')
    .onChange(value => {
      updateTransformParams({ timeScaleChladni: value });
    });
  
  // --- Möbius Transform Controls ---
  mobiusFolder.add(state.transform, 'useClassicalMobius')
    .name('Use Classical Möbius')
    .onChange(value => {
      updateTransformParams({ useClassicalMobius: value });
    });
    
  mobiusFolder.add(state.transform, 'mobiusFactor', -1, 1)
    .name('Factor')
    .onChange(value => {
      updateTransformParams({ mobiusFactor: value });
    });
    
  mobiusFolder.add(state.transform, 'compensationFactor', 0, 1)
    .name('Compensation')
    .onChange(value => {
      updateTransformParams({ compensationFactor: value });
    });
    
  mobiusFolder.add(state.transform, 'timeScaleMobius', 0, 2)
    .name('Time Scale')
    .onChange(value => {
      updateTransformParams({ timeScaleMobius: value });
    });
  
  // --- Classical Möbius Parameters Subfolder ---
  const classicalMobiusFolder = mobiusFolder.addFolder('Classical Parameters');
  
  classicalMobiusFolder.add(state.transform, 'a_real', -2, 2)
    .name('a (real)')
    .onChange(value => {
      updateTransformParams({ a_real: value });
    });
    
  classicalMobiusFolder.add(state.transform, 'a_imag', -2, 2)
    .name('a (imag)')
    .onChange(value => {
      updateTransformParams({ a_imag: value });
    });
    
  classicalMobiusFolder.add(state.transform, 'b_real', -2, 2)
    .name('b (real)')
    .onChange(value => {
      updateTransformParams({ b_real: value });
    });
    
  classicalMobiusFolder.add(state.transform, 'b_imag', -2, 2)
    .name('b (imag)')
    .onChange(value => {
      updateTransformParams({ b_imag: value });
    });
    
  classicalMobiusFolder.add(state.transform, 'c_real', -2, 2)
    .name('c (real)')
    .onChange(value => {
      updateTransformParams({ c_real: value });
    });
    
  classicalMobiusFolder.add(state.transform, 'c_imag', -2, 2)
    .name('c (imag)')
    .onChange(value => {
      updateTransformParams({ c_imag: value });
    });
    
  classicalMobiusFolder.add(state.transform, 'd_real', -2, 2)
    .name('d (real)')
    .onChange(value => {
      updateTransformParams({ d_real: value });
    });
    
  classicalMobiusFolder.add(state.transform, 'd_imag', -2, 2)
    .name('d (imag)')
    .onChange(value => {
      updateTransformParams({ d_imag: value });
    });
    
  classicalMobiusFolder.add(state.transform, 'mobiusAnimationSpeed', 0, 1)
    .name('Animation Speed')
    .onChange(value => {
      updateTransformParams({ mobiusAnimationSpeed: value });
    });
  
  // --- Rotation Modulation Controls ---
  const rotationFolder = mobiusFolder.addFolder('Rotation Modulation');
  
  rotationFolder.add(state.transform.rotationModulation, 'enabled')
    .name('Enable Rotation Mod')
    .onChange(value => {
      updateTransformParams({ 
        rotationModulation: { 
          ...state.transform.rotationModulation,
          enabled: value 
        } 
      });
    });
    
  rotationFolder.add(state.transform.rotationModulation, 'interval', 1, 10)
    .name('Interval')
    .onChange(value => {
      updateTransformParams({ 
        rotationModulation: { 
          ...state.transform.rotationModulation,
          interval: value 
        } 
      });
    });
    
  rotationFolder.add(state.transform.rotationModulation, 'pattern', ['kaprekar', 'heaviside', 'sine', 'random'])
    .name('Pattern')
    .onChange(value => {
      updateTransformParams({ 
        rotationModulation: { 
          ...state.transform.rotationModulation,
          pattern: value 
        } 
      });
    });
    
  rotationFolder.add(state.transform.rotationModulation, 'patternThreshold', 1, 6)
    .name('Pattern Threshold')
    .onChange(value => {
      updateTransformParams({ 
        rotationModulation: { 
          ...state.transform.rotationModulation,
          patternThreshold: value 
        } 
      });
    });
  
  // --- Noise Effects Controls ---
  noiseFolder.add(state.transform, 'noiseScale', 0, 2)
    .name('Noise Scale')
    .onChange(value => {
      updateTransformParams({ noiseScale: value });
    });
    
  noiseFolder.add(state.transform, 'timeScaleNoise', 0, 1)
    .name('Time Scale')
    .onChange(value => {
      updateTransformParams({ timeScaleNoise: value });
    });
  
  // --- Appearance Controls ---
  const colorController = appearanceFolder.addColor(state.appearance, 'baseColor')
    .name('Base Color')
    .onChange(value => {
      updateAppearanceParams({ baseColor: value });
    });
    
  appearanceFolder.addColor(state.appearance, 'activeColor')
    .name('Active Color')
    .onChange(value => {
      updateAppearanceParams({ activeColor: value });
    });
    
  appearanceFolder.add(state.appearance, 'snapIntensity', 0, 1)
    .name('Snap Intensity')
    .onChange(value => {
      updateAppearanceParams({ snapIntensity: value });
    });
    
  appearanceFolder.add(state.appearance, 'heavisideThreshold', 0, 1)
    .name('Heaviside Threshold')
    .onChange(value => {
      updateAppearanceParams({ heavisideThreshold: value });
    });
    
  appearanceFolder.add(state.appearance, 'minSphericity', 0, 1)
    .name('Min Sphericity')
    .onChange(value => {
      updateAppearanceParams({ minSphericity: value });
    });
    
  appearanceFolder.add(state.appearance, 'maxSphericity', 0, 1)
    .name('Max Sphericity')
    .onChange(value => {
      updateAppearanceParams({ maxSphericity: value });
    });
    
  // Texture toggle (checkbox)
  appearanceFolder.add(state.appearance, 'useTexture')
    .name('Use Texture')
    .onChange(value => {
      updateAppearanceParams({ useTexture: value });
    });
  
  // Button to trigger file input for texture upload
  appearanceFolder.add({
    uploadTexture: function() {
      document.getElementById('texture-upload').click();
    }
  }, 'uploadTexture').name('Upload Texture');
  
  // --- Camera Controls ---
  cameraFolder.add(state.camera, 'autoAdjust')
    .name('Auto Adjust')
    .onChange(value => {
      updateCameraParams({ autoAdjust: value });
    });
    
  cameraFolder.add(state.camera, 'followIntensity', 0.01, 0.2)
    .name('Follow Intensity')
    .onChange(value => {
      updateCameraParams({ followIntensity: value });
    });
    
  cameraFolder.add(state.camera, 'minZoom', 1, 10)
    .name('Min Zoom')
    .onChange(value => {
      updateCameraParams({ minZoom: value });
    });
    
  cameraFolder.add(state.camera, 'maxZoom', 10, 30)
    .name('Max Zoom')
    .onChange(value => {
      updateCameraParams({ maxZoom: value });
    });
    
  cameraFolder.add(state.camera, 'zoomMargin', 1, 3)
    .name('Zoom Margin')
    .onChange(value => {
      updateCameraParams({ zoomMargin: value });
    });
    
  cameraFolder.add(state.camera, 'rotationDamping', 0, 1)
    .name('Rotation Damping')
    .onChange(value => {
      updateCameraParams({ rotationDamping: value });
    });
    
  cameraFolder.add(state.camera, 'lookAtCenter')
    .name('Look At Center')
    .onChange(value => {
      updateCameraParams({ lookAtCenter: value });
    });
  
  // --- Presets Menu ---
  const presets = {
    'Default': function() {
      resetToDefault();
    },
    'No Rotation': function() {
      setNoRotation();
    },
    'Strong Waves': function() {
      setStrongWaves();
    },
    'Classic Möbius': function() {
      setClassicMobius();
    },
    'Organic Motion': function() {
      setOrganicMotion();
    }
  };
  
  for (const name in presets) {
    gui.add(presets, name);
  }
  
  // --- Preset Functions ---
  function resetToDefault() {
    updateTransformParams({
      chladniAmplitude: 1.0,
      chladniFrequencyX: 0.5,
      chladniFrequencyY: 0.5,
      mobiusFactor: 0.3,
      useClassicalMobius: true,
      noiseScale: 0.5,
      timeScaleChladni: 1.0,
      timeScaleMobius: 0.5,
      timeScaleNoise: 0.2,
      rotationModulation: {
        enabled: true,
        interval: 5.0,
        pattern: "kaprekar",
        patternThreshold: 3
      },
      a_real: 1.0, a_imag: 0.0,
      b_real: 0.0, b_imag: 0.0,
      c_real: 0.0, c_imag: 0.0,
      d_real: 1.0, d_imag: 0.0,
      mobiusAnimationSpeed: 0.1,
      compensationFactor: 1.0
    });
    
    updateAppearanceParams({
      baseColor: 0xffffff,
      activeColor: 0xffffff,
      snapIntensity: 0.0,
      heavisideThreshold: 0.5,
      minSphericity: 0.0,
      maxSphericity: 1.0
    });
    
    // Update all GUI controllers
    for (let i = 0; i < gui.__controllers.length; i++) {
      gui.__controllers[i].updateDisplay();
    }
    
    // Update folders recursively
    updateFolderControllers(gui);
  }
  
  function setNoRotation() {
    updateTransformParams({
      mobiusFactor: 0.0,
      rotationModulation: {
        ...state.transform.rotationModulation,
        enabled: false
      },
      mobiusAnimationSpeed: 0.0,
      timeScaleMobius: 0.0,
      compensationFactor: 0.0,
      useClassicalMobius: true,
      a_real: 1.0, a_imag: 0.0,
      b_real: 0.0, b_imag: 0.0,
      c_real: 0.0, c_imag: 0.0,
      d_real: 1.0, d_imag: 0.0
    });
    
    updateFolderControllers(gui);
  }
  
  function setStrongWaves() {
    updateTransformParams({
      chladniAmplitude: 2.0,
      chladniFrequencyX: 1.0,
      chladniFrequencyY: 1.0,
      mobiusFactor: 0.1,
      timeScaleChladni: 1.5,
      noiseScale: 0.8
    });
    
    updateFolderControllers(gui);
  }
  
  function setClassicMobius() {
    updateTransformParams({
      useClassicalMobius: true,
      a_real: 1.0, a_imag: 0.5,
      b_real: 0.0, b_imag: 0.0,
      c_real: 0.0, c_imag: 0.0,
      d_real: 1.0, d_imag: 0.0,
      mobiusAnimationSpeed: 0.05,
      chladniAmplitude: 0.5,
      noiseScale: 0.3
    });
    
    updateFolderControllers(gui);
  }
  
  function setOrganicMotion() {
    updateTransformParams({
      useClassicalMobius: false,
      mobiusFactor: 0.2,
      noiseScale: 1.0,
      timeScaleNoise: 0.5,
      chladniAmplitude: 0.8,
      rotationModulation: {
        enabled: true,
        interval: 8.0,
        pattern: "sine",
        patternThreshold: 3
      },
      compensationFactor: 0.5
    });
    
    updateFolderControllers(gui);
  }
  
  // Helper to update controllers in all folders recursively
  function updateFolderControllers(folder) {
    for (let i in folder.__folders) {
      const subfolder = folder.__folders[i];
      for (let j = 0; j < subfolder.__controllers.length; j++) {
        subfolder.__controllers[j].updateDisplay();
      }
      updateFolderControllers(subfolder);
    }
  }
  
  // Open important folders by default
  transformFolder.open();
  mobiusFolder.open();
  appearanceFolder.open();
  
  return gui;
}