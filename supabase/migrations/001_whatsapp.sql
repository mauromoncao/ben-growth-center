-- ============================================================
-- SUPABASE SQL — Tabelas WhatsApp Dr. Ben
-- Execute em: https://supabase.com/dashboard/project/xjjxnzoapqswagqbvdto/sql/new
-- ============================================================

-- Tabela de configuração (QR Code, status)
CREATE TABLE IF NOT EXISTS whatsapp_config (
  chave        TEXT PRIMARY KEY,
  valor        TEXT,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de sessões das conversas
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  numero        TEXT PRIMARY KEY,
  sessao        JSONB DEFAULT '{}',
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de leads gerados pelo Dr. Ben
CREATE TABLE IF NOT EXISTS whatsapp_leads (
  id           BIGSERIAL PRIMARY KEY,
  numero       TEXT NOT NULL,
  nome         TEXT,
  ultima_mensagem TEXT,
  urgente      BOOLEAN DEFAULT FALSE,
  atendido     BOOLEAN DEFAULT FALSE,
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);

-- Index para buscar leads urgentes
CREATE INDEX IF NOT EXISTS idx_leads_urgente ON whatsapp_leads(urgente, atendido);
CREATE INDEX IF NOT EXISTS idx_leads_numero  ON whatsapp_leads(numero);

-- Valores iniciais
INSERT INTO whatsapp_config (chave, valor) 
VALUES ('status', 'disconnected'), ('qrcode', '')
ON CONFLICT (chave) DO NOTHING;

-- Confirmar
SELECT 'Tabelas criadas com sucesso!' as resultado;
