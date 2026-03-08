#!/bin/bash
# ============================================================
# BEN ECOSYSTEM IA — Instalação VPS Hostinger
# Ubuntu 22.04 | IP: 181.215.135.202
#
# O QUE ESTE SCRIPT FAZ:
#   1. Instala PostgreSQL 16
#   2. Instala extensão pgvector
#   3. Cria banco de dados 'ben_workspace'
#   4. Aplica schema completo (projects, conversations, etc.)
#   5. Instala Node.js 20 + PM2
#   6. Instala e inicia o servidor BEN Workspace (porta 3002)
#   7. Configura Nginx como proxy reverso
#   8. Mantém servidor de leads SQLite intacto (porta 3001)
#
# USO:
#   chmod +x install-workspace.sh
#   sudo ./install-workspace.sh
# ============================================================

set -e  # Para na primeira falha

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${CYAN}[BEN]${NC} $1"; }
ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[ERRO]${NC} $1"; exit 1; }

log "=================================================="
log " BEN Ecosystem IA — Setup VPS Hostinger"
log " Workspace Backend + PostgreSQL + pgvector"
log "=================================================="

# ── Variáveis de configuração ─────────────────────────────
DB_NAME="ben_workspace"
DB_USER="ben_admin"
DB_PASS="Ben@Workspace2026!Secure"
WORKSPACE_PORT=3002
WORKSPACE_DIR="/opt/ben-workspace"

# ── 1. Atualizar sistema ──────────────────────────────────
log "Atualizando sistema..."
apt-get update -qq
apt-get upgrade -y -qq
ok "Sistema atualizado"

# ── 2. Instalar PostgreSQL 16 ─────────────────────────────
log "Instalando PostgreSQL 16..."
if ! command -v psql &>/dev/null; then
  apt-get install -y -qq curl ca-certificates
  install -d /usr/share/postgresql-common/pgdg
  curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc --fail \
    https://www.postgresql.org/media/keys/ACCC4CF8.asc
  sh -c 'echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] \
    https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
    > /etc/apt/sources.list.d/pgdg.list'
  apt-get update -qq
  apt-get install -y -qq postgresql-16
fi
systemctl start postgresql
systemctl enable postgresql
ok "PostgreSQL 16 instalado"

# ── 3. Instalar pgvector ──────────────────────────────────
log "Instalando pgvector..."
if ! dpkg -l | grep -q postgresql-16-pgvector; then
  apt-get install -y -qq postgresql-16-pgvector
fi
ok "pgvector instalado"

# ── 4. Criar banco e usuário ──────────────────────────────
log "Criando banco de dados '$DB_NAME'..."
sudo -u postgres psql -c "
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
      CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASS';
    END IF;
  END
  \$\$;
" 2>/dev/null

sudo -u postgres psql -c "
  SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')
" --no-align -t | bash -e 2>/dev/null || true

sudo -u postgres psql -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS vector;" 2>/dev/null
sudo -u postgres psql -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;" 2>/dev/null
sudo -u postgres psql -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS unaccent;" 2>/dev/null

ok "Banco '$DB_NAME' criado com pgvector"

# ── 5. Aplicar schema ─────────────────────────────────────
log "Aplicando schema do BEN Workspace..."
sudo -u postgres psql -d "$DB_NAME" << 'SCHEMA'

