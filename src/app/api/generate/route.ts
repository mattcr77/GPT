import { generateSalesKit } from '@/core/generators/generateSalesKit';

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const json = JSON.parse(raw);
    const result = await generateSalesKit(json);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
