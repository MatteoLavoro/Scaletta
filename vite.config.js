import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5173,
      clientPort: 5173,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - librerie esterne
          "vendor-react": ["react", "react-dom"],
          "vendor-firebase-core": ["firebase/app", "firebase/auth"],
          "vendor-firebase-db": ["firebase/firestore"],
          "vendor-firebase-storage": ["firebase/storage"],
          "vendor-pdf": ["react-pdf", "pdfjs-dist"],
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
});
