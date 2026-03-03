-- migration_supabase_FINAL.sql
-- Objetivo: suporte a debounce, buffer, dedup TTL atômico, memória e parsing seguro de JSON

-- 1) Extensões
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Estado por conversa (última execução vence + cutoff)
CREATE TABLE IF NOT EXISTS public.conversation_state (
  conversation_id TEXT PRIMARY KEY,
  latest_execution_id TEXT NOT NULL,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_state_last_message_at
  ON public.conversation_state (last_message_at DESC);

-- 3) Buffer inbound (janela de debounce)
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

-- 4) Dedup (lead/owner) para idempotência + TTL atômico
CREATE TABLE IF NOT EXISTS public.response_dedup (
  id BIGSERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  dedup_key TEXT NOT NULL,
  response_type TEXT NOT NULL CHECK (response_type IN ('lead','owner')),
  payload_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Higieniza duplicatas antigas antes de adicionar UNIQUE (idempotente)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema='public'
      AND table_name='response_dedup'
  ) THEN
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
  END IF;
END $$;

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

-- 5) Memória conversacional
CREATE TABLE IF NOT EXISTS public.conversation_history (
  id BIGSERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_history_lookup
  ON public.conversation_history (conversation_id, created_at DESC);

-- 6) Parse seguro de JSON (para validação sem Code node)
CREATE OR REPLACE FUNCTION public.safe_jsonb(txt text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
  IF txt IS NULL OR btrim(txt) = '' THEN
    RETURN NULL;
  END IF;

  BEGIN
    RETURN txt::jsonb;
  EXCEPTION WHEN others THEN
    RETURN NULL;
  END;
END;
$$;
