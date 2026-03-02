import { describe, expect, it } from 'vitest';
import { calculateUltraConservativeROI } from '@/core/roi/calculate';

describe('ultraconservative ROI', () => {
  it('returns conservative scenario above minimum scenario', () => {
    const result = calculateUltraConservativeROI({
      modo: 'ultraconservador',
      lead: {
        nome_clinica: 'Clinica Teste',
        nome_decisor: 'Ana',
        whatsapp: '11999999999',
        cidade: 'São Paulo',
        nicho: 'dentista',
      },
      operacao_atual: {
        horario_atendimento: '08:00-18:00',
        tempo_medio_resposta_min: 60,
        quem_responde: 'secretaria',
        canais: ['whatsapp'],
      },
      numeros: {
        leads_mes: 100,
        conversao_atual_pct: 8,
        ticket_medio: 300,
        no_show_pct: 20,
      },
      objetivo: { meta_agendamentos_mes: 40, restricoes: [] },
      observacoes_livres: '',
    });

    expect(result.cenarios.conservador.agendamentos_adicionais).toBeGreaterThan(
      result.cenarios.minimo_plausivel.agendamentos_adicionais,
    );
    expect(result.assumptions).toHaveLength(0);
  });

  it('creates assumptions for missing data', () => {
    const result = calculateUltraConservativeROI({
      modo: 'ultraconservador',
      lead: {
        nome_clinica: 'Clinica Teste',
        whatsapp: '11999999999',
        cidade: 'São Paulo',
        nicho: 'fisio',
      },
      operacao_atual: {
        horario_atendimento: '08:00-18:00',
        tempo_medio_resposta_min: 120,
        quem_responde: 'outros',
        canais: ['instagram'],
      },
      numeros: {},
      objetivo: { meta_agendamentos_mes: 20, restricoes: [] },
      observacoes_livres: '',
    });

    expect(result.assumptions.length).toBeGreaterThanOrEqual(3);
  });
});
