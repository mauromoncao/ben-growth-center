#!/bin/bash
# ============================================================
# KEEPALIVE Dr. Ben — Roda na própria VPS via crontab
# Verifica conexão WhatsApp a cada 1 minuto
# Reconecta automaticamente se cair
# Log: /var/log/drben-keepalive.log
# ============================================================

EVOLUTION_URL="http://127.0.0.1:8080"
EVOLUTION_KEY="AA0EA3D4-457C-4AE4-AC51-6F269D989BE8"
INSTANCE="drben"
LOG="/var/log/drben-keepalive.log"
MAX_LOG_LINES=500

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG"
}

# Limitar tamanho do log
if [ -f "$LOG" ] && [ $(wc -l < "$LOG") -gt $MAX_LOG_LINES ]; then
  tail -200 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi

# Verificar estado da instância
STATE=$(curl -s --max-time 5 \
  "${EVOLUTION_URL}/instance/connectionState/${INSTANCE}" \
  -H "apikey: ${EVOLUTION_KEY}" \
  2>/dev/null | grep -o '"state":"[^"]*"' | cut -d'"' -f4)

if [ "$STATE" = "open" ]; then
  # Conexão OK — silencioso (não loga para não encher o arquivo)
  exit 0
fi

# Conexão caiu!
log "ALERTA: Estado da instância '$INSTANCE' = '$STATE' — tentando reconectar..."

# Tentativa 1: conectar
RESULT=$(curl -s --max-time 10 \
  "${EVOLUTION_URL}/instance/connect/${INSTANCE}" \
  -H "apikey: ${EVOLUTION_KEY}" \
  2>/dev/null)

NEW_STATE=$(echo "$RESULT" | grep -o '"state":"[^"]*"' | cut -d'"' -f4)

if [ "$NEW_STATE" = "open" ]; then
  log "OK: Reconexão bem-sucedida (state=open)"
  exit 0
fi

# Verificar se gerou QR (WhatsApp deslogado)
HAS_QR=$(echo "$RESULT" | grep -c "base64\|qrcode" || true)
if [ "$HAS_QR" -gt "0" ]; then
  log "CRITICO: WhatsApp deslogado — QR Code necessário! Acesse o painel Evolution."
  exit 1
fi

# Tentativa 2: restart da instância
log "Tentativa 2: restart da instância..."
curl -s --max-time 10 \
  "${EVOLUTION_URL}/instance/restart/${INSTANCE}" \
  -X PUT \
  -H "apikey: ${EVOLUTION_KEY}" \
  > /dev/null 2>&1

sleep 5

# Verificar novamente
STATE2=$(curl -s --max-time 5 \
  "${EVOLUTION_URL}/instance/connectionState/${INSTANCE}" \
  -H "apikey: ${EVOLUTION_KEY}" \
  2>/dev/null | grep -o '"state":"[^"]*"' | cut -d'"' -f4)

if [ "$STATE2" = "open" ]; then
  log "OK: Reconexão via restart bem-sucedida"
  exit 0
fi

log "ERRO: Não foi possível reconectar. Estado final: '$STATE2'"
exit 1
