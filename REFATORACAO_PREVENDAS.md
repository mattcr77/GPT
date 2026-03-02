# Refatoração do workflow n8n (WhatsApp + Evolution + Supabase + OpenAI)

## A) Diagnóstico — 10 maiores problemas do fluxo atual
1. **Debounce frágil e incorreto**: usa `Wait 7s` sem garantia de “última execução vence”, então pode responder múltiplas vezes em rajada.
2. **Sem controle de concorrência por conversa**: várias execuções simultâneas não se invalidam entre si.
3. **Parsing de saída do LLM frágil**: separação por barra invertida (`split(/\\/)`) quebra facilmente e não garante estrutura.
4. **Split/loop inconsistente**: `SplitInBatches` está ligado de forma propensa a repetição e ordem imprevisível.
5. **Sem idempotência de resposta**: retries/timeouts/replays podem reenviar a mesma mensagem.
6. **Sem deduplicação da notificação interna**: resumo ao dono pode duplicar.
7. **Sem isolamento seguro de `owner_summary`**: risco de vazamento por reutilização de campos de saída.
8. **Observabilidade baixa**: faltam logs estruturados por etapa e mascaramento de telefone.
9. **Tratamento de erro incompleto**: falhas em OpenAI/Evolution não geram handoff/alerta confiável ao Brasileiro.
10. **Modelagem de dados inadequada para buffer**: tabela `messages` mistura conceito de inbox/chatwoot e usa `id = execution_id`, sem semântica robusta para agregação temporal.

## B) Plano de refatoração
1. **Entrada e filtro estrito**
   - Aceitar apenas `messages.upsert`, `messageType=conversation`, sem grupos (`@g.us`).
2. **Persistência inicial atômica**
   - `inbound_messages`: grava cada mensagem recebida com `message_id` único.
   - `conversation_state`: upsert de `latest_execution_id` para controle de corrida.
3. **Debounce real 30s + validação de token**
   - Após `Wait 30s`, consultar `conversation_state` e responder **somente** se `latest_execution_id == execution_id`.
4. **Consolidação e hash de idempotência**
   - `string_agg` por `conversation_id`; hash SHA-256 do input consolidado.
   - Reserva de dedup via `INSERT ... ON CONFLICT DO NOTHING RETURNING id`.
5. **LLM com JSON estrito**
   - Prompt exige **apenas JSON válido** no schema acordado.
   - Validação programática do JSON antes de enviar.
6. **Envio fracionado robusto**
   - Quebra `lead_messages` em itens, `SplitInBatches`, envio com `Delay 1s`.
7. **Notificação do Brasileiro separada**
   - Branch próprio para `notify_owner=true`.
   - Dedup específico do owner (`response_type='owner'`).
8. **Limpeza de buffer e observabilidade**
   - Limpa `inbound_messages` ao concluir resposta vencedora.
   - Logs mascarados e pontos claros para auditoria.

### TODOs para você preencher
- `OWNER_REMOTE_JID` no nó **Normaliza entrada**.
- Se quiser fallback de erro 100% automático, adicione um workflow separado com **Error Trigger** para notificar o Brasileiro com contexto mínimo.

## C) JSON FINAL do workflow
Arquivo pronto para importação: **`Teste_refatorado.json`**.

## D) SQL de migração
Arquivo: **`migration_supabase.sql`**.

## E) Checklist de testes (8 cenários)
1. Rajada de 3 mensagens em < 30s da mesma conversa → só 1 resposta final.
2. Mensagem única simples → responde normalmente.
3. Pergunta de preço (“quanto custa?”) → menciona “a partir de R$ 799/mês” e puxa reunião.
4. Pedido explícito de humano (“quero falar com o Brasileiro”) → `notify_owner=true` e owner recebe resumo.
5. Retry/replay da mesma entrada (mesmo consolidado) → dedup bloqueia novo envio ao lead.
6. Resumo interno idêntico repetido → dedup owner bloqueia duplicata.
7. Mensagem de grupo (`@g.us`) → workflow ignora sem resposta.
8. Falha temporária Evolution/OpenAI → retries com backoff (3 tentativas) e validação de erro em execução.

## F) Guia de rollout seguro
1. **Staging**
   - Importar workflow novo desativado.
   - Executar `migration_supabase.sql`.
   - Configurar credenciais já existentes (Postgres, OpenAI, Evolution).
2. **Smoke test**
   - Testar 8 cenários acima com 2 números: lead e dono.
   - Validar ausência de duplicidade em `response_dedup`.
3. **Canary**
   - Ativar para 10-20% das conversas (ou janela curta de horário).
4. **Go-live**
   - Ativar 100% e monitorar latência média, erro por nó, taxa de dedup hit.
5. **Rollback**
   - Desativar workflow novo e reativar workflow anterior imediatamente.
   - Manter tabelas novas (não destrutivas) para investigação pós-incidente.
