import fs from 'node:fs/promises';
import path from 'node:path';

// Keep the original per-page CSS cascade, but deliver it with the server HTML.
// This build-time step avoids a stylesheet request before the hero can paint.
const root = process.cwd();
const styles = {};
for (const file of await fs.readdir(path.join(root, 'public/styles'))) {
  if (file.endsWith('.css')) {
    styles['/styles/' + file] = await fs.readFile(path.join(root, 'public/styles', file), 'utf8');
  }
}
await fs.writeFile(path.join(root, 'src/data/design-styles.json'), JSON.stringify(styles));
console.log('Prepared local page styles.');
