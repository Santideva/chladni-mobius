import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import path from 'path';

export default defineConfig({
  plugins: [glsl()],
  resolve: {
    alias: {
      three: path.resolve(__dirname, 'node_modules/three/build/three.module.js')
    }
  },
  optimizeDeps: {
    include: ['three']
  }
});
