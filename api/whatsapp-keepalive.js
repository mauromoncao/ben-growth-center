// ============================================================
// WHATSAPP KEEPALIVE — Dr. Ben + MARA 24/7 via Z-API
// Chamado pelo cron do Vercel a cada 5 minutos
// Mantém conexão Dr. Ben ativa + reconecta webhook MARA
// ============================================================

const ZAPI_INSTANCE_ID  = process.env.ZAPI_INSTANCE_ID  || ''
const ZAPI_TOKEN        = process.env.ZAPI_TOKEN        || ''
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN || ''
const ZAPI_BASE = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}`

// ── Instância MARA ───────────────────────────────────────────
const MARA_INSTANCE_ID  = process.env.MARA_ZAPI_INSTANCE_ID || ''
const MARA_TOKEN        = process.env.MARA_ZAPI_TOKEN       || ''
const MARA_CLIENT_TOKEN = process.env.MARA_ZAPI_CLIENT_TOKEN || ZAPI_CLIENT_TOKEN || ''
const MARA_BASE         = `https://api.z-api.io/instances/${MARA_INSTANCE_ID}/token/${MARA_TOKEN}`
const MARA_WEBHOOK_URL  = 'https://ben-growth-center.vercel.app/api/whatsapp-mara'

const DR_MAURO = process.env.PLANTONISTA_WHATSAPP || ''

async function zapiHeaders() {
  const h = { 'Content-Type': 'application/json' }
  if (ZAPI_CLIENT_TOKEN) h['Client-Token'] = ZAPI_CLIENT_TOKEN
  return h
}

function maraHeaders() {
  const h = { 'Content-Type': 'application/json' }
  if (MARA_CLIENT_TOKEN) h['Client-Token'] = MARA_CLIENT_TOKEN
  return h
}

// Buscar status da instância Z-API Dr. Ben
async function getStatus() {
  const r = await fetch(`${ZAPI_BASE}/status`, {
    headers: await zapiHeaders(),
    signal: AbortSignal.timeout(8000),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data?.error || `Z-API ${r.status}`)
  return data?.connected === true ? 'open' : (data?.status ?? 'disconnected')
}

// Configurar webhook da MARA (sempre — GET /webhooks não funciona nesta versão Z-API)
async function verificarWebhookMara(log) {
  if (!MARA_INSTANCE_ID || !MARA_TOKEN) {
    log.push('⚠️ MARA: instância não configurada — pulando')
    return
  }
  try {
    // PUT direto — sem tentar ler antes (GET /webhooks retorna NOT_FOUND nesta versão)
    const put = await fetch(`${MARA_BASE}/update-every-webhooks`, {
      method: 'PUT',
      headers: maraHeaders(),
      body: JSON.stringify({ value: MARA_WEBHOOK_URL, notifySentByMe: false }),
      signal: AbortSignal.timeout(10000),
    })
    const result = await put.json().catch(() => ({}))
    if (result?.value === true) {
      log.push(`✅ MARA webhook: configurado → ${MARA_WEBHOOK_URL}`)
    } else {
      log.push(`⚠️ MARA webhook: resposta inesperada — ${JSON.stringify(result)}`)
    }
  } catch (e) {
    log.push(`❌ MARA webhook: erro — ${e.message}`)
  }
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
    log.push(`📊 Dr. Ben: ${state}`)

    // ── Sempre verifica webhook MARA ─────────────────────────
    await verificarWebhookMara(log)

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
