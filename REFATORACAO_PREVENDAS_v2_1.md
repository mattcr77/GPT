# REFATORAÇÃO V2.1 (produção) — n8n pré-vendas WhatsApp

## Objetivo da V2.1
Corrigir pontos de produção: fluxo morrendo por 0-items, dedup TTL não atômico, memória instável e hardening de confiabilidade.

## Mudanças principais

### 1) Dedup TTL ATÔMICO (lead e owner) com retorno garantido de 1 linha
- Substituído padrão `check -> IF -> insert` por **reserva atômica** com `INSERT ... ON CONFLICT ... DO UPDATE ... WHERE created_at < NOW()-2min`.
- A query sempre retorna `allowed: true/false` (via `SELECT COALESCE(...)`) e evita branch quebrar por 0 items.
- Se `allowed=false`, o fluxo encerra silenciosamente (anti-replay/retry).

### 2) Memória robusta sem 0-items
- `Carrega memória (30)` agora retorna sempre 1 linha com `historyText` (string vazia quando não há histórico).
- `Monta contexto + hash` usa `historyText` diretamente, sem depender de `$input.all()`.

### 3) Webhook em modo produção (resposta imediata)
- Node `Recebe mensagem` com **Respond = Immediately** (`responseMode: onReceived`) para não segurar HTTP por conta do wait de 30s.

### 4) Error Trigger sem risco de loop
- Node `Envia erro ao Brasileiro` no ramo de erro está com `Continue On Fail = true`.
- Mensagem curta e com `conversation_id` mascarado.

### 5) SQL preparado e segurança
- Queries críticas usam placeholders (`$1, $2, ...`) + `queryReplacement`.
- `OWNER_REMOTE_JID` fixo: `5513996663009@s.whatsapp.net`.

## Migração SQL V2.1
- Reforça `UNIQUE (conversation_id, dedup_key, response_type)` em `response_dedup` (com deduplicação prévia segura).
- Mantém índices úteis para lookup de TTL.

## Como testar (Smoke test — 8 cenários)
1. **Rajada 3 mensagens (<30s)**: só 1 resposta ao lead após debounce.
2. **Replay idêntico em <2min**: `allowed=false` no dedup lead e nenhum envio.
3. **Replay idêntico >2min**: dedup rearma TTL e permite envio.
4. **Lead_messages múltiplas**: saída enviada em **uma única mensagem** (`\n\n`).
5. **JSON inválido do LLM**: lead recebe fallback de 1 linha + owner recebe alerta.
6. **Pedido de humano**: `notify_owner=true` e owner recebe resumo (dedup owner aplicado).
7. **Sem histórico prévio**: memória retorna `historyText=''` e fluxo segue normalmente (sem 0-items).
8. **Erro real em execução automática** (ex.: credencial inválida em ambiente de teste): `Error Trigger` envia alerta mascarado ao owner.

## Observação importante sobre Error Trigger
- O `Error Trigger` **não dispara em execução manual padrão**.
- Valide em execução automática/produção (webhook real), forçando erro controlado em staging.

## Arquivos entregues
- `Teste_refatorado_v2_1.json`
- `migration_supabase_v2_1.sql`
- `REFATORACAO_PREVENDAS_v2_1.md`
