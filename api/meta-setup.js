// Endpoint temporário para verificar e configurar Meta Cloud API
export const config = { maxDuration: 30 }

const META_TOKEN        = process.env.META_TOKEN          || ''
const META_PHONE_ID     = process.env.META_PHONE_ID       || ''
const META_WA_BIZ_ID    = process.env.META_WA_BUSINESS_ID || ''
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN   || 'drben2026'
const WEBHOOK_URL       = 'https://ben-growth-center.vercel.app/api/whatsapp-meta'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const action = req.query.action || 'status'

  // 1. Ver o que está configurado
  if (action === 'status') {
    const temToken   = !!META_TOKEN
    const temPhoneId = !!META_PHONE_ID
    const temBizId   = !!META_WA_BIZ_ID

    // Testar se o token é válido
    let tokenValido = false
    let tokenInfo   = null
    if (temToken) {
      try {
        const r = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${META_TOKEN}`, {
          signal: AbortSignal.timeout(5000)
        })
        const d = await r.json()
        tokenValido = !!d?.id
        tokenInfo   = d?.name || d?.error?.message || 'sem info'
      } catch(e) { tokenInfo = e.message }
    }

    return res.json({
      variaveis: {
        META_TOKEN:          temToken   ? '✅ presente' : '❌ FALTANDO',
        META_PHONE_ID:       temPhoneId ? `✅ ${META_PHONE_ID}` : '❌ FALTANDO',
        META_WA_BUSINESS_ID: temBizId   ? `✅ ${META_WA_BIZ_ID}` : '❌ FALTANDO',
        META_VERIFY_TOKEN:   `✅ ${META_VERIFY_TOKEN}`,
      },
      token_valido: tokenValido,
      token_info:   tokenInfo,
      webhook_url:  WEBHOOK_URL,
    })
  }

  // 2. Registrar webhook via API Graph
  if (action === 'registrar') {
    if (!META_TOKEN || !META_WA_BIZ_ID) {
      return res.status(400).json({ 
        erro: 'META_TOKEN ou META_WA_BUSINESS_ID faltando no Vercel',
        tem_token: !!META_TOKEN,
        tem_biz_id: !!META_WA_BIZ_ID,
      })
    }

    try {
      // Registrar webhook na WhatsApp Business Account
      const r = await fetch(
        `https://graph.facebook.com/v19.0/${META_WA_BIZ_ID}/subscribed_apps`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${META_TOKEN}`,
          },
          signal: AbortSignal.timeout(10000),
        }
      )
      const data = await r.json()

      // Também tentar via app subscriptions
      const r2 = await fetch(
        `https://graph.facebook.com/v19.0/me/subscriptions`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${META_TOKEN}` },
          body: new URLSearchParams({
            object: 'whatsapp_business_account',
            callback_url: WEBHOOK_URL,
            verify_token: META_VERIFY_TOKEN,
            fields: 'messages',
          }),
          signal: AbortSignal.timeout(10000),
        }
      )
      const data2 = await r2.json()

      return res.json({
        ok: r.ok,
        subscribed_apps: data,
        subscriptions: data2,
        webhook_url: WEBHOOK_URL,
        verify_token: META_VERIFY_TOKEN,
      })
    } catch(e) {
      return res.status(500).json({ erro: e.message })
    }
  }

  // 3. Testar envio de mensagem
  if (action === 'testar') {
    const numero = req.query.numero || ''
    if (!numero) return res.status(400).json({ erro: 'Passe ?numero=5585991430969' })
    if (!META_TOKEN || !META_PHONE_ID) {
      return res.status(400).json({ erro: 'META_TOKEN ou META_PHONE_ID faltando' })
    }
    try {
      const r = await fetch(
        `https://graph.facebook.com/v19.0/${META_PHONE_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${META_TOKEN}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: numero,
            type: 'text',
            text: { body: '✅ Dr. Ben online via Meta Cloud API! Sistema funcionando.' }
          }),
          signal: AbortSignal.timeout(10000),
        }
      )
      const data = await r.json()
      return res.json({ ok: r.ok, status: r.status, resposta: data })
    } catch(e) {
      return res.status(500).json({ erro: e.message })
    }
  }

  return res.status(400).json({ erro: 'Use ?action=status | registrar | testar&numero=55...' })
}
