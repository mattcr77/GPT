# Variáveis de Ambiente (n8n)

| Variável | Obrigatória | Exemplo | Uso |
|---|---|---|---|
| `BASE_WEBHOOK_URL` | Sim (mock) | `https://n8n.seudominio.com` | `[WBB] 00` envia eventos fake para webhooks reais |
| `SUPABASE_URL` | Sim (produção) | `https://xxxx.supabase.co` | Persistência de logs (`wbb_logs`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim (produção) | `sb_secret_...` | Header Bearer para insert de logs |
| `NOTIFICATION_WEBHOOK_URL` | Sim | `https://hooks.slack.com/...` | Canal de alertas/notificações do time |
| `MOCK_MODE` | Recomendado | `true` | Permite testar sem credenciais reais |
| `WHATSAPP_EVOLUTION_URL` | Opcional | `https://evo.api` | Endpoint base Evolution API |
| `WHATSAPP_EVOLUTION_TOKEN` | Opcional | `evo_...` | Token Evolution API |
| `CHATWOOT_BASE_URL` | Opcional | `https://chatwoot...` | API Chatwoot |
| `CHATWOOT_TOKEN` | Opcional | `cw_...` | Token Chatwoot |

## Observações
- Nenhum token deve ser salvo dentro dos JSON de workflow.
- Em `MOCK_MODE=true`, o pack pode funcionar usando apenas payloads fake + endpoints placeholder.
