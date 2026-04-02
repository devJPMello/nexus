-- Nexus — schema PostgreSQL (Neon, Supabase, Render Postgres, etc.)
-- Executar uma vez no SQL Editor do teu provedor (ex.: Neon → SQL Editor → Run).

-- UUID (Neon / PG 13+ costuma ter gen_random_uuid nativo; se falhar, descomenta a linha abaixo)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id VARCHAR(255) NOT NULL,
  agent_type VARCHAR(32),
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'completed',
  system_message TEXT,
  temperature DOUBLE PRECISION NOT NULL DEFAULT 0.8,
  max_tokens INTEGER NOT NULL DEFAULT 16000,
  error_message TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_thread_active
  ON chat_history (thread_id, is_active);

CREATE TABLE IF NOT EXISTS user_uploaded_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  filename TEXT NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL,
  text_content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_uploaded_user_created
  ON user_uploaded_contents (user_id, created_at);
