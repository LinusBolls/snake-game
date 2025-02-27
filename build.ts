await Bun.build({
  entrypoints: ['./src/client/index.ts'],
  outdir: './static',
  target: 'browser',
});
