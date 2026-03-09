// ============================================================
// BEN GROWTH CENTER — Cron: Lex Campanhas (Otimização Ads)
// Rota: GET /api/cron/lex-campanhas
// Schedule: 08:00 e 18:00 diário (0 8,18 * * *)
// Verifica performance de campanhas Google/Meta e alerta
// ============================================================

export const config = { maxDuration: 60 }

const GEMINI_KEY      = process.env.GEMINI_API_KEY || ''
const PLANTONISTA     = process.env.PLANTONISTA_WHATSAPP || ''
const ZAPI_INSTANCE   = process.env.ZAPI_INSTANCE_ID || ''
const ZAPI_TOKEN      = process.env.ZAPI_TOKEN || ''
const ZAPI_CLIENT_TOK = process.env.ZAPI_CLIENT_TOKEN || ''
const ZAPI_BASE       = `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}`

// Usa Z-API (instância Dr. Ben) para enviar notificações ao plantonista
async function enviarWhatsApp(numero, mensagem) {
  if (!ZAPI_INSTANCE || !ZAPI_TOKEN || !numero) return false
  try {
    const headers = { 'Content-Type': 'application/json' }
    if (ZAPI_CLIENT_TOK) headers['Client-Token'] = ZAPI_CLIENT_TOK
    const tel = numero.replace(/\D/g, '')
    const res = await fetch(`${ZAPI_BASE}/send-text`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phone: tel, message: mensagem }),
    })
    return res.ok
  } catch { return false }
}

async function getMetaPerformance() {
  try {
    const res = await fetch(
      `https://ben-growth-center.vercel.app/api/meta-ads?action=hoje`,
      { headers: { 'Content-Type': 'application/json' } }
    )
    return res.ok ? await res.json() : null
  } catch { return null }
}

async function getGooglePerformance() {
  try {
    const res = await fetch(
      `https://ben-growth-center.vercel.app/api/google-ads?action=diario&account=escritorio`,
      { headers: { 'Content-Type': 'application/json' } }
    )
    return res.ok ? await res.json() : null
  } catch { return null }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const agora      = new Date()
    const hora       = agora.getHours()
    const turno      = hora < 12 ? 'manhã' : 'tarde'
    const alertas    = []

    // ── Buscar dados Meta Ads ────────────────────────────────
    const metaData = await getMetaPerformance()
    if (metaData?.hoje) {
      const { spend, clicks, impressions } = metaData.hoje
      const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0'
      alertas.push(`📊 *Meta Ads (${turno})*\n💰 Gasto: R$ ${Number(spend || 0).toFixed(2)}\n👆 Cliques: ${clicks || 0}\n📈 CTR: ${ctr}%`)
    }

    // ── Buscar dados Google Ads ──────────────────────────────
    const googleData = await getGooglePerformance()
    if (googleData?.resumo) {
      const { custo, cliques, impressoes } = googleData.resumo
      alertas.push(`🔍 *Google Ads (${turno})*\n💰 Gasto: R$ ${Number(custo || 0).toFixed(2)}\n👆 Cliques: ${cliques || 0}\n📈 Impressões: ${impressoes || 0}`)
    }

    // ── Enviar resumo se houver dados ────────────────────────
    let whatsappEnviado = false
    if (alertas.length > 0 && PLANTONISTA) {
      const mensagem = `🤖 *Lex Campanhas — Relatório ${turno}*\n${agora.toLocaleString('pt-BR')}\n\n${alertas.join('\n\n')}\n\n_Gerado automaticamente pelo Ben Growth Center_`
      whatsappEnviado = await enviarWhatsApp(PLANTONISTA, mensagem)
    }

    const resultado = {
      success: true,
      turno,
      alertas_gerados: alertas.length,
      whatsapp_enviado: whatsappEnviado,
      meta_data: !!metaData,
      google_data: !!googleData,
      timestamp: agora.toISOString(),
    }

    console.log('[LEX-CAMPANHAS]', JSON.stringify(resultado))
    return res.status(200).json(resultado)
  } catch (e) {
    console.error('[LEX-CAMPANHAS] Erro:', e.message)
    return res.status(500).json({ error: e.message })
  }
}
