// Endpoint de diagnóstico — verificar env vars, OpenAI e Evolution
export const config = { maxDuration: 30 }

async function testarOpenAI(key) {
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model:       'gpt-4o-mini',
        messages:    [{ role: 'user', content: 'Responda apenas: OK' }],
        max_tokens:  5,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(10000),
    })
    const data = await r.json()
    if (r.ok) {
      const resposta = data?.choices?.[0]?.message?.content || 'sem texto'
      return `✅ ONLINE — gpt-4o-mini — resposta: "${resposta}"`
    }
    if (r.status === 401) return '❌ CHAVE INVÁLIDA (401) — verifique OPENAI_API_KEY no Vercel'
    if (r.status === 429) return '❌ QUOTA/RATE LIMIT (429) — verifique créditos em platform.openai.com'
    return `❌ ERRO ${r.status}: ${data?.error?.message?.slice(0, 120) || 'desconhecido'}`
  } catch (e) {
    return `❌ TIMEOUT/ERRO: ${e.message}`
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const OPENAI_KEY    = process.env.OPENAI_API_KEY    || ''
  const EVOLUTION_URL = process.env.EVOLUTION_API_URL || ''
  const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || ''
  const INSTANCE      = process.env.EVOLUTION_INSTANCE || 'drben'
  const PLANTONISTA   = process.env.PLANTONISTA_WHATSAPP || ''
  const VPS_LEADS     = process.env.VPS_LEADS_URL || ''

  // Status das vars (sem expor valores completos)
  const vars = {
    OPENAI_API_KEY:        OPENAI_KEY    ? `✅ ${OPENAI_KEY.slice(0,8)}...` : '❌ NÃO DEFINIDA',
    EVOLUTION_API_URL:     EVOLUTION_URL ? `✅ ${EVOLUTION_URL}` : '❌ NÃO DEFINIDA',
    EVOLUTION_API_KEY:     EVOLUTION_KEY ? `✅ ${EVOLUTION_KEY.slice(0,8)}...` : '❌ NÃO DEFINIDA',
    EVOLUTION_INSTANCE:    INSTANCE      ? `✅ ${INSTANCE}` : '❌ NÃO DEFINIDA',
    PLANTONISTA_WHATSAPP:  PLANTONISTA   ? `✅ ${PLANTONISTA}` : '❌ NÃO DEFINIDA',
    VPS_LEADS_URL:         VPS_LEADS     ? `✅ ${VPS_LEADS}` : '❌ NÃO DEFINIDA',
  }

  // Testar OpenAI
  const openaiStatus = OPENAI_KEY
    ? await testarOpenAI(OPENAI_KEY)
    : '❌ OPENAI_API_KEY não definida no Vercel'

  // Testar Evolution API
  let evolutionStatus = '❌ não testado'
  if (EVOLUTION_URL && EVOLUTION_KEY) {
    try {
      const r = await fetch(
        `${EVOLUTION_URL}/instance/connectionState/${INSTANCE}`,
        { headers: { apikey: EVOLUTION_KEY }, signal: AbortSignal.timeout(5000) }
      )
      const data = await r.json()
      evolutionStatus = r.ok
        ? `✅ ${data?.instance?.state || 'unknown'}`
        : `❌ ERRO ${r.status}`
    } catch (e) {
      evolutionStatus = `❌ TIMEOUT: ${e.message}`
    }
  }

  // Testar VPS Leads API
  let vpsStatus = '❌ não testado'
  if (VPS_LEADS) {
    try {
      const r = await fetch(`${VPS_LEADS}/health`, { signal: AbortSignal.timeout(4000) })
      const data = await r.json()
      vpsStatus = r.ok
        ? `✅ ONLINE — leads: ${data?.leads ?? '?'}`
        : `❌ ERRO ${r.status}`
    } catch (e) {
      vpsStatus = `❌ OFFLINE: ${e.message}`
    }
  }

  const tudo_ok = openaiStatus.startsWith('✅') && evolutionStatus.includes('✅')

  return res.status(200).json({
    titulo:        'Dr. Ben — Diagnóstico Completo',
    timestamp:     new Date().toISOString(),
    modelo_ia:     'gpt-4o-mini (OpenAI)',
    variaveis:     vars,
    openai:        openaiStatus,
    evolution_api: evolutionStatus,
    vps_leads_api: vpsStatus,
    resumo: {
      sistema_operacional: tudo_ok,
      status: tudo_ok
        ? '✅ TUDO OK — Dr. Ben operacional'
        : '🔴 PROBLEMA DETECTADO — verifique os itens com ❌',
    },
  })
}
