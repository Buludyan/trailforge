import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WORKER_FILES = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs'];

const require = createRequire(import.meta.url);
const distDir = join(dirname(require.resolve('maplibre-gl/package.json')), 'dist');
const targetDir = join(dirname(dirname(fileURLToPath(import.meta.url))), 'public', 'maplibre');

await mkdir(targetDir, { recursive: true });

for (const file of WORKER_FILES) {
  await copyFile(join(distDir, file), join(targetDir, file));
}

console.log(`copied ${WORKER_FILES.length} maplibre worker files to public/maplibre`);
