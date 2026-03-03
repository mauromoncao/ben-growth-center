// ============================================================
// BEN GROWTH CENTER — Cron: Lex Conteúdo (IA Jurídica)
// Rota: GET /api/cron/lex-conteudo
// Schedule: 07:00 diário (0 7 * * *)
// Gera sugestões de conteúdo jurídico com Gemini
// ============================================================

export const config = { maxDuration: 60 }

const GEMINI_KEY = process.env.GEMINI_API_KEY || ''
const PLANTONISTA = process.env.PLANTONISTA_WHATSAPP || ''

const TEMAS_JURIDICOS = [
  'Planejamento tributário para empresas 2026',
  'Defesa administrativa contra autuação fiscal',
  'Revisão de benefícios previdenciários negados',
  'Portabilidade de crédito bancário: direitos do consumidor',
  'Execução fiscal: como se defender da penhora',
  'INSS: aposentadoria por tempo de contribuição',
  'Restituição de tarifas bancárias indevidas',
  'Parcelamento de dívidas tributárias — PERT/REFIS',
]

async function gerarConteudo(tema) {
  if (!GEMINI_KEY) return null
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Você é Lex Conteúdo, especialista em marketing jurídico.
Gere um título SEO + 3 parágrafos de blog sobre: "${tema}"
Foco: Direito Tributário, Previdenciário e Bancário.
Escritório: Mauro Monção Advogados — Teresina/PI.
Formato: Título | Intro | Desenvolvimento | CTA para consulta.
Máx 400 palavras. Tom: profissional e acessível.`
            }]
          }],
          generationConfig: { maxOutputTokens: 600 }
        })
      }
    )
    const data = await res.json()
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null
  } catch { return null }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const hoje = new Date()
    const diaSemana = hoje.getDay() // 0=Dom ... 6=Sab
    const tema = TEMAS_JURIDICOS[diaSemana % TEMAS_JURIDICOS.length]

    const conteudo = await gerarConteudo(tema)

    const resultado = {
      success: true,
      data: hoje.toISOString().split('T')[0],
      tema,
      conteudo_gerado: !!conteudo,
      preview: conteudo ? conteudo.slice(0, 200) + '...' : null,
      timestamp: hoje.toISOString(),
    }

    // Log para monitoramento
    console.log('[LEX-CONTEUDO]', JSON.stringify({ tema, ok: !!conteudo }))

    return res.status(200).json(resultado)
  } catch (e) {
    console.error('[LEX-CONTEUDO] Erro:', e.message)
    return res.status(500).json({ error: e.message })
  }
}
