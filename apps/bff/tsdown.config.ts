import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: { server: 'src/server.ts' },
    format: 'esm',
    platform: 'node',
    dts: false,
    clean: true,
    noExternal: [/^@react-template\//],
  },
  {
    entry: { client: 'src/client.ts' },
    format: 'esm',
    platform: 'neutral',
    dts: true,
    clean: false,
    noExternal: [/^@react-template\//],
  },
]);
