import fs from 'node:fs/promises';
import path from 'node:path';

export default async function PreviewPage() {
  const outputsRoot = path.join(process.cwd(), 'outputs');
  const dirs = await fs.readdir(outputsRoot).catch(() => []);
  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-2xl font-semibold">Preview de outputs locais</h1>
      <ul className="mt-4 list-disc pl-6">
        {dirs.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
    </main>
  );
}
