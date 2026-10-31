import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The sandbox serves the app through a proxy on a rotating sandbox host.
// In preview mode we let Vite accept that whole subdomain family.
const sandboxDomain = process.env.BASE44_SANDBOX_HOST_DOMAIN
const allowedHosts =
  process.env.BASE44_PREVIEW_MODE === '1' && sandboxDomain
    ? ['localhost', '127.0.0.1', `.${sandboxDomain}`]
    : ['localhost', '127.0.0.1']

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts,
    watch: { usePolling: true, interval: 300 },
  },
})
