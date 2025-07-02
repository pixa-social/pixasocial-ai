import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      'process.env': env
    },
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        overlay: false
      }
    },
    preview: {
      port: 5173,
      strictPort: true
    }
  };
});
