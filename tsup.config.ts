import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { stdio: 'src/stdio.ts' },
    format: ['esm'],
    dts: true,
    clean: true,
    target: 'node20',
    banner: { js: '#!/usr/bin/env node' },
  },
  {
    entry: { stdio: 'src/stdio.ts' },
    format: ['cjs'],
    dts: false,
    clean: false,
    target: 'node20',
  },
  {
    entry: { http: 'src/http.ts' },
    format: ['esm'],
    dts: false,
    clean: false,
    target: 'node20',
  },
]);
