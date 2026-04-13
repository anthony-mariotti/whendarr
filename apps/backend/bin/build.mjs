import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/**/*.ts'],
  logLevel: 'info',
  outdir: 'dist',
  bundle: true,
  minify: false,
  platform: 'node',
  target: 'node24.13',
  format: 'cjs',
  sourcemap: true,
});