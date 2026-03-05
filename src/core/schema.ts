import { z } from 'zod';

export const salesKitInputSchema = z.object({
  modo: z.enum(['ultraconservador']).default('ultraconservador'),
  lead: z.object({
    nome_clinica: z.string().min(2),
    nome_decisor: z.string().optional(),
    whatsapp: z.string().min(8),
    cidade: z.string().min(2),
    nicho: z.enum(['dentista', 'fisio', 'nutri', 'clinica_medica', 'outro']),
  }),
  operacao_atual: z.object({
    horario_atendimento: z.string().min(3),
    tempo_medio_resposta_min: z.number().positive(),
    quem_responde: z.enum(['dono', 'secretaria', 'outros']),
    canais: z.array(z.enum(['whatsapp', 'instagram', 'site'])).min(1),
  }),
  numeros: z
    .object({
      leads_mes: z.number().positive().optional(),
      conversao_atual_pct: z.number().min(0).max(100).optional(),
      ticket_medio: z.number().positive().optional(),
      agendamentos_mes: z.number().nonnegative().optional(),
      no_show_pct: z.number().min(0).max(100).optional(),
    })
    .default({}),
  objetivo: z.object({
    meta_agendamentos_mes: z.number().positive(),
    restricoes: z.array(z.string()).default([]),
  }),
  observacoes_livres: z.string().optional(),
});

export type SalesKitInput = z.infer<typeof salesKitInputSchema>;

export type AssumptionItem = {
  campo: string;
  valor_assumido: string | number;
  faixa: string;
  motivo: string;
  como_validar: string;
};
