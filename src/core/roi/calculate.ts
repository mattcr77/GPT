import type { AssumptionItem, SalesKitInput } from '@/core/schema';

export type RoiResult = {
  assumptions: AssumptionItem[];
  inputs: Record<string, string | number>;
  cenarios: {
    minimo_plausivel: { agendamentos_adicionais: number; receita_adicional: number };
    conservador: { agendamentos_adicionais: number; receita_adicional: number };
  };
  diagnostico_operacional: string[];
};

const conservativeLossByResponseTime = (minutes: number): { min: number; cons: number } => {
  if (minutes <= 5) return { min: 0.02, cons: 0.04 };
  if (minutes <= 15) return { min: 0.05, cons: 0.1 };
  if (minutes <= 60) return { min: 0.1, cons: 0.18 };
  if (minutes <= 240) return { min: 0.14, cons: 0.25 };
  return { min: 0.18, cons: 0.3 };
};

export function calculateUltraConservativeROI(data: SalesKitInput): RoiResult {
  const assumptions: AssumptionItem[] = [];

  const leadsMes = data.numeros.leads_mes ?? 80;
  if (!data.numeros.leads_mes) {
    assumptions.push({
      campo: 'leads_mes',
      valor_assumido: 80,
      faixa: '60-120',
      motivo: 'Cliente não informou volume mensal de leads.',
      como_validar: 'Extrair total de conversas iniciadas no WhatsApp + DMs no Instagram + formulários do site nos últimos 30 dias.',
    });
  }

  const conversaoPct = data.numeros.conversao_atual_pct ?? 8;
  if (!data.numeros.conversao_atual_pct) {
    assumptions.push({
      campo: 'conversao_atual_pct',
      valor_assumido: 8,
      faixa: '5-12',
      motivo: 'Sem taxa de conversão histórica consolidada.',
      como_validar: 'Comparar quantidade de leads qualificados vs agendamentos concluídos no último mês.',
    });
  }

  const ticket = data.numeros.ticket_medio ?? 280;
  if (!data.numeros.ticket_medio) {
    assumptions.push({
      campo: 'ticket_medio',
      valor_assumido: 280,
      faixa: '180-450',
      motivo: 'Ticket médio não informado.',
      como_validar: 'Calcular média de valor recebido por agendamento concluído no financeiro/ERP.',
    });
  }

  const noShowPct = data.numeros.no_show_pct ?? 18;
  if (!data.numeros.no_show_pct) {
    assumptions.push({
      campo: 'no_show_pct',
      valor_assumido: 18,
      faixa: '12-25',
      motivo: 'No-show não medido de forma consistente.',
      como_validar: 'Conferir agenda do último mês e identificar faltas sobre total de agendamentos marcados.',
    });
  }

  const leadToSched = conversaoPct / 100;
  const noShowRate = noShowPct / 100;
  const loss = conservativeLossByResponseTime(data.operacao_atual.tempo_medio_resposta_min);

  const followupRecoveryMin = 0.04;
  const followupRecoveryCons = 0.07;

  const baseAgendamentos = leadsMes * leadToSched;
  const oportunidadeMin = baseAgendamentos * (loss.min + followupRecoveryMin);
  const oportunidadeCons = baseAgendamentos * (loss.cons + followupRecoveryCons);

  const realizadosMin = oportunidadeMin * (1 - noShowRate);
  const realizadosCons = oportunidadeCons * (1 - noShowRate);

  const cenMin = {
    agendamentos_adicionais: Number(realizadosMin.toFixed(1)),
    receita_adicional: Number((realizadosMin * ticket).toFixed(0)),
  };
  const cenCons = {
    agendamentos_adicionais: Number(realizadosCons.toFixed(1)),
    receita_adicional: Number((realizadosCons * ticket).toFixed(0)),
  };

  const diagnostico_operacional = [
    `Tempo médio de resposta atual: ${data.operacao_atual.tempo_medio_resposta_min} min (impacta perdas em janela comercial).`,
    'Perda por ausência de follow-up estruturado após o primeiro contato.',
    'Ausência de trilha consistente de qualificação e handoff para humano no momento certo.',
  ];

  return {
    assumptions,
    inputs: {
      leads_mes: leadsMes,
      conversao_atual_pct: conversaoPct,
      ticket_medio: ticket,
      no_show_pct: noShowPct,
      tempo_medio_resposta_min: data.operacao_atual.tempo_medio_resposta_min,
      modo: data.modo,
    },
    cenarios: {
      minimo_plausivel: cenMin,
      conservador: cenCons,
    },
    diagnostico_operacional,
  };
}
