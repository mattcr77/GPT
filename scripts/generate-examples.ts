import fs from 'node:fs/promises';
import path from 'node:path';
import { generateSalesKit } from '@/core/generators/generateSalesKit';

async function run() {
  const files = ['dentista.json', 'fisio.json', 'nutri.json'];
  for (const file of files) {
    const full = path.join(process.cwd(), 'scripts/examples', file);
    const json = JSON.parse(await fs.readFile(full, 'utf-8'));
    const result = await generateSalesKit(json);
    console.log(file, result.outputDir, result.pdfGenerated ? 'pdf-ok' : 'pdf-fallback-html');
  }
}

run();
