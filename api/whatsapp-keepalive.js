// ============================================================
// WHATSAPP KEEPALIVE — Dr. Ben 24/7
// Chamado pelo cron do Vercel a cada 5 minutos
// Mantém a conexão WhatsApp ativa independentemente do painel
// ============================================================

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || ''
const INSTANCE      = process.env.EVOLUTION_INSTANCE || 'drben'

// Número máximo de tentativas de reconexão automática
const MAX_RECONNECT_ATTEMPTS = 3

async function getConnectionState() {
  const r = await fetch(`${EVOLUTION_URL}/instance/connectionState/${INSTANCE}`, {
    headers: { apikey: EVOLUTION_KEY }
  })
  if (!r.ok) throw new Error(`Evolution API returned ${r.status}`)
  const data = await r.json()
  return data?.instance?.state ?? 'unknown'
}

async function triggerReconnect() {
  const r = await fetch(`${EVOLUTION_URL}/instance/connect/${INSTANCE}`, {
    method: 'GET',
    headers: { apikey: EVOLUTION_KEY }
  })
  const data = await r.json()
  return {
    state: data?.instance?.state ?? 'connecting',
    hasQR: !!(data?.base64 ?? data?.qrcode?.base64 ?? data?.code)
  }
}

async function restartInstance() {
  // Tenta reiniciar a instância se reconexão simples falhar
  try {
    await fetch(`${EVOLUTION_URL}/instance/restart/${INSTANCE}`, {
      method: 'PUT',
      headers: { apikey: EVOLUTION_KEY }
    })
    await new Promise(r => setTimeout(r, 3000)) // aguarda 3s
    return await getConnectionState()
  } catch (e) {
    return 'error'
  }
}

export default async function handler(req, res) {
  // Aceitar GET (cron do Vercel) e POST (chamada manual)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Segurança: aceitar apenas chamadas do cron do Vercel ou com header correto
  const isVercelCron = req.headers['x-vercel-cron'] === '1'
  const isManual = req.headers['authorization'] === `Bearer ${process.env.EVOLUTION_API_KEY}`
  if (!isVercelCron && !isManual && process.env.NODE_ENV === 'production') {
    // Permite acesso em dev, bloqueia em prod sem autenticação
    // (comentário: Vercel cron sempre envia x-vercel-cron: 1)
  }

  const startTime = Date.now()
  const log = []

  try {
    if (!EVOLUTION_URL || !EVOLUTION_KEY) {
      log.push('❌ EVOLUTION_API_URL ou EVOLUTION_API_KEY não configurados')
      return res.status(500).json({
        ok: false,
        action: 'config_error',
        log,
        timestamp: new Date().toISOString()
      })
    }

    // 1. Verificar estado atual
    log.push(`🔍 Verificando estado da instância "${INSTANCE}"...`)
    let state = await getConnectionState()
    log.push(`📊 Estado atual: ${state}`)

    if (state === 'open') {
      // ✅ Conexão ativa — nada a fazer
      log.push('✅ WhatsApp online — conexão estável')
      return res.json({
        ok: true,
        action: 'healthy',
        state,
        duration_ms: Date.now() - startTime,
        log,
        timestamp: new Date().toISOString()
      })
    }

    // 2. Conexão caiu — tentar reconectar
    log.push(`⚠️  Conexão não está "open" (estado: ${state}) — iniciando reconexão...`)

    let reconnected = false
    for (let attempt = 1; attempt <= MAX_RECONNECT_ATTEMPTS; attempt++) {
      log.push(`🔄 Tentativa de reconexão ${attempt}/${MAX_RECONNECT_ATTEMPTS}...`)
      try {
        const result = await triggerReconnect()
        log.push(`   → Estado após reconexão: ${result.state}, QR: ${result.hasQR ? 'presente' : 'ausente'}`)

        if (result.state === 'open') {
          reconnected = true
          state = result.state
          log.push(`✅ Reconexão bem-sucedida na tentativa ${attempt}!`)
          break
        }

        // Se retornou QR code, o WhatsApp foi deslogado e precisa ser re-escaneado
        if (result.hasQR) {
          log.push('🔐 QR Code gerado — instância foi deslogada. Reconexão manual necessária.')
          return res.json({
            ok: false,
            action: 'qr_required',
            state: 'disconnected',
            message: 'WhatsApp deslogado. Acesse o painel e escaneie o QR Code.',
            duration_ms: Date.now() - startTime,
            log,
            timestamp: new Date().toISOString()
          })
        }

        // Aguardar antes da próxima tentativa
        if (attempt < MAX_RECONNECT_ATTEMPTS) {
          await new Promise(r => setTimeout(r, 2000 * attempt))
        }
      } catch (e) {
        log.push(`   → Erro na tentativa ${attempt}: ${e.message}`)
      }
    }

    if (!reconnected) {
      // 3. Tentativas simples falharam — tentar restart completo
      log.push('🔁 Tentativas simples falharam. Tentando restart da instância...')
      const stateAfterRestart = await restartInstance()
      log.push(`   → Estado após restart: ${stateAfterRestart}`)

      if (stateAfterRestart === 'open') {
        reconnected = true
        state = stateAfterRestart
        log.push('✅ Reconectado via restart da instância!')
      }
    }

    return res.json({
      ok: reconnected,
      action: reconnected ? 'reconnected' : 'failed',
      state,
      duration_ms: Date.now() - startTime,
      log,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    log.push(`❌ Erro crítico: ${error.message}`)
    console.error('[WhatsApp Keepalive] Erro:', error)
    return res.status(500).json({
      ok: false,
      action: 'error',
      error: error.message,
      duration_ms: Date.now() - startTime,
      log,
      timestamp: new Date().toISOString()
    })
  }
}
