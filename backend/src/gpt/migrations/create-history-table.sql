-- Criar tabela history para Supabase
-- Execute este SQL no SQL Editor do Supabase

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela history
CREATE TABLE IF NOT EXISTS history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  "agentType" VARCHAR(50),
  status VARCHAR(50) DEFAULT 'completed',
  "systemMessage" TEXT,
  temperature DECIMAL(3,2) DEFAULT 0.8,
  "maxTokens" INTEGER DEFAULT 16000,
  "errorMessage" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_history_thread_id ON history(thread_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON history("createdAt");
CREATE INDEX IF NOT EXISTS idx_history_agent_type ON history("agentType");
CREATE INDEX IF NOT EXISTS idx_history_is_active ON history("isActive");

-- Trigger para atualizar updatedAt automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_history_updated_at
  BEFORE UPDATE ON history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security) - Opcional
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (ajuste conforme necessário)
CREATE POLICY "Enable all operations for authenticated users" ON history
  FOR ALL USING (true);