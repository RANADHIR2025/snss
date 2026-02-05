import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Add security headers for dev server
    headers: {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Add build security optimizations
  build: {
    sourcemap: mode === 'development', // Only enable sourcemaps in dev
    minify: 'terser', // Use terser for better minification
    rollupOptions: {
      output: {
        // Security: Add contenthash for cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Security: Remove console logs in production
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
  },
  // Security: Only expose VITE_ prefixed env vars
  envPrefix: 'VITE_',
  // Add CSP for build (optional, better to set at server level)
  // csp: {
  //   directives: {
  //     'default-src': ["'self'"],
  //     'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  //     'style-src': ["'self'", "'unsafe-inline'"],
  //     'img-src': ["'self'", "data:", "https:"],
  //     'connect-src': ["'self'", "https://itefzvrbcnlqotptgznc.supabase.co"],
  //   }
  // }
}));