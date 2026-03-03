# REFATORAÇÃO V2 — Workflow n8n pré-vendas WhatsApp

## O que mudou (V2)
1. **OWNER_REMOTE_JID fixo**
   - Definido em `Normaliza entrada`: `5513996663009@s.whatsapp.net`.

2. **Anti-spam: sempre 1 mensagem ao lead**
   - O array `lead_messages` é consolidado em **uma string única** com separador `\n\n`.
   - Envio ao lead feito por **um único node** (`Envia 1 mensagem ao lead`), sem SplitInBatches.

3. **Memória adicionada (fallback por tabela própria)**
   - Implementado histórico em `conversation_history` (últimas 30 interações).
   - Fluxo busca últimas 30 mensagens, injeta no contexto do LLM e salva novamente user+assistant.
   - Motivo: compatibilidade garantida mesmo em ambientes sem node Postgres Chat Memory.

4. **Segurança/observabilidade de erro**
   - Adicionado fluxo de erro com `Error Trigger` no mesmo JSON para alertar o Brasileiro com mensagem mascarada.
   - Fallback no parse do LLM:
     - Se JSON inválido, lead recebe: "Pode repetir em 1 linha?"
     - Brasileiro recebe alerta com erro e conversa mascarada.

5. **Dedup com TTL de 2 minutos**
   - Lead e owner passam por check TTL (`response_dedup` nos últimos 2 minutos).
   - Fora da janela, repetição legítima é permitida.

6. **SQL parametrizado (prepared statements)**
   - Queries do Postgres alteradas para `$1, $2...` + `queryReplacement`, evitando quebra por aspas e reduzindo risco de injection.

## Arquivos entregues
- `Teste_refatorado_v2.json`
- `migration_supabase_v2.sql`
- `REFATORACAO_PREVENDAS_v2.md`

## Como testar rapidamente
1. **Rajada de 3 mensagens em 30s**: validar que só sai 1 resposta consolidada.
2. **Mensagens longas do LLM (array)**: validar envio único ao lead.
3. **Pergunta de preço**: política de preço e CTA para reunião.
4. **Pedido de humano**: `notify_owner=true` e alerta ao Brasileiro.
5. **Replay em <2min**: dedup bloqueia resposta duplicada.
6. **Mesmo replay >2min**: permite nova resposta.
7. **Forçar JSON inválido no LLM**: lead recebe fallback + owner alertado.
8. **Erro de API Evolution/OpenAI**: Error Trigger envia alerta ao Brasileiro.
