import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";
import { readdirSync, statSync } from "fs";
import { join } from "path";

// Function to recursively get all files in a directory
function getFiles(dir: string) {
  let files: string[] = [];
  readdirSync(dir).forEach((file) => {
    const fullPath = join(dir, file);
    if (statSync(fullPath).isDirectory()) {
      files = [...files, ...getFiles(fullPath)];
    } else {
      files.push(fullPath);
    }
  });
  return files;
}

// Get all test files
const testFiles = getFiles("src/tests").map((file) => `src/tests/${file}`);

export default defineConfig({
  base: "/flashbackbot/",
  plugins: [react(), legacy()],
  build: {
    rollupOptions: {
      external: testFiles,
      output: {
        // Exclude test files from the output
        entryFileNames: ({ name }) => {
          if (testFiles.includes(name)) {
            return "";
          }
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    terserOptions: {
      compress: {
        drop_console: true,
      },
      format: {
        comments: false,
      },
    },
    minify: "terser",
  },
});
