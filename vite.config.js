import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
