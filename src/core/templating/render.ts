import nicheDentista from '@/content/nichos/dentista.json';
import nicheFisio from '@/content/nichos/fisio.json';
import nicheNutri from '@/content/nichos/nutri.json';
import nicheClinica from '@/content/nichos/clinica_medica.json';
import nicheOutro from '@/content/nichos/outro.json';
import type { RoiResult } from '@/core/roi/calculate';
import type { SalesKitInput } from '@/core/schema';

type NichePack = {
  dores_comuns: string[];
  objecoes_comuns: string[];
  respostas_eticas: string[];
  perguntas_qualificacao: string[];
  cta_agendamento: string;
};

const nicheMap: Record<SalesKitInput['lead']['nicho'], NichePack> = {
  dentista: nicheDentista,
  fisio: nicheFisio,
  nutri: nicheNutri,
  clinica_medica: nicheClinica,
  outro: nicheOutro,
};

const css = `
body { font-family: Inter, Arial, sans-serif; margin: 24px; color: #0f172a; }
h1, h2 { color: #0b3b66; }
.card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; margin-bottom: 14px; }
.small { color: #475569; font-size: 14px; }
ul { margin-top: 6px; }
strong { color: #0f172a; }
`;

export function renderKitHtml(input: SalesKitInput, roi: RoiResult): { diagnostico: string; proposta: string; scripts: string; onepager: string } {
  const niche = nicheMap[input.lead.nicho];
  const decisorRoute =
    input.operacao_atual.quem_responde === 'dono'
      ? 'Contato já está com decisor. Próximo passo: reunião objetiva de 20 min com dados de agenda e canais.'
      : 'Contato inicial não é decisor. Rota sugerida: validar dor operacional com quem responde e pedir ponte curta com dono/gestor usando resumo de perdas e ganho de velocidade.';

  const diagnostico = `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Diagnóstico</title><style>${css}</style></head><body>
  <h1>Diagnóstico operacional — ${input.lead.nome_clinica}</h1>
  <p class="small">Tom premium, foco em processo, resposta rápida e conversão ética. IA amplifica, humano decide.</p>
  <div class="card"><h2>1) Diagnóstico</h2><ul>${roi.diagnostico_operacional.map((d) => `<li>${d}</li>`).join('')}</ul></div>
  <div class="card"><h2>Dados e suposições</h2><p><strong>Inputs:</strong> ${JSON.stringify(roi.inputs)}</p><p><strong>Suposições:</strong> ${roi.assumptions.length}</p></div>
  <div class="card"><h2>Dores do nicho (${input.lead.nicho})</h2><ul>${niche.dores_comuns.map((d) => `<li>${d}</li>`).join('')}</ul></div>
  <div class="card"><h2>Rota para decisor</h2><p>${decisorRoute}</p></div>
  </body></html>`;

  const proposta = `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Proposta</title><style>${css}</style></head><body>
  <h1>Sales Kit Master — ${input.lead.nome_clinica}</h1>
  <div class="card"><h2>2) Estratégia</h2><p>Priorizar velocidade de resposta, qualificação padronizada e follow-up ativo em WhatsApp/Instagram/site. IA opera a cadência; equipe humana decide exceções, urgências e fechamento.</p></div>
  <div class="card"><h2>3) Plano executável</h2>
    <ul>
      <li>Agente WhatsApp 24/7 para triagem e resposta inicial em até 1 minuto.</li>
      <li>Handoff humano com contexto completo quando houver pedido de humano, convênio ou urgência clínica.</li>
      <li>Rotina semanal de melhorias: revisar objeções, respostas e horários de pico.</li>
      <li>Relatório simples de operação e decisões: SLA de resposta, taxa de follow-up e agendamentos líquidos.</li>
    </ul>
  </div>
  <div class="card"><h2>ROI ultraconservador</h2>
    <p>Cenário mínimo plausível: +${roi.cenarios.minimo_plausivel.agendamentos_adicionais} agendamentos/mês (~R$ ${roi.cenarios.minimo_plausivel.receita_adicional}).</p>
    <p>Cenário conservador: +${roi.cenarios.conservador.agendamentos_adicionais} agendamentos/mês (~R$ ${roi.cenarios.conservador.receita_adicional}).</p>
    <p class="small">Sem promessa agressiva. Ganho estimado com hipóteses explícitas e validáveis junto ao cliente.</p>
  </div>
  <div class="card"><h2>4) Próximos passos</h2>
    <ol>
      <li>Validar suposições em 30-45 min (leads, conversão, no-show, ticket).</li>
      <li>Configurar fluxo inicial e handoff em até 7 dias.</li>
      <li>Rodar 2 semanas com acompanhamento e ajustes.</li>
    </ol>
  </div>
  </body></html>`;

  const scripts = `# Scripts prontos (${input.lead.nicho})\n
## WhatsApp - abertura
Olá, aqui é da WaveBrainBot. Vi que vocês atendem ${input.lead.nicho} em ${input.lead.cidade}. Posso te fazer 2 perguntas rápidas para entender como reduzir tempo de resposta e perda de lead sem mudar sua rotina clínica?

## Ligação - 30 segundos
"Quero ser objetivo: hoje nós ajudamos clínicas a responderem mais rápido, organizarem follow-up e aumentarem agendamentos com controle humano. Se fizer sentido, te mostro um diagnóstico curto com suposições conservadoras e como validar tudo em dados reais."

## Follow-up 1 (24h)
Passando para te enviar um resumo: mapeamos gargalos de resposta e follow-up que podem estar reduzindo agendamentos. Se quiser, te apresento em 15 min com cenário mínimo plausível e plano executável.

## Follow-up 2 (72h)
Sem pressão: se agora não for prioridade, te deixo um one-pager com checklist operacional para sua equipe aplicar já. Quando quiser, retomamos.

## Objeções comuns e resposta ética
${niche.objecoes_comuns.map((o, i) => `- ${o}: ${niche.respostas_eticas[i] ?? niche.respostas_eticas[0]}`).join('\n')}

## CTA de agendamento
${niche.cta_agendamento}
`;

  const onepager = `WaveBrainBot | ${input.lead.nome_clinica}
Diagnóstico rápido: resposta atual em ${input.operacao_atual.tempo_medio_resposta_min} min + follow-up inconsistente => perda de lead.
Estratégia: acelerar 1º contato, padronizar qualificação e manter handoff humano.
Plano: agente WhatsApp 24/7, handoff humano, rotina semanal e relatório simples.
ROI ultraconservador: mínimo plausível +${roi.cenarios.minimo_plausivel.agendamentos_adicionais}/mês; conservador +${roi.cenarios.conservador.agendamentos_adicionais}/mês.
Próximo passo: validar suposições com dados reais e iniciar piloto de 14 dias.`;

  return { diagnostico, proposta, scripts, onepager };
}
