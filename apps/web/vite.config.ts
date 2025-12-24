import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const port = (process.env.PUBLIC_DEV_PORT as unknown as number) || 3000;

export default defineConfig({
  server: {
    port,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/"),
      "@assets": path.resolve(__dirname, "./src/assets/"),
      "@components": path.resolve(__dirname, "./src/components/"),
      "@pages": path.resolve(__dirname, "./src/pages/"),
      "@services": path.resolve(__dirname, "./src/services/"),
      "@store": path.resolve(__dirname, "./src/store/"),
      "@styles": path.resolve(__dirname, "./src/styles/"),
      "@utils": path.resolve(__dirname, "./src/utils/"),
    },
  },
  plugins: [react(), tailwindcss(), {
    name: "markdown-loader",
    transform(code, id) {
      if (id.slice(-3) === ".md") {
        // For .md files, get the raw content
        return `export default ${JSON.stringify(code)};`;
      }
    }
  }],
});
