import fs from 'fs';
import path from 'path';

const root = path.resolve(process.cwd());
const required = [
  'package.json',
  'scoring.config.js',
  'src/domain/job.js',
  'src/profile/profile.js',
  'src/scoring/engine.js',
  'src/filters/engine.js',
  'src/pipeline/stage.js',
  'src/storage/store.js',
  'src/utils/helpers.js',
  'src/adapters/manual-source.js',
  'src/adapters/mock-source.js',
  'src/adapters/input-parser.js',
  'src/services/radar.js',
  'src/services/app.js',
  'preview/index.html'
];

const missing = [];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) missing.push(file);
}

if (missing.length) {
  console.log('MISSING\n' + missing.join('\n'));
  process.exit(1);
}
console.log('OK');
