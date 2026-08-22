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
    // viz/mermaid/cynefin are lazy-loaded — only fetched when diagrams are rendered
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (
            id.includes("@firebase/messaging") ||
            id.includes("firebase/messaging")
          )
            return "vendor-firebase-messaging";
          if (
            id.includes("@firebase/firestore") ||
            id.includes("firebase/firestore")
          )
            return "vendor-firebase-db";
          if (
            id.includes("@firebase/storage") ||
            id.includes("firebase/storage")
          )
            return "vendor-firebase-storage";
          if (id.includes("@firebase") || id.includes("firebase"))
            return "vendor-firebase-core";
          if (id.includes("react-pdf") || id.includes("pdfjs-dist"))
            return "vendor-pdf";
          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("react-dom") || id.includes("/react/"))
            return "vendor-react";
          if (id.includes("/marked/")) return "vendor-marked";
        },
      },
    },
  },
});
