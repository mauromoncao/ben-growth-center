// ============================================================
// BEN GROWTH CENTER — Asaas Serverless Proxy
// Vercel Function: /api/asaas
// Token: produção
// ============================================================

const ASAAS_TOKEN = '$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmYwOTFmZWYxLTRkYmQtNGVmOC1iOTg1LWQzMDU5M2FlOGFlYTo6JGFhY2hfZDEzYjJhNjUtNjZhZS00NGU4LWEwOTMtYTBmNDE4YTg2YzA3'
const ASAAS_BASE  = 'https://api.asaas.com/v3'

const headers = () => ({
  access_token: ASAAS_TOKEN,
  'Content-Type': 'application/json',
  'User-Agent': 'BenGrowthCenter/1.0',
})

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {

    // ── GET ────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const { action, id, offset = 0, limit = 20, status, cpfCnpj } = req.query

      // Teste de conexão — dados da conta
      if (action === 'teste') {
        const r = await fetch(`${ASAAS_BASE}/myAccount`, { headers: headers() })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json(await r.json())
      }

      // Listar cobranças
      if (action === 'listar_cobrancas') {
        const params = new URLSearchParams({ offset: String(offset), limit: String(limit) })
        if (status) params.set('status', status)
        const r = await fetch(`${ASAAS_BASE}/payments?${params}`, { headers: headers() })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json(await r.json())
      }

      // Buscar cobrança por ID
      if (action === 'buscar_cobranca' && id) {
        const r = await fetch(`${ASAAS_BASE}/payments/${id}`, { headers: headers() })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json(await r.json())
      }

      // QR Code Pix de uma cobrança
      if (action === 'pix_qrcode' && id) {
        const r = await fetch(`${ASAAS_BASE}/payments/${id}/pixQrCode`, { headers: headers() })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json(await r.json())
      }

      // URL do boleto
      if (action === 'boleto_url' && id) {
        const r = await fetch(`${ASAAS_BASE}/payments/${id}/identificationField`, { headers: headers() })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json(await r.json())
      }

      // Listar clientes
      if (action === 'listar_clientes') {
        const params = new URLSearchParams({ offset: String(offset), limit: String(limit) })
        if (cpfCnpj) params.set('cpfCnpj', cpfCnpj)
        const r = await fetch(`${ASAAS_BASE}/customers?${params}`, { headers: headers() })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json(await r.json())
      }

      // Buscar cliente por ID
      if (action === 'buscar_cliente' && id) {
        const r = await fetch(`${ASAAS_BASE}/customers/${id}`, { headers: headers() })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json(await r.json())
      }

      // Saldo da conta
      if (action === 'saldo') {
        const r = await fetch(`${ASAAS_BASE}/finance/balance`, { headers: headers() })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json(await r.json())
      }

      // Estatísticas de cobranças
      if (action === 'estatisticas') {
        const r = await fetch(`${ASAAS_BASE}/payments/statistics`, { headers: headers() })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json(await r.json())
      }

      // Transferências / extratos
      if (action === 'extrato') {
        const params = new URLSearchParams({ offset: String(offset), limit: String(limit) })
        const r = await fetch(`${ASAAS_BASE}/financialTransactions?${params}`, { headers: headers() })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json(await r.json())
      }

      return res.status(400).json({ error: 'Ação GET inválida' })
    }

    // ── POST ───────────────────────────────────────────────────
    if (req.method === 'POST') {
      const body = req.body

      // Criar cliente
      if (body.action === 'criar_cliente') {
        const r = await fetch(`${ASAAS_BASE}/customers`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify(body.cliente),
        })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(201).json(await r.json())
      }

      // Criar cobrança (Pix, Boleto ou Cartão)
      if (body.action === 'criar_cobranca') {
        const r = await fetch(`${ASAAS_BASE}/payments`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify(body.cobranca),
        })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        const data = await r.json()

        // Se for PIX, já busca o QR Code
        if (body.cobranca.billingType === 'PIX' && data.id) {
          const qrRes = await fetch(`${ASAAS_BASE}/payments/${data.id}/pixQrCode`, { headers: headers() })
          if (qrRes.ok) {
            const qrData = await qrRes.json()
            data.pixPayload   = qrData.payload
            data.pixQrCodeImg = qrData.encodedImage
          }
        }

        return res.status(201).json(data)
      }

      // Criar assinatura recorrente
      if (body.action === 'criar_assinatura') {
        const r = await fetch(`${ASAAS_BASE}/subscriptions`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify(body.assinatura),
        })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(201).json(await r.json())
      }

      // Cancelar / deletar cobrança
      if (body.action === 'cancelar_cobranca' && body.id) {
        const r = await fetch(`${ASAAS_BASE}/payments/${body.id}`, {
          method: 'DELETE',
          headers: headers(),
        })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json({ success: true })
      }

      // Registrar recebimento em dinheiro
      if (body.action === 'receber_dinheiro' && body.id) {
        const r = await fetch(`${ASAAS_BASE}/payments/${body.id}/receiveInCash`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({ paymentDate: body.paymentDate, value: body.value }),
        })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json(await r.json())
      }

      return res.status(400).json({ error: 'Ação POST inválida' })
    }

    return res.status(405).json({ error: 'Método não permitido' })

  } catch (err) {
    console.error('[Asaas Proxy Error]', err)
    return res.status(500).json({ error: err.message || 'Erro interno' })
  }
}