-- ========================================================
-- BEN ECOSYSTEM IA — Schema PostgreSQL v1.0
-- ========================================================

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── USUÁRIOS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT UNIQUE NOT NULL,
  nome        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'advogado'
                CHECK (role IN ('admin','advogado','estagiario','cliente')),
  oab         TEXT,
  avatar_url  TEXT,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PROJETOS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  descricao   TEXT,
  area        TEXT NOT NULL DEFAULT 'tributario'
                CHECK (area IN (
                  'tributario','trabalhista','previdenciario',
                  'civil','criminal','constitucional',
                  'administrativo','empresarial','outros'
                )),
  status      TEXT NOT NULL DEFAULT 'ativo'
                CHECK (status IN ('ativo','pausado','concluido','arquivado')),
  prioridade  TEXT NOT NULL DEFAULT 'media'
                CHECK (prioridade IN ('baixa','media','alta','urgente')),
  cliente     TEXT,
  numero_processo TEXT,
  valor_causa DECIMAL(15,2),
  prazo       TIMESTAMPTZ,
  tags        TEXT[] DEFAULT '{}',
  metadata    JSONB DEFAULT '{}',
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CONVERSAS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id    TEXT NOT NULL,
  titulo      TEXT,
  status      TEXT NOT NULL DEFAULT 'ativa'
                CHECK (status IN ('ativa','arquivada','exportada')),
  total_tokens     INTEGER DEFAULT 0,
  total_cost_usd   DECIMAL(10,8) DEFAULT 0,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── MENSAGENS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content         TEXT NOT NULL,
  agent_id        TEXT,
  model_used      TEXT,
  input_tokens    INTEGER DEFAULT 0,
  output_tokens   INTEGER DEFAULT 0,
  cost_usd        DECIMAL(10,8) DEFAULT 0,
  elapsed_ms      INTEGER DEFAULT 0,
  metadata        JSONB DEFAULT '{}',
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── DOCUMENTOS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  titulo      TEXT NOT NULL,
  tipo        TEXT NOT NULL DEFAULT 'peça_processual'
                CHECK (tipo IN (
                  'peça_processual','contrato','parecer','laudo',
                  'relatorio','procuracao','tese','pesquisa','outros'
                )),
  conteudo    TEXT NOT NULL,
  conteudo_html TEXT,
  agent_id    TEXT,
  status      TEXT NOT NULL DEFAULT 'rascunho'
                CHECK (status IN ('rascunho','revisado','aprovado','assinado')),
  versao      INTEGER NOT NULL DEFAULT 1,
  tags        TEXT[] DEFAULT '{}',
  metadata    JSONB DEFAULT '{}',
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TAREFAS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  descricao   TEXT,
  tipo        TEXT NOT NULL DEFAULT 'manual'
                CHECK (tipo IN ('manual','automatica','agente','prazo')),
  status      TEXT NOT NULL DEFAULT 'pendente'
                CHECK (status IN ('pendente','em_andamento','concluida','cancelada')),
  prioridade  TEXT NOT NULL DEFAULT 'media'
                CHECK (prioridade IN ('baixa','media','alta','urgente')),
  agente_id   TEXT,
  prazo       TIMESTAMPTZ,
  concluida_em TIMESTAMPTZ,
  resultado   TEXT,
  metadata    JSONB DEFAULT '{}',
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── MEMÓRIA VETORIAL ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS memory_vectors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL DEFAULT 'documento'
                CHECK (tipo IN ('documento','conversa','jurisprudencia','norma','fato')),
  conteudo    TEXT NOT NULL,
  embedding   vector(1536),
  metadata    JSONB DEFAULT '{}',
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── MONITOR DE TOKENS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS token_usage (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id    TEXT NOT NULL,
  model_used  TEXT NOT NULL,
  input_tokens  INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_usd    DECIMAL(10,8) DEFAULT 0,
  elapsed_ms  INTEGER DEFAULT 0,
  source      TEXT DEFAULT 'juris-center',
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PIPELINE DE ORQUESTRAÇÃO ─────────────────────────────
CREATE TABLE IF NOT EXISTS pipelines (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  descricao   TEXT,
  agentes     TEXT[] NOT NULL DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'pendente'
                CHECK (status IN ('pendente','rodando','concluido','erro')),
  input       TEXT,
  output_final TEXT,
  steps       JSONB DEFAULT '[]',
  total_cost_usd DECIMAL(10,6) DEFAULT 0,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  concluido_em TIMESTAMPTZ
);

-- ── ÍNDICES ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_projects_user    ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status  ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_area    ON projects(area);
CREATE INDEX IF NOT EXISTS idx_conv_project     ON conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_conv_user        ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_agent       ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv    ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_role    ON messages(role);
CREATE INDEX IF NOT EXISTS idx_docs_project     ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_docs_tipo        ON documents(tipo);
CREATE INDEX IF NOT EXISTS idx_tasks_project    ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status     ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_prazo      ON tasks(prazo);
CREATE INDEX IF NOT EXISTS idx_token_agent      ON token_usage(agent_id);
CREATE INDEX IF NOT EXISTS idx_token_timestamp  ON token_usage(timestamp);
CREATE INDEX IF NOT EXISTS idx_token_source     ON token_usage(source);
CREATE INDEX IF NOT EXISTS idx_memory_project   ON memory_vectors(project_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_project ON pipelines(project_id);

-- Índice vetorial para busca semântica
CREATE INDEX IF NOT EXISTS idx_memory_embedding
  ON memory_vectors USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ── USUÁRIO PADRÃO (Dr. Mauro) ────────────────────────────
INSERT INTO users (id, email, nome, role, oab)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'mauro@mauromoncao.adv.br',
  'Dr. Mauro Monção',
  'admin',
  'OAB/PI'
) ON CONFLICT (email) DO NOTHING;

SCHEMA

ok "Schema aplicado com sucesso"

# ── 6. Instalar Node.js 20 ────────────────────────────────
log "Verificando Node.js..."
if ! command -v node &>/dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 18 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
ok "Node.js $(node -v) disponível"

# ── 7. Instalar PM2 ───────────────────────────────────────
log "Verificando PM2..."
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2 -q
fi
ok "PM2 $(pm2 -v) disponível"

# ── 8. Criar diretório do workspace ──────────────────────
log "Configurando diretório $WORKSPACE_DIR..."
mkdir -p "$WORKSPACE_DIR"

# ── 9. Gerar package.json ─────────────────────────────────
cat > "$WORKSPACE_DIR/package.json" << PKGJSON
{
  "name": "ben-workspace-api",
  "version": "1.0.0",
  "description": "BEN Ecosystem IA — Workspace Backend API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "pg": "^8.11.3",
    "pgvector": "^0.1.8",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "multer": "^1.4.5-lts.1",
    "openai": "^4.28.0",
    "uuid": "^9.0.0"
  }
}
PKGJSON

