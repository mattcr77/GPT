-- Tabela de estado por conversa para debounce e controle de execução mais recente
CREATE TABLE IF NOT EXISTS public.conversation_state (
  conversation_id TEXT PRIMARY KEY,
  latest_execution_id TEXT NOT NULL,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_state_last_message_at
  ON public.conversation_state (last_message_at DESC);

-- Buffer de mensagens recebidas dentro da janela de debounce
CREATE TABLE IF NOT EXISTS public.inbound_messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  execution_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  message_text TEXT NOT NULL,
  push_name TEXT,
  remote_jid TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (conversation_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_inbound_messages_conversation_created
  ON public.inbound_messages (conversation_id, created_at ASC);

-- Deduplicação de respostas (lead e owner)
CREATE TABLE IF NOT EXISTS public.response_dedup (
  id BIGSERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  dedup_key TEXT NOT NULL,
  response_type TEXT NOT NULL CHECK (response_type IN ('lead','owner')),
  payload_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (conversation_id, dedup_key, response_type)
);

CREATE INDEX IF NOT EXISTS idx_response_dedup_created_at
  ON public.response_dedup (created_at DESC);
