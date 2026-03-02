import fs from 'node:fs/promises';
import path from 'node:path';
import { calculateUltraConservativeROI } from '@/core/roi/calculate';
import { salesKitInputSchema, type SalesKitInput } from '@/core/schema';
import { renderKitHtml } from '@/core/templating/render';

const slugify = (v: string) =>
  v
    .normalize('NFD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');

async function generatePdfFromHtml(htmlPath: string, pdfPath: string): Promise<boolean> {
  try {
    const playwright = await import('playwright');
    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
    await browser.close();
    return true;
  } catch {
    return false;
  }
}

export async function generateSalesKit(rawInput: unknown) {
  const data: SalesKitInput = salesKitInputSchema.parse(rawInput);
  const roi = calculateUltraConservativeROI(data);
  const rendered = renderKitHtml(data, roi);

  const clientFolder = slugify(data.lead.nome_clinica);
  const outputDir = path.join(process.cwd(), 'outputs', clientFolder);
  await fs.mkdir(outputDir, { recursive: true });

  const diagnosticoPath = path.join(outputDir, 'diagnostico.html');
  const propostaPath = path.join(outputDir, 'proposta.html');
  const scriptsPath = path.join(outputDir, 'scripts.md');
  const assumptionsPath = path.join(outputDir, 'assumptions.json');
  const onepagerPath = path.join(outputDir, 'onepager.txt');
  const pdfPath = path.join(outputDir, 'sales-kit.pdf');

  await Promise.all([
    fs.writeFile(diagnosticoPath, rendered.diagnostico, 'utf-8'),
    fs.writeFile(propostaPath, rendered.proposta, 'utf-8'),
    fs.writeFile(scriptsPath, rendered.scripts, 'utf-8'),
    fs.writeFile(onepagerPath, rendered.onepager, 'utf-8'),
    fs.writeFile(
      assumptionsPath,
      JSON.stringify({ assumptions: roi.assumptions, inputs: roi.inputs, como_validar: roi.assumptions.map((s) => s.como_validar) }, null, 2),
      'utf-8',
    ),
  ]);

  const pdfGenerated = await generatePdfFromHtml(propostaPath, pdfPath);

  return {
    outputDir,
    pdfGenerated,
    files: {
      diagnostico: diagnosticoPath,
      proposta: propostaPath,
      scripts: scriptsPath,
      assumptions: assumptionsPath,
      onepager: onepagerPath,
      pdf: pdfGenerated ? pdfPath : null,
    },
  };
}
