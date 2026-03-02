# Modelo de Config Multi-tenant

```json
{
  "tenant_id": "demo_clinica",
  "nome": "Clínica Demo",
  "timezone": "America/Sao_Paulo",
  "numero_whatsapp": "+5511999999999",
  "horario_atendimento": {
    "inicio": "08:00",
    "fim": "18:00",
    "dias": [1,2,3,4,5,6]
  },
  "regras_nicho": {
    "nicho": "clinica_odontologica",
    "perguntas": ["procedimento", "urgencia", "convenio", "horario_preferido"]
  },
  "destino_notificacao": {
    "canal": "telegram",
    "endpoint": "https://hooks.slack.com/services/..."
  },
  "links_agenda": {
    "principal": "https://agenda.exemplo.com/tenant/demo_clinica"
  },
  "limites_followup": {
    "max_tentativas": 3,
    "horas_entre_tentativas": 24
  }
}
```

## Origem da Config
1. **Mock**: node `Load Tenant Config (Mock/Supabase)` retorna config default.
2. **Produção**: trocar por query Supabase table `tenants_config` filtrando por `tenant_id`.

## Resolução de tenant_id
- Prioridade recomendada: `payload.tenant_id` > `token` > `numero_whatsapp`.
