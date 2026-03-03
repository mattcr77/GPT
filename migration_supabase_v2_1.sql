-- V2.1 produção: dedup atômico com TTL e memória robusta

CREATE TABLE IF NOT EXISTS public.conversation_state (
  conversation_id TEXT PRIMARY KEY,
  latest_execution_id TEXT NOT NULL,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_state_last_message_at
  ON public.conversation_state (last_message_at DESC);

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

CREATE TABLE IF NOT EXISTS public.response_dedup (
  id BIGSERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  dedup_key TEXT NOT NULL,
  response_type TEXT NOT NULL CHECK (response_type IN ('lead','owner')),
  payload_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Higieniza duplicatas antigas antes de adicionar UNIQUE
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY conversation_id, dedup_key, response_type
           ORDER BY created_at DESC, id DESC
         ) AS rn
  FROM public.response_dedup
)
DELETE FROM public.response_dedup d
USING ranked r
WHERE d.id = r.id
  AND r.rn > 1;

-- UNIQUE necessário para UPSERT atômico por TTL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'response_dedup_unique'
      AND conrelid = 'public.response_dedup'::regclass
  ) THEN
    ALTER TABLE public.response_dedup
      ADD CONSTRAINT response_dedup_unique
      UNIQUE (conversation_id, dedup_key, response_type);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_response_dedup_ttl_lookup
  ON public.response_dedup (conversation_id, dedup_key, response_type, created_at DESC);

CREATE TABLE IF NOT EXISTS public.conversation_history (
  id BIGSERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_history_lookup
  ON public.conversation_history (conversation_id, created_at DESC);
