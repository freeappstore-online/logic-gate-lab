import { cpSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

try {
  mkdirSync(resolve('web/dist'), { recursive: true });
  cpSync(resolve('dist'), resolve('web/dist'), { recursive: true });
  console.log('Successfully copied dist to web/dist');
} catch (err) {
  console.error('Error syncing dist to web/dist:', err);
  process.exit(1);
}
