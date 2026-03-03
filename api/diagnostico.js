export default async function handler(req, res) {
  // Testa se GEMINI_API_KEY existe e funciona
  const key = process.env.GEMINI_API_KEY
  
  let geminiStatus = 'NAO_CONFIGURADA'
  let geminiResposta = null
  
  if (key) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Responda apenas: GEMINI OK' }] }],
            generationConfig: { maxOutputTokens: 10 }
          })
        }
      )
      const d = await r.json()
      if (d?.candidates?.[0]?.content?.parts?.[0]?.text) {
        geminiStatus = 'FUNCIONANDO'
        geminiResposta = d.candidates[0].content.parts[0].text.trim()
      } else if (d?.error) {
        geminiStatus = 'ERRO: ' + d.error.message
      }
    } catch(e) {
      geminiStatus = 'EXCECAO: ' + e.message
    }
  }

  return res.json({
    GEMINI_API_KEY: key ? `✅ Configurada (${key.slice(0,8)}...)` : '❌ NÃO configurada',
    GEMINI_STATUS: geminiStatus,
    GEMINI_RESPOSTA: geminiResposta,
    EVOLUTION_API_URL: process.env.EVOLUTION_API_URL ?? '❌ não definida',
    EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY ? '✅ ' + process.env.EVOLUTION_API_KEY.slice(0,6) + '...' : '❌ não definida',
    PLANTONISTA_WHATSAPP: process.env.PLANTONISTA_WHATSAPP ?? '❌ não definida',
  })
}
