import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Demo pública: la URL de la API sale de .env.demo y pisa cualquier
  // VITE_API_URL del entorno (Vercel), así nunca apunta al backend real.
  const demo = mode === 'demo' ? loadEnv('demo', '.', 'VITE_DEMO_') : null
  return {
    plugins: [react()],
    define: demo
      ? {
          'import.meta.env.VITE_API_URL': JSON.stringify(demo.VITE_DEMO_API_URL),
          'import.meta.env.VITE_IS_DEMO': JSON.stringify('true'),
        }
      : {},
  }
})
