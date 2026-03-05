// ============================================================
// WHATSAPP KEEPALIVE — Dr. Ben 24/7 via Z-API
// Chamado pelo cron do Vercel a cada 5 minutos
// Mantém a conexão WhatsApp ativa na nuvem
// ============================================================

const ZAPI_INSTANCE_ID  = process.env.ZAPI_INSTANCE_ID  || ''
const ZAPI_TOKEN        = process.env.ZAPI_TOKEN        || ''
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN || ''
const ZAPI_BASE = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}`

const DR_MAURO = process.env.PLANTONISTA_WHATSAPP || ''

async function zapiHeaders() {
  const h = { 'Content-Type': 'application/json' }
  if (ZAPI_CLIENT_TOKEN) h['Client-Token'] = ZAPI_CLIENT_TOKEN
  return h
}

// Buscar status da instância Z-API
async function getStatus() {
  const r = await fetch(`${ZAPI_BASE}/status`, {
    headers: await zapiHeaders(),
    signal: AbortSignal.timeout(8000),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data?.error || `Z-API ${r.status}`)
  // connected = true quando está online
  return data?.connected === true ? 'open' : (data?.status ?? 'disconnected')
}

// Avisar Dr. Mauro via Z-API
async function avisarDrMauro(msg) {
  if (!DR_MAURO) return
  const numero = DR_MAURO.replace(/\D/g, '')
  try {
    await fetch(`${ZAPI_BASE}/send-text`, {
      method: 'POST',
      headers: await zapiHeaders(),
      body: JSON.stringify({ phone: numero, message: msg }),
      signal: AbortSignal.timeout(8000),
    })
  } catch (e) {
    console.error('[Keepalive] Erro ao avisar Dr. Mauro:', e.message)
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const startTime = Date.now()
  const log = []

  try {
    if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
      log.push('❌ ZAPI_INSTANCE_ID ou ZAPI_TOKEN não configurados')
      return res.status(500).json({ ok: false, action: 'config_error', log })
    }

    log.push(`🔍 Verificando status Z-API — instância ${ZAPI_INSTANCE_ID.slice(0, 8)}...`)

    const state = await getStatus()
    log.push(`📊 Estado: ${state}`)

    if (state === 'open') {
      log.push('✅ Z-API online — Dr. Ben ativo 24/7')
      return res.json({
        ok: true,
        action: 'healthy',
        state,
        service: 'Z-API',
        duration_ms: Date.now() - startTime,
        log,
        timestamp: new Date().toISOString()
      })
    }

    // Desconectado — avisar Dr. Mauro
    log.push(`⚠️ Z-API desconectado (estado: ${state})`)
    await avisarDrMauro(
      `⚠️ *Dr. Ben — Alerta de Conexão*\n\nWhatsApp desconectou! Acesse o painel para reconectar:\nhttps://ben-growth-center.vercel.app/whatsapp\n\n_Horário: ${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Fortaleza' })}_`
    )
    log.push('📱 Dr. Mauro avisado sobre desconexão')

    return res.json({
      ok: false,
      action: 'disconnected',
      state,
      service: 'Z-API',
      message: 'WhatsApp desconectado — Dr. Mauro avisado',
      duration_ms: Date.now() - startTime,
      log,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    log.push(`❌ Erro: ${error.message}`)
    console.error('[Keepalive Z-API] Erro:', error)
    return res.status(200).json({
      ok: false,
      action: 'error',
      error: error.message,
      duration_ms: Date.now() - startTime,
      log,
      timestamp: new Date().toISOString()
    })
  }
}
