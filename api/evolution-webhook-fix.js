// ============================================================
// ENDPOINT TEMPORÁRIO — Verificar e reconfigurar webhook Evolution
// GET  /api/evolution-webhook-fix   → ver webhook atual
// POST /api/evolution-webhook-fix   → reconfigurar webhook
// ============================================================

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || ''
const INSTANCE      = process.env.EVOLUTION_INSTANCE || 'drben'
const WEBHOOK_URL   = 'https://ben-growth-center.vercel.app/api/whatsapp-evolution'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (!EVOLUTION_URL || !EVOLUTION_KEY) {
    return res.status(500).json({ error: 'Evolution não configurada' })
  }

  // GET — verificar webhook atual
  if (req.method === 'GET') {
    try {
      const r = await fetch(`${EVOLUTION_URL}/webhook/find/${INSTANCE}`, {
        headers: { apikey: EVOLUTION_KEY }
      })
      const data = await r.json()
      return res.json({
        ok: true,
        webhook_atual: data,
        webhook_esperado: WEBHOOK_URL,
        correto: data?.url === WEBHOOK_URL || data?.webhook?.url === WEBHOOK_URL,
        status_http: r.status,
      })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  // POST — reconfigurar webhook
  if (req.method === 'POST') {
    try {
      // Setar webhook
      const r = await fetch(`${EVOLUTION_URL}/webhook/set/${INSTANCE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: EVOLUTION_KEY,
        },
        body: JSON.stringify({
          url:     WEBHOOK_URL,
          webhook_by_events: false,
          webhook_base64:    false,
          events: [
            'MESSAGES_UPSERT',
            'CONNECTION_UPDATE',
            'QRCODE_UPDATED',
          ],
        }),
      })
      const data = await r.json()

      // Verificar resultado
      const r2 = await fetch(`${EVOLUTION_URL}/webhook/find/${INSTANCE}`, {
        headers: { apikey: EVOLUTION_KEY }
      })
      const atual = await r2.json()

      return res.json({
        ok: r.ok,
        status_http: r.status,
        resposta_set: data,
        webhook_configurado: atual,
        url_configurada: WEBHOOK_URL,
      })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  return res.status(405).end()
}
