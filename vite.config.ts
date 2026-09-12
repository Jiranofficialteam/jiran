import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const SUPABASE_URL = "https://pegdfoymrrhuqwuvqurc.supabase.co";
const SUPABASE_PROJECT_ID = "pegdfoymrrhuqwuvqurc";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_af0rNiYvGlvoe34zTbgRmw_RpQSeAo7";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/auth-proxy": {
        target: SUPABASE_URL,
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/auth-proxy/, "/auth/v1"),
      },
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(SUPABASE_URL),
    "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(SUPABASE_PROJECT_ID),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(SUPABASE_PUBLISHABLE_KEY),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(SUPABASE_PUBLISHABLE_KEY),
  },
}));
