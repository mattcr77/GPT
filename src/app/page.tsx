'use client';

import { useState } from 'react';

const initial = {
  modo: 'ultraconservador',
  lead: { nome_clinica: '', nome_decisor: '', whatsapp: '', cidade: '', nicho: 'dentista' },
  operacao_atual: { horario_atendimento: '08:00-18:00', tempo_medio_resposta_min: 30, quem_responde: 'secretaria', canais: ['whatsapp'] },
  numeros: {},
  objetivo: { meta_agendamentos_mes: 40, restricoes: [] },
  observacoes_livres: '',
};

export default function Home() {
  const [payload, setPayload] = useState(JSON.stringify(initial, null, 2));
  const [result, setResult] = useState<string>('');

  const submit = async () => {
    const response = await fetch('/api/generate', { method: 'POST', body: payload });
    const data = await response.json();
    setResult(JSON.stringify(data, null, 2));
  };

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-4 text-3xl font-semibold">Sales Kit Master</h1>
      <p className="mb-4">Foco em resposta rápida, processo e operação. IA amplifica, humano decide.</p>
      <textarea className="h-80 w-full rounded border p-3 font-mono text-sm" value={payload} onChange={(e) => setPayload(e.target.value)} />
      <button className="mt-4 rounded bg-slate-900 px-4 py-2 text-white" onClick={submit}>Gerar Kit</button>
      <pre className="mt-6 whitespace-pre-wrap rounded border bg-white p-3">{result}</pre>
    </main>
  );
}
