// ============================================================
// BEN GROWTH CENTER — Google Ads Serverless Proxy
// Accounts: 384-372-0833 (escritório) | 469-833-8084 (estudos)
// Manager (MCC): a configurar após criação
// ============================================================

const ACCOUNTS = {
  escritorio: {
    id: '3843720833',           // 384-372-0833 sem traços
    label: 'Escritório',
    email: 'mauromoncaoadv.escritorio@gmail.com',
  },
  estudos: {
    id: '4698338084',           // 469-833-8084 sem traços
    label: 'Estudos',
    email: 'mauromoncaoestudos@gmail.com',
  },
}

const GOOGLE_ADS_API_VERSION = 'v17'
const GOOGLE_ADS_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`

// ─── Helper: extrair tokens ──────────────────────────────────
function getTokens(req) {
  const auth = req.headers?.authorization || ''
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : null
  return {
    accessToken:  bearer  || process.env.GOOGLE_ADS_ACCESS_TOKEN  || null,
    developerToken:       process.env.GOOGLE_ADS_DEVELOPER_TOKEN   || null,
    clientId:             process.env.GOOGLE_CLIENT_ID             || null,
    clientSecret:         process.env.GOOGLE_CLIENT_SECRET         || null,
    refreshToken:         process.env.GOOGLE_REFRESH_TOKEN         || null,
    mccId:                process.env.GOOGLE_ADS_MCC_ID            || null,
  }
}

// ─── Helper: renovar access token via refresh token ─────────
async function refreshAccessToken(clientId, clientSecret, refreshToken) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || 'Falha ao renovar token')
  return data.access_token
}

// ─── Helper: Query GAQL ──────────────────────────────────────
async function queryGoogleAds(customerId, gaql, accessToken, developerToken, mccId) {
  const url = `${GOOGLE_ADS_BASE}/customers/${customerId}/googleAds:searchStream`
  const headers = {
    Authorization:         `Bearer ${accessToken}`,
    'developer-token':     developerToken,
    'Content-Type':        'application/json',
  }
  if (mccId) headers['login-customer-id'] = mccId

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: gaql }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw { status: res.status, error: err }
  }
  const chunks = await res.json()
  // searchStream retorna array de batches; achatar resultados
  return chunks.flatMap(c => c.results || [])
}

// ─── Handler principal ───────────────────────────────────────
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { action, account = 'escritorio', days = '30' } = req.query
  const tokens = getTokens(req)

  // ── Sem credenciais: retornar status ─────────────────────
  if (!tokens.accessToken && !tokens.refreshToken) {
    return res.status(200).json({
      status:   'pending_credentials',
      accounts: Object.values(ACCOUNTS).map(a => ({ id: a.id, label: a.label })),
      mccId:    tokens.mccId,
      message:  'Configure GOOGLE_ADS_ACCESS_TOKEN ou GOOGLE_REFRESH_TOKEN no Vercel',
    })
  }

  // ── Obter access token (refresh se necessário) ───────────
  let accessToken = tokens.accessToken
  if (!accessToken && tokens.refreshToken) {
    try {
      accessToken = await refreshAccessToken(tokens.clientId, tokens.clientSecret, tokens.refreshToken)
    } catch (e) {
      return res.status(401).json({ error: 'Falha ao renovar access token', detail: e.message })
    }
  }

  const acct = ACCOUNTS[account] || ACCOUNTS.escritorio
  const customerId = acct.id

  try {
    // ── TESTE ────────────────────────────────────────────────
    if (action === 'teste') {
      const data = await queryGoogleAds(
        customerId,
        'SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone FROM customer LIMIT 1',
        accessToken, tokens.developerToken, tokens.mccId
      )
      return res.json({ status: 'ok', customer: data[0]?.customer, account: acct.label })
    }

    // ── CAMPANHAS ────────────────────────────────────────────
    if (action === 'campanhas') {
      const data = await queryGoogleAds(
        customerId,
        `SELECT
           campaign.id, campaign.name, campaign.status,
           campaign.advertising_channel_type,
           metrics.impressions, metrics.clicks,
           metrics.cost_micros, metrics.conversions,
           metrics.ctr, metrics.average_cpc,
           metrics.cost_per_conversion
         FROM campaign
         WHERE segments.date DURING LAST_${days}_DAYS
           AND campaign.status != 'REMOVED'
         ORDER BY metrics.cost_micros DESC`,
        accessToken, tokens.developerToken, tokens.mccId
      )
      const campanhas = data.map(d => ({
        id:           d.campaign.id,
        nome:         d.campaign.name,
        status:       d.campaign.status,
        tipo:         d.campaign.advertisingChannelType,
        impressoes:   Number(d.metrics.impressions  || 0),
        cliques:      Number(d.metrics.clicks        || 0),
        gasto:        Number(d.metrics.costMicros    || 0) / 1_000_000,
        conversoes:   Number(d.metrics.conversions   || 0),
        ctr:          Number(d.metrics.ctr           || 0),
        cpc:          Number(d.metrics.averageCpc    || 0) / 1_000_000,
        cpa:          Number(d.metrics.costPerConversion || 0) / 1_000_000,
      }))
      return res.json({ status: 'ok', account: acct.label, campanhas })
    }

    // ── INSIGHTS (resumo do período) ─────────────────────────
    if (action === 'insights') {
      const data = await queryGoogleAds(
        customerId,
        `SELECT
           metrics.impressions, metrics.clicks,
           metrics.cost_micros, metrics.conversions,
           metrics.ctr, metrics.average_cpc,
           metrics.search_impression_share
         FROM customer
         WHERE segments.date DURING LAST_${days}_DAYS`,
        accessToken, tokens.developerToken, tokens.mccId
      )
      const m = data[0]?.metrics || {}
      return res.json({
        status: 'ok',
        account: acct.label,
        periodo: `${days} dias`,
        impressoes:  Number(m.impressions  || 0),
        cliques:     Number(m.clicks       || 0),
        gasto:       Number(m.costMicros   || 0) / 1_000_000,
        conversoes:  Number(m.conversions  || 0),
        ctr:         Number(m.ctr          || 0),
        cpc:         Number(m.averageCpc   || 0) / 1_000_000,
        impression_share: Number(m.searchImpressionShare || 0),
      })
    }

    // ── DADOS DIÁRIOS (gráfico) ──────────────────────────────
    if (action === 'diario') {
      const data = await queryGoogleAds(
        customerId,
        `SELECT
           segments.date,
           metrics.impressions, metrics.clicks,
           metrics.cost_micros, metrics.conversions
         FROM customer
         WHERE segments.date DURING LAST_${days}_DAYS
         ORDER BY segments.date ASC`,
        accessToken, tokens.developerToken, tokens.mccId
      )
      const diario = data.map(d => ({
        data:       d.segments.date,
        impressoes: Number(d.metrics.impressions || 0),
        cliques:    Number(d.metrics.clicks      || 0),
        gasto:      Number(d.metrics.costMicros  || 0) / 1_000_000,
        conversoes: Number(d.metrics.conversions || 0),
      }))
      return res.json({ status: 'ok', account: acct.label, diario })
    }

    // ── GRUPOS DE ANÚNCIOS ───────────────────────────────────
    if (action === 'adgroups') {
      const data = await queryGoogleAds(
        customerId,
        `SELECT
           ad_group.id, ad_group.name, ad_group.status,
           campaign.name,
           metrics.impressions, metrics.clicks,
           metrics.cost_micros, metrics.conversions,
           metrics.ctr, metrics.average_cpc
         FROM ad_group
         WHERE segments.date DURING LAST_${days}_DAYS
           AND ad_group.status != 'REMOVED'
         ORDER BY metrics.cost_micros DESC
         LIMIT 50`,
        accessToken, tokens.developerToken, tokens.mccId
      )
      const grupos = data.map(d => ({
        id:         d.adGroup.id,
        nome:       d.adGroup.name,
        status:     d.adGroup.status,
        campanha:   d.campaign.name,
        impressoes: Number(d.metrics.impressions || 0),
        cliques:    Number(d.metrics.clicks      || 0),
        gasto:      Number(d.metrics.costMicros  || 0) / 1_000_000,
        conversoes: Number(d.metrics.conversions || 0),
        ctr:        Number(d.metrics.ctr         || 0),
        cpc:        Number(d.metrics.averageCpc  || 0) / 1_000_000,
      }))
      return res.json({ status: 'ok', account: acct.label, grupos })
    }

    // ── PALAVRAS-CHAVE ───────────────────────────────────────
    if (action === 'keywords') {
      const data = await queryGoogleAds(
        customerId,
        `SELECT
           ad_group_criterion.keyword.text,
           ad_group_criterion.keyword.match_type,
           ad_group_criterion.status,
           campaign.name,
           metrics.impressions, metrics.clicks,
           metrics.cost_micros, metrics.conversions,
           metrics.average_cpc, metrics.quality_score
         FROM keyword_view
         WHERE segments.date DURING LAST_${days}_DAYS
           AND ad_group_criterion.status != 'REMOVED'
         ORDER BY metrics.cost_micros DESC
         LIMIT 100`,
        accessToken, tokens.developerToken, tokens.mccId
      )
      const keywords = data.map(d => ({
        texto:      d.adGroupCriterion.keyword.text,
        tipo:       d.adGroupCriterion.keyword.matchType,
        status:     d.adGroupCriterion.status,
        campanha:   d.campaign.name,
        impressoes: Number(d.metrics.impressions || 0),
        cliques:    Number(d.metrics.clicks      || 0),
        gasto:      Number(d.metrics.costMicros  || 0) / 1_000_000,
        conversoes: Number(d.metrics.conversions || 0),
        cpc:        Number(d.metrics.averageCpc  || 0) / 1_000_000,
        quality:    Number(d.metrics.qualityScore || 0),
      }))
      return res.json({ status: 'ok', account: acct.label, keywords })
    }

    // ── ATUALIZAR STATUS DE CAMPANHA ─────────────────────────
    if (action === 'update_status' && req.method === 'POST') {
      const { campaignId, status } = req.body || {}
      if (!campaignId || !['ENABLED', 'PAUSED'].includes(status)) {
        return res.status(400).json({ error: 'campaignId e status (ENABLED|PAUSED) são obrigatórios' })
      }
      const url = `${GOOGLE_ADS_BASE}/customers/${customerId}/campaigns:mutate`
      const headers = {
        Authorization:     `Bearer ${accessToken}`,
        'developer-token': tokens.developerToken,
        'Content-Type':    'application/json',
      }
      if (tokens.mccId) headers['login-customer-id'] = tokens.mccId

      const mutateRes = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          operations: [{ update: { resourceName: `customers/${customerId}/campaigns/${campaignId}`, status }, updateMask: 'status' }],
        }),
      })
      const mutateData = await mutateRes.json()
      if (!mutateRes.ok) return res.status(mutateRes.status).json(mutateData)
      return res.json({ status: 'ok', result: mutateData })
    }

    return res.status(400).json({ error: `Ação desconhecida: ${action}` })
  } catch (err) {
    console.error('[google-ads proxy]', err)
    return res.status(err.status || 500).json({ error: err.error || err.message || 'Erro interno' })
  }
}
