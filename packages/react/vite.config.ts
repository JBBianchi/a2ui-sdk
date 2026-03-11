import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths({
      projects: ['./tsconfig.build.json'],
    }),
    dts({
      include: ['src'],
      outDir: 'dist',
      tsconfigPath: './tsconfig.build.json',
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        '0.8/index': resolve(__dirname, 'src/0.8/index.ts'),
        '0.8/standard-catalog/index': resolve(
          __dirname,
          'src/0.8/standard-catalog/index.ts'
        ),
        '0.9/index': resolve(__dirname, 'src/0.9/index.ts'),
        '0.9/standard-catalog/index': resolve(
          __dirname,
          'src/0.9/standard-catalog/index.ts'
        ),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id, importer) =>
        // Don't externalize entry points (no importer) or resolved absolute paths
        importer == null
          ? false
          : id === 'react' ||
            id === 'react-dom' ||
            id === 'react/jsx-runtime' ||
            (!id.startsWith('.') &&
              !id.startsWith('/') &&
              !id.startsWith('@/') &&
              !/^[A-Za-z]:/.test(id)),
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
})
