# n8n Super Pack — WhatsApp 24/7 + Follow-up para Clínicas

Pacote de workflows n8n pronto para agência, com foco em operação multi-cliente (`tenant_id`), mock mode e observabilidade.

## Estrutura

- `workflows/`: 11 workflows importáveis (`[WBB] 00..10`)
- `mock/payloads/`: payloads fake para testes
- `docs/setup.md`: instalação + go-live
- `docs/variables.md`: tabela de variáveis
- `docs/tenants.md`: modelo multi-tenant

## Padrão de Naming

- Workflows: `[WBB] NN - Nome`
- Arquivos: `[WBB]_NN_slug.json`
- Nodes críticos:
  - `Load Tenant Config (Mock/Supabase)`
  - `Normalize Payload`
  - `Business Rules`
  - `Build Log Record`
  - `Log Sink (Supabase REST)`

## Payload Normalizado Único

Campos base em todos os fluxos:

```json
{
  "timestamp": "ISO8601",
  "tenant_id": "string",
  "lead_id": "string",
  "canal_origem": "whatsapp|ads|site",
  "evento": "lead_intake|qualificacao|...",
  "nome": "string",
  "telefone": "string",
  "mensagem": "string",
  "metadata": {}
}
```

## Lista de Workflows

0. `[WBB] 00 - Mock Generator`
1. `[WBB] 01 - Lead Intake (Webhook)`
2. `[WBB] 02 - Qualificação Rápida`
3. `[WBB] 03 - Roteamento e Handoff Humano`
4. `[WBB] 04 - Follow-up 24h/48h/7d`
5. `[WBB] 05 - Confirmação e Lembrete de Consulta`
6. `[WBB] 06 - Relatório Diário (WhatsApp/Telegram)`
7. `[WBB] 07 - Monitor de Integrações`
8. `[WBB] 08 - Onboarding do Cliente (Checklist)`
9. `[WBB] 09 - Auditoria de Conversas (Amostragem)`
10. `[WBB] 10 - NPS/Feedback pós atendimento`

## Multi-tenant

- Todo evento deve carregar `tenant_id`.
- O node `Load Tenant Config (Mock/Supabase)` injeta configuração do cliente.
- Produção: substituir mock por lookup em Supabase (`tenants_config`).
- Sem hardcode de número/URL: usar variáveis e config.

## Logs padrão

Formato aplicado em todos os fluxos:

- `timestamp`, `tenant_id`, `lead_id`, `evento`, `status`, `erro`, `metadata`

Destino padrão: Supabase REST (`wbb_logs`).
Fallback mock: endpoint placeholder + dados no histórico da execução n8n.

## Modo Mock (obrigatório)

1. Ajuste `BASE_WEBHOOK_URL`.
2. Rode `[WBB] 00 - Mock Generator`.
3. O gerador envia evento para 3 fluxos principais (01/02/03).
4. Use payloads em `mock/payloads/*.json` para retestes manuais.

## Integrações alvo

- WhatsApp (Evolution API via HTTP Request)
- Chatwoot (HTTP Request)
- Supabase (REST)
- Notificações (Slack/Telegram/WhatsApp webhook)

## Checklist Go Live

- [ ] Variáveis preenchidas
- [ ] Tabela `wbb_logs` criada
- [ ] Endpoints de notificação validados
- [ ] Tenant real cadastrado (`tenants_config`)
- [ ] Anti-spam ativo (`max_tentativas`)
- [ ] Janela de atendimento revisada
- [ ] Mock tests executados com sucesso

## Troubleshooting

- **Erro 401 Supabase**: conferir `SUPABASE_SERVICE_ROLE_KEY`.
- **Webhook não responde**: validar path e se workflow está ativo.
- **Sem notificações**: revisar `NOTIFICATION_WEBHOOK_URL` ou `tenant.destino_notificacao.endpoint`.
- **Tenant incorreto**: revisar resolução de `tenant_id` na entrada.

## Prints textuais (execuções esperadas)

- `[WBB] 00` => `resultado: "Mock events enviados para 3 fluxos"`
- `[WBB] 01` => resposta webhook: `{ "ok": true, "workflow": "[WBB] 01 - Lead Intake (Webhook)", "tenant_id": "demo_clinica" }`
- `[WBB] 02` => `status_lead` calculado: `quente|morno|frio`
- `[WBB] 07` => incidente criado em log quando endpoint monitorado falha
