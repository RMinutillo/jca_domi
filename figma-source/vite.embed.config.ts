import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/design/",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "../dist/design",
    emptyOutDir: false,
    rollupOptions: {
      input: "src/embed.tsx",
      output: { entryFileNames: "embed.js" },
    },
  },
});
