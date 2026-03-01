// ============================================================
// BEN GROWTH CENTER — ZapSign Serverless Proxy
// Vercel Function: /api/zapsign
// ============================================================

const ZAPSIGN_TOKEN = '426e787a-3446-4341-bbd2-2b88e544ad39'
const ZAPSIGN_BASE   = 'https://api.zapsign.com.br/api/v1'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const headers = {
    Authorization: `Bearer ${ZAPSIGN_TOKEN}`,
    'Content-Type': 'application/json',
  }

  try {
    // ── GET actions ─────────────────────────────────────────
    if (req.method === 'GET') {
      const { action, token, page = 1 } = req.query

      // Teste de conexão — busca dados da conta
      if (action === 'teste') {
        const r = await fetch(`${ZAPSIGN_BASE}/account/`, { headers })
        if (!r.ok) {
          const txt = await r.text()
          return res.status(r.status).json({ error: txt })
        }
        const data = await r.json()
        return res.status(200).json(data)
      }

      // Listar documentos
      if (action === 'listar') {
        const r = await fetch(`${ZAPSIGN_BASE}/docs/?page=${page}`, { headers })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json(await r.json())
      }

      // Buscar documento por token
      if (action === 'buscar' && token) {
        const r = await fetch(`${ZAPSIGN_BASE}/docs/${token}/`, { headers })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json(await r.json())
      }

      // Listar templates da conta
      if (action === 'templates') {
        const r = await fetch(`${ZAPSIGN_BASE}/templates/`, { headers })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json(await r.json())
      }

      return res.status(400).json({ error: 'Ação GET inválida' })
    }

    // ── POST actions ────────────────────────────────────────
    if (req.method === 'POST') {
      const body = req.body

      // Criar documento
      if (body.action === 'criar') {
        const payload = body.payload
        const r = await fetch(`${ZAPSIGN_BASE}/docs/`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: payload.name,
            url_pdf: payload.urlPdf,
            base64_pdf: payload.base64Pdf,
            lang: payload.lang || 'pt',
            sign_deadline_days: payload.signDeadlineDays || 30,
            message: payload.message || '',
            external_id: payload.externalId || '',
            send_automatic_email: payload.sendAutomaticEmail ?? true,
            disable_signer_emails: payload.disableSignerEmails ?? false,
            signers: (payload.signers || []).map((s) => ({
              name: s.name,
              email: s.email,
              phone: s.phone || '',
              send_automatic_email: s.sendAutomaticEmail ?? true,
              send_automatic_whatsapp: s.sendAutomaticWhatsapp ?? false,
              auth_mode: s.authMode || 'assinaturaTela',
              lock_email: s.lockEmail ?? false,
              lock_phone: s.lockPhone ?? false,
            })),
          }),
        })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(201).json(await r.json())
      }

      // Cancelar documento
      if (body.action === 'cancelar' && body.token) {
        const r = await fetch(`${ZAPSIGN_BASE}/docs/${body.token}/cancel/`, {
          method: 'POST',
          headers,
        })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json({ success: true })
      }

      // Reenviar email para signatário
      if (body.action === 'reenviar' && body.signerToken) {
        const r = await fetch(`${ZAPSIGN_BASE}/signers/${body.signerToken}/resend-email/`, {
          method: 'POST',
          headers,
        })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json({ success: true })
      }

      // Webhook recebido do ZapSign
      if (body.action === 'webhook') {
        // Processar evento e retornar OK
        console.log('[ZapSign Webhook]', JSON.stringify(body.event))
        return res.status(200).json({ received: true })
      }

      return res.status(400).json({ error: 'Ação POST inválida' })
    }

    return res.status(405).json({ error: 'Método não permitido' })
  } catch (err) {
    console.error('[ZapSign Proxy Error]', err)
    return res.status(500).json({ error: err.message || 'Erro interno' })
  }
}
