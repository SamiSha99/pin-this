import { defineConfig } from "vite";

export default defineConfig({
    root: "src",
    base: "./",
    build: {
        outDir: "../dist",
        emptyOutDir: true,
        sourcemap: true,
        lib: {
            entry: "main.ts",
            name: "myModule",
            formats: ["es"],
        },
        rollupOptions: {
            external: ["jquery", "foundry.js"],
            output: {
                globals: {
                    jquery: "$",
                },
            },
        },
    },
});