# ── 10. Gerar .env ────────────────────────────────────────
if [ ! -f "$WORKSPACE_DIR/.env" ]; then
  cat > "$WORKSPACE_DIR/.env" << ENVFILE
# BEN Workspace Backend
NODE_ENV=production
PORT=$WORKSPACE_PORT

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASS

# JWT
JWT_SECRET=ben_jwt_mauro_moncao_2026_enterprise_secret_key_advogados

# OpenAI (para embeddings vetoriais)
OPENAI_API_KEY=

# Monitor admin token
MONITOR_ADMIN_TOKEN=ben_monitor_mauro_2026_secure

# CORS — origens permitidas
ALLOWED_ORIGINS=https://ben-ecosystem-ia.vercel.app,https://ben-juris-center.vercel.app,https://ben-growth-center.vercel.app,http://localhost:5173,http://localhost:3000
ENVFILE
  warn ".env criado em $WORKSPACE_DIR/.env — ADICIONE suas API keys!"
fi

# ── 11. Instalar dependências ─────────────────────────────
log "Instalando dependências Node.js..."
cd "$WORKSPACE_DIR"
npm install --quiet 2>/dev/null
ok "Dependências instaladas"

# ── 12. Copiar server.js (será feito pelo deploy) ────────
log "Verificando server.js..."
if [ ! -f "$WORKSPACE_DIR/server.js" ]; then
  warn "server.js não encontrado — faça deploy via GitHub ou scp"
  warn "Execute: scp vps-workspace-server/server.js root@181.215.135.202:/opt/ben-workspace/"
fi

# ── 13. Configurar PM2 ────────────────────────────────────
log "Configurando PM2..."
if [ -f "$WORKSPACE_DIR/server.js" ]; then
  pm2 stop ben-workspace 2>/dev/null || true
  pm2 start "$WORKSPACE_DIR/server.js" \
    --name "ben-workspace" \
    --restart-delay 3000 \
    --max-memory-restart 512M \
    --env production
  pm2 save
  pm2 startup 2>/dev/null || true
  ok "PM2 iniciado: ben-workspace na porta $WORKSPACE_PORT"
fi

# ── 14. Configurar Nginx ──────────────────────────────────
log "Configurando Nginx..."
if command -v nginx &>/dev/null; then
  cat > /etc/nginx/sites-available/ben-workspace << NGINX
server {
    listen 80;
    server_name 181.215.135.202;

    # BEN Workspace API (porta 3002)
    location /workspace/ {
        proxy_pass http://localhost:$WORKSPACE_PORT/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 120s;
    }

    # BEN Leads API (porta 3001 — mantida intacta)
    location /leads/ {
        proxy_pass http://localhost:3001/leads/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
    }
}
NGINX

  ln -sf /etc/nginx/sites-available/ben-workspace /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx
  ok "Nginx configurado"
else
  warn "Nginx não instalado — instale com: apt-get install nginx"
fi

# ── Resumo final ──────────────────────────────────────────
echo ""
echo -e "${GREEN}=================================================="
echo -e " ✅ BEN Workspace — Instalação Concluída!"
echo -e "=================================================="
echo -e " PostgreSQL 16:  ativo (porta 5432)"
echo -e " pgvector:       extensão habilitada"
echo -e " Banco:          $DB_NAME"
echo -e " Usuário DB:     $DB_USER"
echo -e " Workspace API:  porta $WORKSPACE_PORT"
echo -e " Leads API:      porta 3001 (intacta)"
echo -e ""
echo -e " PRÓXIMOS PASSOS:"
echo -e " 1. Edite $WORKSPACE_DIR/.env (adicione OPENAI_API_KEY)"
echo -e " 2. Faça deploy do server.js:"
echo -e "    scp server.js root@181.215.135.202:/opt/ben-workspace/"
echo -e " 3. pm2 restart ben-workspace"
echo -e " 4. Teste: curl http://181.215.135.202:$WORKSPACE_PORT/health"
echo -e "${NC}"
