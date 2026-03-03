#!/bin/bash
# ============================================================
# Instala o keepalive do Dr. Ben no crontab da VPS
# Execute: bash install-keepalive.sh
# ============================================================

echo "Instalando keepalive Dr. Ben na VPS..."

# Copiar script para local permanente
cp keepalive.sh /opt/dr-ben-leads/keepalive.sh
chmod +x /opt/dr-ben-leads/keepalive.sh

# Criar arquivo de log
touch /var/log/drben-keepalive.log

# Adicionar ao crontab (a cada 1 minuto)
CRON_JOB="* * * * * /opt/dr-ben-leads/keepalive.sh >> /var/log/drben-keepalive.log 2>&1"

# Verificar se já existe
(crontab -l 2>/dev/null | grep -q "drben-keepalive") && {
  echo "Keepalive já instalado no crontab."
} || {
  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
  echo "OK: Keepalive adicionado ao crontab (a cada 1 minuto)"
}

echo ""
echo "======================================"
echo "Crontab atual:"
crontab -l
echo "======================================"
echo ""
echo "Log em: /var/log/drben-keepalive.log"
echo "Testar agora: bash /opt/dr-ben-leads/keepalive.sh && echo OK"
echo ""

# Testar imediatamente
echo "Testando conexão agora..."
bash /opt/dr-ben-leads/keepalive.sh && echo "CONEXAO OK" || echo "Verificar log"
cat /var/log/drben-keepalive.log | tail -5
