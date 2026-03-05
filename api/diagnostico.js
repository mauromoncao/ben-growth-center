// Endpoint de diagnóstico — Dr. Ben via Z-API
export const config = { maxDuration: 30 }

async function testarOpenAI(key) {
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Responda apenas: OK' }],
        max_tokens: 5, temperature: 0,
      }),
      signal: AbortSignal.timeout(10000),
    })
    const data = await r.json()
    if (r.ok) return `✅ ONLINE — gpt-4o-mini — resposta: "${data?.choices?.[0]?.message?.content || 'sem texto'}"`
    if (r.status === 401) return '❌ CHAVE INVÁLIDA (401)'
    if (r.status === 429) return '❌ QUOTA ESGOTADA (429)'
    return `❌ ERRO ${r.status}`
  } catch (e) { return `❌ TIMEOUT: ${e.message}` }
}

async function testarZAPI(instanceId, token, clientToken) {
  try {
    const headers = { 'Content-Type': 'application/json' }
    if (clientToken) headers['Client-Token'] = clientToken
    const r = await fetch(
      `https://api.z-api.io/instances/${instanceId}/token/${token}/status`,
      { headers, signal: AbortSignal.timeout(8000) }
    )
    const data = await r.json()
    if (!r.ok) return `❌ ERRO: ${data?.error || r.status}`
    const connected = data?.connected === true
    return connected ? '✅ CONECTADO — Dr. Ben online' : `⚠️ ${data?.status || 'desconectado'}`
  } catch (e) { return `❌ TIMEOUT: ${e.message}` }
}

async function testarVPS(url) {
  try {
    const r = await fetch(`${url}/health`, { signal: AbortSignal.timeout(4000) })
    const data = await r.json()
    return r.ok ? `✅ ONLINE — leads: ${data?.leads ?? '?'}` : `❌ ERRO ${r.status}`
  } catch (e) { return `❌ OFFLINE: ${e.message}` }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const OPENAI_KEY        = process.env.OPENAI_API_KEY       || ''
  const ZAPI_INSTANCE_ID  = process.env.ZAPI_INSTANCE_ID     || ''
  const ZAPI_TOKEN        = process.env.ZAPI_TOKEN           || ''
  const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN    || ''
  const PLANTONISTA       = process.env.PLANTONISTA_WHATSAPP || ''
  const VPS_LEADS         = process.env.VPS_LEADS_URL        || ''

  const vars = {
    OPENAI_API_KEY:       OPENAI_KEY        ? `✅ ${OPENAI_KEY.slice(0,8)}...`          : '❌ NÃO DEFINIDA',
    ZAPI_INSTANCE_ID:     ZAPI_INSTANCE_ID  ? `✅ ${ZAPI_INSTANCE_ID.slice(0,8)}...`   : '❌ NÃO DEFINIDA',
    ZAPI_TOKEN:           ZAPI_TOKEN        ? `✅ ${ZAPI_TOKEN.slice(0,8)}...`          : '❌ NÃO DEFINIDA',
    ZAPI_CLIENT_TOKEN:    ZAPI_CLIENT_TOKEN ? `✅ ${ZAPI_CLIENT_TOKEN.slice(0,4)}...`   : '❌ NÃO DEFINIDA',
    PLANTONISTA_WHATSAPP: PLANTONISTA       ? `✅ ${PLANTONISTA}`                       : '❌ NÃO DEFINIDA',
    VPS_LEADS_URL:        VPS_LEADS         ? `✅ ${VPS_LEADS}`                         : '❌ NÃO DEFINIDA',
  }

  const [openaiStatus, zapiStatus, vpsStatus] = await Promise.all([
    OPENAI_KEY ? testarOpenAI(OPENAI_KEY) : Promise.resolve('❌ não configurado'),
    ZAPI_INSTANCE_ID ? testarZAPI(ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN) : Promise.resolve('❌ não configurado'),
    VPS_LEADS ? testarVPS(VPS_LEADS) : Promise.resolve('❌ não configurado'),
  ])

  const tudo_ok = openaiStatus.startsWith('✅') && zapiStatus.startsWith('✅')

  return res.status(200).json({
    titulo:     'Dr. Ben — Diagnóstico Completo',
    timestamp:  new Date().toISOString(),
    modelo_ia:  'gpt-4o-mini (OpenAI)',
    canal:      'Z-API WhatsApp',
    variaveis:  vars,
    openai:     openaiStatus,
    zapi:       zapiStatus,
    vps_leads_api: vpsStatus,
    resumo: {
      sistema_operacional: tudo_ok,
      status: tudo_ok
        ? '✅ TUDO OK — Dr. Ben operacional via Z-API'
        : '🔴 PROBLEMA DETECTADO — verifique os itens com ❌',
    },
  })
}
