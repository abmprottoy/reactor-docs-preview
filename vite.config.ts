import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  base: process.env.GITHUB_PAGES ? "/reactor-docs-preview/" : "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@fluentui/react-icons": path.resolve(__dirname, "src/fluent-icons-shim.tsx"),
      "@fluentui/react-icons/lib/providers": path.resolve(__dirname, "src/fluent-icon-providers-shim.tsx"),
    },
  },
});
