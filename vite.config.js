import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub project Pages: https://<user>.github.io/<repo>/
const base = process.env.BASE_URL?.trim() || "/";

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
  },
});

