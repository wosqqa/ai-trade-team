import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
 const env=loadEnv(mode,process.cwd(),'');
 return {
  plugins: [vue()],
  server: { proxy: { '/api': { target: 'http://127.0.0.1:3001', headers: { Authorization: 'Bearer '+(env.API_TOKEN||'') } } } },
  base: process.env.VITE_BASE_PATH || '/',
}})
