#!/bin/bash
# ============================================================
# Script de atualização do servidor Dr. Ben Leads API na VPS
# Uso: bash update.sh
# Executa em: VPS Hostinger (181.215.135.202)
# ============================================================
set -e

echo "🔄 Atualizando Dr. Ben Leads API (porta 3001)..."
echo "   Inclui: /monitor/log, /monitor/stats, /db/query, /db/stats"
echo ""

# Baixar versão mais recente do GitHub (branch main)
curl -fsSL "https://raw.githubusercontent.com/mauromoncao/ben-growth-center/main/vps-leads-server/server.js" \
  -o /opt/dr-ben-leads/server.js

echo "✅ server.js atualizado"

# Reiniciar com PM2
pm2 restart dr-ben-leads 2>/dev/null || pm2 start /opt/dr-ben-leads/server.js --name dr-ben-leads

echo "✅ Servidor reiniciado"
sleep 3
pm2 status dr-ben-leads

# Testes de saúde completos
echo ""
echo "══════════════════════════════════"
echo "🏥 Health check (porta 3001):"
echo "══════════════════════════════════"
curl -s http://localhost:3001/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3001/health

echo ""
echo "📊 Monitor stats:"
curl -s http://localhost:3001/monitor/stats | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3001/monitor/stats

echo ""
echo "💾 DB stats:"
curl -s http://localhost:3001/db/stats | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3001/db/stats

echo ""
echo "══════════════════════════════════"
echo "✅ Atualização completa!"
echo "   Endpoints ativos:"
echo "   • GET  /health"
echo "   • GET  /leads"
echo "   • POST /leads"
echo "   • POST /leads/mensagem"
echo "   • POST /monitor/log     ← NOVO"
echo "   • GET  /monitor/stats   ← NOVO"
echo "   • POST /db/query        ← NOVO (PostgreSQL→SQLite auto-convert)"
echo "   • GET  /db/stats        ← NOVO"
echo "══════════════════════════════════"
