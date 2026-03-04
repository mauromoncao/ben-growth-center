// Proxy para Evolution API no VPS Hostinger
// Resolve problema de CORS: https (Vercel) → http (VPS)

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || ''
const INSTANCE      = process.env.EVOLUTION_INSTANCE || 'drben'

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { action } = req.query

  try {
    if (action === 'send') {
      // Enviar mensagem de teste
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const numero = body?.numero || ''
      const texto  = body?.texto  || 'Teste Dr. Ben ✅'
      if (!numero) return res.status(400).json({ error: 'numero obrigatório' })
      const r = await fetch(`${EVOLUTION_URL}/message/sendText/${INSTANCE}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_KEY },
        body: JSON.stringify({ number: numero, textMessage: { text: texto } }),
      })
      const data = await r.json()
      return res.json({ ok: r.ok, status: r.status, resposta: data })
    }

    if (action === 'status') {
      // Buscar estado da conexão
      const r = await fetch(`${EVOLUTION_URL}/instance/connectionState/${INSTANCE}`, {
        headers: { apikey: EVOLUTION_KEY }
      })
      const data = await r.json()
      const state = data?.instance?.state ?? ''
      return res.json({ state, status: state === 'open' ? 'open' : state === 'connecting' ? 'connecting' : 'disconnected' })
    }

    if (action === 'qrcode') {
      // Buscar QR Code
      const r = await fetch(`${EVOLUTION_URL}/instance/connect/${INSTANCE}`, {
        headers: { apikey: EVOLUTION_KEY }
      })
      const data = await r.json()
      return res.json({
        qrcode: data?.base64 ?? data?.qrcode?.base64 ?? null,
        code:   data?.code   ?? null,
      })
    }

    if (action === 'connect') {
      // Reconectar instância
      const r = await fetch(`${EVOLUTION_URL}/instance/connect/${INSTANCE}`, {
        method: 'GET',
        headers: { apikey: EVOLUTION_KEY }
      })
      const data = await r.json()
      return res.json({
        qrcode: data?.base64 ?? data?.qrcode?.base64 ?? null,
        state:  'connecting',
      })
    }

    if (action === 'disconnect') {
      await fetch(`${EVOLUTION_URL}/instance/logout/${INSTANCE}`, {
        method: 'DELETE',
        headers: { apikey: EVOLUTION_KEY }
      })
      return res.json({ state: 'disconnected' })
    }

    return res.status(400).json({ error: 'Ação inválida. Use: status, qrcode, connect, disconnect, send' })

  } catch (e) {
    console.error('WhatsApp Proxy Error:', e)
    return res.status(500).json({ error: e.message })
  }
}
