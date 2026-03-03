#!/bin/bash
# ============================================================
# INSTALAÇÃO Dr. Ben Leads API na VPS Hostinger
# Execute com: bash install.sh
# ============================================================

set -e

echo "🚀 Instalando Dr. Ben Leads API..."
echo ""

# ── 1. Verificar Node.js ─────────────────────────────────
if ! command -v node &> /dev/null; then
  echo "📦 Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js: $NODE_VERSION"

# ── 2. Instalar PM2 ──────────────────────────────────────
if ! command -v pm2 &> /dev/null; then
  echo "📦 Instalando PM2..."
  sudo npm install -g pm2
fi
echo "✅ PM2: $(pm2 -v)"

# ── 3. Criar diretório ───────────────────────────────────
INSTALL_DIR="/opt/dr-ben-leads"
sudo mkdir -p "$INSTALL_DIR"
sudo chown $USER:$USER "$INSTALL_DIR"

echo "📁 Diretório: $INSTALL_DIR"

# ── 4. Copiar arquivos ───────────────────────────────────
cp server.js   "$INSTALL_DIR/"
cp package.json "$INSTALL_DIR/"

# ── 5. Instalar dependências ─────────────────────────────
cd "$INSTALL_DIR"
echo "📦 Instalando dependências (express, better-sqlite3, cors)..."
npm install --production

echo "✅ Dependências instaladas"

# ── 6. Iniciar com PM2 ───────────────────────────────────
pm2 delete dr-ben-leads 2>/dev/null || true
pm2 start server.js --name dr-ben-leads --restart-delay 3000
pm2 save
pm2 startup 2>/dev/null | tail -1 | bash 2>/dev/null || true

echo ""
echo "✅ Dr. Ben Leads API instalada com sucesso!"
echo ""
echo "📊 Status:"
pm2 status dr-ben-leads

echo ""
echo "🔗 Endpoints:"
echo "   Health:   http://181.215.135.202:3001/health"
echo "   Leads:    http://181.215.135.202:3001/leads"
echo ""
echo "📋 Comandos úteis:"
echo "   pm2 status          — ver status"
echo "   pm2 logs dr-ben-leads — ver logs"
echo "   pm2 restart dr-ben-leads — reiniciar"
echo ""

# ── 7. Testar ────────────────────────────────────────────
sleep 2
echo "🧪 Testando..."
curl -s http://localhost:3001/health | python3 -m json.tool 2>/dev/null || echo "Servidor iniciando..."
