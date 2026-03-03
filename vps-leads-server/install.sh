#!/bin/bash
# ============================================================
# INSTALAÇÃO Dr. Ben Leads API na VPS Hostinger
# Sem diálogos interativos (DEBIAN_FRONTEND=noninteractive)
# ============================================================

export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a

set -e

echo "Instalando Dr. Ben Leads API..."
echo ""

# ── 1. Verificar Node.js ─────────────────────────────────
if ! command -v node &> /dev/null; then
  echo "Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | DEBIAN_FRONTEND=noninteractive bash - 2>/dev/null
  DEBIAN_FRONTEND=noninteractive apt-get install -y -q nodejs 2>/dev/null
fi

NODE_VERSION=$(node -v)
echo "OK Node.js: $NODE_VERSION"

# ── 2. Instalar PM2 ──────────────────────────────────────
if ! command -v pm2 &> /dev/null; then
  echo "Instalando PM2..."
  npm install -g pm2 --quiet 2>/dev/null
fi
echo "OK PM2: $(pm2 -v)"

# ── 3. Criar diretório ───────────────────────────────────
INSTALL_DIR="/opt/dr-ben-leads"
mkdir -p "$INSTALL_DIR"
echo "Diretorio: $INSTALL_DIR"

# ── 4. Copiar arquivos ───────────────────────────────────
cp server.js    "$INSTALL_DIR/"
cp package.json "$INSTALL_DIR/"

# ── 5. Instalar dependências ─────────────────────────────
cd "$INSTALL_DIR"
echo "Instalando dependencias..."
npm install --production --quiet 2>/dev/null
echo "OK dependencias instaladas"

# ── 6. Iniciar com PM2 ───────────────────────────────────
pm2 delete dr-ben-leads 2>/dev/null || true
pm2 start server.js --name dr-ben-leads --restart-delay 3000
pm2 save --force 2>/dev/null || true

# Startup automático
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash 2>/dev/null || true

echo ""
echo "======================================"
echo "OK Dr. Ben Leads API instalada!"
echo "======================================"
echo ""
pm2 status dr-ben-leads

echo ""
echo "Endpoints:"
echo "  Health: http://181.215.135.202:3001/health"
echo "  Leads:  http://181.215.135.202:3001/leads"
echo ""

# ── 7. Testar ────────────────────────────────────────────
sleep 2
echo "Testando..."
curl -s http://localhost:3001/health 2>/dev/null || echo "Servidor iniciando, aguarde..."
