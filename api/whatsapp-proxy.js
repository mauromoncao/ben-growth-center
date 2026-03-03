// Proxy para Evolution API no VPS Hostinger
// Resolve problema de CORS: https (Vercel) → http (VPS)

const EVOLUTION_URL = 'http://181.215.135.202:8080'
const EVOLUTION_KEY = 'BenEvolution2026'
const INSTANCE      = 'drben'

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { action } = req.query

  try {
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

    return res.status(400).json({ error: 'Ação inválida. Use: status, qrcode, connect, disconnect' })

  } catch (e) {
    console.error('WhatsApp Proxy Error:', e)
    return res.status(500).json({ error: e.message })
  }
}
