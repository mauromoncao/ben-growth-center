#!/bin/bash
# Script de atualização do servidor Dr. Ben Leads API na VPS
echo "🔄 Atualizando Dr. Ben Leads API..."

# Baixar versão mais recente do GitHub
curl -fsSL https://raw.githubusercontent.com/mauromoncao/ben-growth-center/main/vps-leads-server/server.js \
  -o /opt/dr-ben-leads/server.js

echo "✅ server.js atualizado"

# Reiniciar com PM2
pm2 restart dr-ben-leads

echo "✅ Servidor reiniciado"
sleep 2
pm2 status dr-ben-leads

# Teste de saúde
echo ""
echo "🏥 Health check:"
curl -s http://localhost:3001/health
