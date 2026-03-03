# REFATORACAO_PREVENDAS_FINAL

## Entregáveis
- `WAVE-WPP_FINAL.json` (workflow principal, zero Code node)
- `WAVE-WPP_ERROR_FINAL.json` (workflow de erro, zero Code node)
- `migration_supabase_FINAL.sql` (idempotente)

## Checklist técnico aplicado
- [x] Zero uso de nodes `Code`, `Function` ou JS custom node.
- [x] Todos os `Postgres` com placeholders `$1..$n` usam `Options > Query Parameters` em **ARRAY**.
- [x] `Monta contexto (SQL)` retorna 1 linha com fallback de `user_text`.
- [x] `input_hash` e `owner_hash` calculados em SQL com `digest(..., 'sha256')`.
- [x] Dedup atômico (`lead` e `owner`) com `INSERT ... ON CONFLICT ... WHERE created_at < NOW() - INTERVAL '2 minutes'`.
- [x] Validação de JSON via `public.safe_jsonb(text)` com fallback completo (sem parsing JS).
- [x] Recheck pré-envio da execução mais recente para evitar corrida.
- [x] Owner JID fixo no envio: `5513996663009@s.whatsapp.net`.
- [x] Workflow de erro separado com `Error Trigger` e envio com `continueOnFail: true`.

## Onde trocar credenciais
No n8n Cloudfy, após importar os workflows:
1. Workflow principal (`WAVE-WPP_FINAL.json`)
   - Nodes Postgres: credential `Postgres account`
   - Node OpenAI: credential `OpenAi account`
   - Nodes Evolution API: credential `evolution_cloudfy`
2. Workflow de erro (`WAVE-WPP_ERROR_FINAL.json`)
   - Node Evolution API: credential `evolution_cloudfy`

## Onde trocar OWNER JID
- Workflow principal:
  - Node `Normaliza entrada` campo `owner_remote_jid`
  - Node `Envia alerta ao Brasileiro` campo `remoteJid`
- Workflow de erro:
  - Node `Monta erro mascarado` campo `owner_remote_jid`

## Testes recomendados (manual no n8n)
1. **Mensagem válida WhatsApp (lead)**
   - Enviar texto simples para webhook.
   - Esperado: passa no filtro, upsert inbound/state, espera 30s, responde lead.
2. **Debounce**
   - Enviar 2+ mensagens na janela de 30s.
   - Esperado: somente execução mais recente envia resposta.
3. **Dedup lead**
   - Repetir a mesma entrada em até 2 minutos.
   - Esperado: `allowed=false` e não duplica envio ao lead.
4. **Dedup owner**
   - Repetir mesmo `owner_summary` em até 2 minutos.
   - Esperado: não duplica alerta ao owner.
5. **JSON inválido do LLM**
   - Forçar saída ruim no agente.
   - Esperado: `Valida JSON + fallback (SQL)` ativa fallback, notifica owner.
6. **Erro de workflow**
   - Forçar falha (ex.: credencial inválida temporária).
   - Esperado: workflow de erro envia alerta para owner com workflow/node/msg/execution_id.

## Consulta rápida de validação local
```bash
rg -n "n8n-nodes-base.code|n8n-nodes-base.function|n8n-nodes-base.code" WAVE-WPP_FINAL.json WAVE-WPP_ERROR_FINAL.json
rg -n "\\$[0-9]+" WAVE-WPP_FINAL.json
rg -n "queryParameters" WAVE-WPP_FINAL.json
rg -n "5513996663009@s.whatsapp.net" WAVE-WPP_FINAL.json WAVE-WPP_ERROR_FINAL.json
```
