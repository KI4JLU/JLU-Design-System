/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import dts from "vite-plugin-dts";

/**
 * Library build: ESM + type declarations. All runtime deps (react, radix,
 * cva/clsx/tailwind-merge, lucide) stay external — consumers install them via
 * the package's dependencies/peerDependencies. Tailwind classes ship as plain
 * strings; consumers compile them with their own Tailwind 4 setup (see README).
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({
      include: ["src"],
      exclude: ["src/**/*.stories.tsx", "src/**/*.test.ts", "src/**/*.test.tsx", "src/test"],
    }),
  ],
  build: {
    lib: {
      entry: "./src/index.ts",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: [
        /^react($|\/)/,
        /^react-dom($|\/)/,
        /^@radix-ui\//,
        "class-variance-authority",
        "clsx",
        "tailwind-merge",
        /^lucide-react($|\/)/,
      ],
    },
  },
  test: {
    // globals: needed for @testing-library/react's automatic DOM cleanup
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
