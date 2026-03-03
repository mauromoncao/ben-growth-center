// Endpoint de diagnóstico temporário — verificar env vars e Gemini
export const config = { maxDuration: 15 }

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

  // Testar Gemini 2.5-flash
  let geminiStatus = '❌ não testado'
  let geminiModel  = ''
  if (GEMINI_KEY) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Responda apenas a palavra: FUNCIONANDO' }] }],
            generationConfig: { maxOutputTokens: 10 }
          }),
          signal: AbortSignal.timeout(10000)
        }
      )
      const data = await r.json()
      if (r.ok) {
        geminiStatus = '✅ ONLINE'
        geminiModel  = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'sem resposta'
      } else {
        geminiStatus = `❌ ERRO ${r.status}: ${data?.error?.message || 'desconhecido'}`
      }
    } catch(e) {
      geminiStatus = `❌ TIMEOUT/ERRO: ${e.message}`
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
    } catch(e) {
      evolutionStatus = `❌ TIMEOUT: ${e.message}`
    }
  }

  return res.status(200).json({
    titulo: 'Dr. Ben — Diagnóstico Completo',
    timestamp: new Date().toISOString(),
    variaveis: vars,
    gemini_2_5_flash: geminiStatus,
    gemini_resposta: geminiModel,
    evolution_api: evolutionStatus,
  })
}
