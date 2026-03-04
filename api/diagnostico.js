// Endpoint de diagnóstico — verificar env vars, Gemini (todos os modelos) e Evolution
export const config = { maxDuration: 30 }

const GEMINI_MODELS_TEST = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
]

async function testarGemini(key, modelo) {
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Responda apenas: OK' }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
        signal: AbortSignal.timeout(10000),
      }
    )
    const data = await r.json()
    if (r.status === 429) {
      return `❌ QUOTA ESGOTADA (429) — ${data?.error?.message?.slice(0, 120) || ''}`
    }
    if (r.ok) {
      const resposta = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'sem texto'
      return `✅ ONLINE — resposta: "${resposta}"`
    }
    return `❌ ERRO ${r.status}: ${data?.error?.message?.slice(0, 120) || 'desconhecido'}`
  } catch (e) {
    return `❌ TIMEOUT/ERRO: ${e.message}`
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const GEMINI_KEY    = process.env.GEMINI_API_KEY    || ''
  const EVOLUTION_URL = process.env.EVOLUTION_API_URL || ''
  const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || ''
  const INSTANCE      = process.env.EVOLUTION_INSTANCE || 'drben'
  const PLANTONISTA   = process.env.PLANTONISTA_WHATSAPP || ''
  const VPS_LEADS     = process.env.VPS_LEADS_URL || ''

  // Status das vars (sem expor valores completos)
  const vars = {
    GEMINI_API_KEY:        GEMINI_KEY    ? `✅ ${GEMINI_KEY.slice(0,8)}...` : '❌ NÃO DEFINIDA',
    EVOLUTION_API_URL:     EVOLUTION_URL ? `✅ ${EVOLUTION_URL}` : '❌ NÃO DEFINIDA',
    EVOLUTION_API_KEY:     EVOLUTION_KEY ? `✅ ${EVOLUTION_KEY.slice(0,8)}...` : '❌ NÃO DEFINIDA',
    EVOLUTION_INSTANCE:    INSTANCE      ? `✅ ${INSTANCE}` : '❌ NÃO DEFINIDA',
    PLANTONISTA_WHATSAPP:  PLANTONISTA   ? `✅ ${PLANTONISTA}` : '❌ NÃO DEFINIDA',
    VPS_LEADS_URL:         VPS_LEADS     ? `✅ ${VPS_LEADS}` : '❌ NÃO DEFINIDA',
  }

  // Testar todos os modelos Gemini em paralelo
  const geminiResultados = {}
  let geminiAtivo = null

  if (GEMINI_KEY) {
    const resultados = await Promise.all(
      GEMINI_MODELS_TEST.map(m => testarGemini(GEMINI_KEY, m).then(r => ({ modelo: m, resultado: r })))
    )
    for (const { modelo, resultado } of resultados) {
      geminiResultados[modelo] = resultado
      // Identificar o primeiro modelo funcional
      if (!geminiAtivo && resultado.startsWith('✅')) {
        geminiAtivo = modelo
      }
    }
  } else {
    for (const m of GEMINI_MODELS_TEST) {
      geminiResultados[m] = '❌ GEMINI_API_KEY ausente'
    }
  }

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

  return res.status(200).json({
    titulo:    'Dr. Ben — Diagnóstico Completo',
    timestamp: new Date().toISOString(),
    variaveis: vars,
    gemini_modelos:  geminiResultados,
    gemini_ativo:    geminiAtivo ? `✅ ${geminiAtivo}` : '❌ NENHUM MODELO DISPONÍVEL',
    evolution_api:   evolutionStatus,
    vps_leads_api:   vpsStatus,
    resumo: {
      sistema_operacional: !!(geminiAtivo && evolutionStatus.includes('✅')),
      problema_detectado: !geminiAtivo
        ? '🔴 Gemini sem quota disponível — Dr. Ben responderá com fallback humano'
        : (!evolutionStatus.includes('✅') ? '🟡 Evolution desconectado' : '✅ Tudo OK'),
    },
  })
}
