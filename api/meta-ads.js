// ============================================================
// BEN GROWTH CENTER — Meta Ads Serverless Proxy
// Ad Account: act_4244231065854550 (Dr Mauro Monção)
// Pixel: 1249768107002017
// ============================================================

const AD_ACCOUNT_ID = 'act_4244231065854550' // Dr Mauro Monção (conta principal)
const META_VERSION  = 'v19.0'
const BASE_URL      = `https://graph.facebook.com/${META_VERSION}`

// Token vem do header Authorization ou env var — NUNCA hardcoded
function getToken(req) {
  const auth = req.headers['authorization']
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7)
  return process.env.META_ACCESS_TOKEN || ''
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const token = getToken(req)

  // Sem token — retorna status pending com Ad Account configurado
  if (!token) {
    return res.status(200).json({
      status: 'pending_token',
      ad_account_id: AD_ACCOUNT_ID,
      message: 'Ad Account configurado. Insira o Access Token para ativar dados reais.',
    })
  }

  const headers = { Authorization: `Bearer ${token}` }

  try {
    if (req.method === 'GET') {
      const { action, campaign_id, since, until, limit = 10 } = req.query

      // Testar conexão
      if (action === 'teste') {
        const r = await fetch(`${BASE_URL}/me?fields=id,name,email`, { headers })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        const me = await r.json()
        return res.status(200).json({ ...me, ad_account_id: AD_ACCOUNT_ID })
      }

      // Dados da conta de anúncios
      if (action === 'conta') {
        const fields = 'id,name,account_status,currency,timezone_name,spend_cap,amount_spent,balance'
        const r = await fetch(`${BASE_URL}/${AD_ACCOUNT_ID}?fields=${fields}`, { headers })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json(await r.json())
      }

      // Listar campanhas
      if (action === 'campanhas') {
        const fields = 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time'
        const r = await fetch(
          `${BASE_URL}/${AD_ACCOUNT_ID}/campaigns?fields=${fields}&limit=${limit}`,
          { headers }
        )
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json(await r.json())
      }

      // Insights de campanhas (métricas reais)
      if (action === 'insights') {
        const dateRange = since && until
          ? `&time_range={"since":"${since}","until":"${until}"}`
          : `&date_preset=last_30d`
        const fields = 'campaign_name,impressions,clicks,spend,ctr,cpc,cpm,reach,frequency,actions,cost_per_action_type,purchase_roas,date_start,date_stop'
        const r = await fetch(
          `${BASE_URL}/${AD_ACCOUNT_ID}/insights?fields=${fields}&level=campaign${dateRange}&limit=${limit}`,
          { headers }
        )
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json(await r.json())
      }

      // Insights de uma campanha específica
      if (action === 'insights_campanha' && campaign_id) {
        const fields = 'campaign_name,impressions,clicks,spend,ctr,cpc,cpm,reach,actions,purchase_roas'
        const r = await fetch(
          `${BASE_URL}/${campaign_id}/insights?fields=${fields}&date_preset=last_30d`,
          { headers }
        )
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json(await r.json())
      }

      // Gastos do dia / mês
      if (action === 'gastos') {
        const fields = 'spend,impressions,clicks,reach'
        const hoje = new Date().toISOString().split('T')[0]
        const primeiroDia = hoje.slice(0, 7) + '-01'
        const [diaRes, mesRes] = await Promise.all([
          fetch(`${BASE_URL}/${AD_ACCOUNT_ID}/insights?fields=${fields}&time_range={"since":"${hoje}","until":"${hoje}"}`, { headers }),
          fetch(`${BASE_URL}/${AD_ACCOUNT_ID}/insights?fields=${fields}&time_range={"since":"${primeiroDia}","until":"${hoje}"}`, { headers }),
        ])
        const dia = diaRes.ok ? await diaRes.json() : {}
        const mes = mesRes.ok ? await mesRes.json() : {}
        return res.status(200).json({ hoje: dia?.data?.[0] || null, mes: mes?.data?.[0] || null })
      }

      // Conjuntos de anúncios
      if (action === 'adsets' && campaign_id) {
        const fields = 'id,name,status,daily_budget,targeting,optimization_goal,billing_event'
        const r = await fetch(
          `${BASE_URL}/${campaign_id}/adsets?fields=${fields}&limit=${limit}`,
          { headers }
        )
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json(await r.json())
      }

      // Saldo da conta de anúncios
      if (action === 'saldo') {
        const r = await fetch(`${BASE_URL}/${AD_ACCOUNT_ID}?fields=balance,currency,amount_spent`, { headers })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json(await r.json())
      }

      return res.status(400).json({ error: 'Ação inválida' })
    }

    // POST — pausar / ativar campanha
    if (req.method === 'POST') {
      const { action, campaign_id, status } = req.body

      if (action === 'atualizar_status' && campaign_id) {
        const r = await fetch(`${BASE_URL}/${campaign_id}`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED' }),
        })
        if (!r.ok) return res.status(r.status).json({ error: await r.text() })
        return res.status(200).json(await r.json())
      }

      return res.status(400).json({ error: 'Ação POST inválida' })
    }

    return res.status(405).json({ error: 'Método não permitido' })
  } catch (err) {
    console.error('[Meta Ads Proxy Error]', err)
    return res.status(500).json({ error: err.message || 'Erro interno' })
  }
}
