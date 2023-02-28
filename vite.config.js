import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(),viteCompression({threshold:1,filter:/\.(js|mjs|json|css|html|obj)$/i})]
})
