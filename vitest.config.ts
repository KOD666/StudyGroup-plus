import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    passWithNoTests: true,
    exclude: ["**/node_modules/**", "**/study-group-plus/**", "**/.next/**"],
    env: {
      GEMINI_API_KEY: "",
      LLM_API_KEY: "",
      GROQ_API_KEY: "",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
