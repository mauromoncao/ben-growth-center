// ============================================================
// BEN GROWTH CENTER — Perplexity Legal Search API
// Pesquisa jurisprudência STJ/STF em tempo real
// Rota: POST /api/search
// Body: { query, area?, searchType? }
// ============================================================

export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  try {
    const {
      query,
      area = 'geral',
      searchType = 'jurisprudencia', // 'jurisprudencia' | 'legislacao' | 'doutrina' | 'noticias'
    } = req.body

    if (!query) return res.status(400).json({ error: 'query é obrigatório' })

    const apiKey = process.env.PERPLEXITY_API_KEY
    if (!apiKey) {
      return res.status(200).json({
        success: false,
        message: 'PERPLEXITY_API_KEY não configurada',
        results: null,
      })
    }

    // System prompts especializados por tipo de busca
    const systemPrompts = {
      jurisprudencia: `Você é um pesquisador jurídico brasileiro especializado em jurisprudência.
Busque e apresente decisões recentes do STJ, STF, TRF e TJ sobre o tema consultado.
Para cada decisão inclua: tribunal, número do processo/tema, data, ementa resumida e relevância.
Foque em decisões dos últimos 2 anos. Área de direito: ${area}.
Responda em português brasileiro, formato estruturado.`,

      legislacao: `Você é um especialista em legislação brasileira.
Pesquise a legislação vigente, alterações recentes e normas aplicáveis ao tema.
Inclua: lei, artigo, redação atual, alterações recentes e vigência.
Área de direito: ${area}. Responda em português, formato estruturado.`,

      doutrina: `Você é um pesquisador de doutrina jurídica brasileira.
Busque entendimentos doutrinários, artigos acadêmicos e obras relevantes sobre o tema.
Área de direito: ${area}. Responda em português, formato estruturado.`,

      noticias: `Você é um monitor de notícias jurídicas brasileiras.
Busque notícias recentes sobre mudanças legislativas, decisões importantes e tendências.
Área de direito: ${area}. Responda em português, formato estruturado.`,
    }

    const systemPrompt = systemPrompts[searchType] || systemPrompts.jurisprudencia

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        temperature: 0.2,
        max_tokens: 2500,
        return_citations: true,
        search_recency_filter: 'year',
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Perplexity error: ${err}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || 'Sem resultados'
    const citations = data.citations || []

    return res.status(200).json({
      success: true,
      query,
      area,
      searchType,
      results: content,
      citations,
      model: 'llama-3.1-sonar-large-128k-online',
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('[Search API] Erro:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro na pesquisa jurídica',
    })
  }
}
