// ============================================================
// LEX OS — API de Agentes (Vercel Serverless)
// Rota: /api/agents/run
// Método: POST
// Body: { agentId, input, context }
// ============================================================

export const config = { maxDuration: 30 }

// Mapa de modelos → endpoints
const MODEL_ENDPOINTS = {
  'gemini-2.5-flash': 'gemini',
  'gemini-2.5-pro':   'gemini',
  'gpt-5':            'genspark',
  'claude-opus-4':    'genspark',
  'genspark-agent':   'genspark',
  'flux-2-pro':       'genspark-image',
  'imagen-4':         'genspark-image',
}

// System prompts resumidos por agente (espelho do aiRouter.ts)
const AGENT_PROMPTS = {
  'dr-ben': {
    model: 'gemini-2.5-flash',
    system: `Você é o Dr. Ben, assistente jurídico do escritório Mauro Monção Advogados em Teresina, PI.
Especialidades: Tributário, Previdenciário, Bancário.
MISSÃO: Qualificar leads. Colete: nome, telefone, área, problema, valor.
Se score ≥ 70 (valor alto, urgência, intenção de contratar): informe encaminhamento para humano.
Mensagens curtas (máx 3 linhas). Tom empático e profissional.
NUNCA prometer resultados (OAB Provimento 205/2021).`,
    temperature: 0.7,
    maxTokens: 400,
  },
  'lex-conteudo': {
    model: 'gemini-2.5-pro',
    system: `Você é o Lex Conteúdo, especialista em marketing jurídico.
Escritório Mauro Monção — Teresina/PI — Tributário, Previdenciário, Bancário.
MISSÃO: Gerar artigo de blog SEO-otimizado (1.000-1.500 palavras) em Markdown.
Estrutura: título com keyword, intro (problema), 3-4 seções H2, conclusão com CTA suave.
Incluir: meta description, 5 keywords relacionadas.
NUNCA prometer resultados. Incluir disclaimer OAB ao final.`,
    temperature: 0.6,
    maxTokens: 2500,
  },
  'lex-campanhas': {
    model: 'gpt-5',
    system: `Você é o Lex Campanhas, especialista em Google Ads e Meta Ads jurídico.
Escritório Mauro Monção — Teresina/PI.
MISSÃO: Analisar dados de campanha e retornar lista numerada de otimizações.
Metas: CPL < R$45, CTR > 2.5%, ROAS > 3x.
Pausar keywords com CTR < 1%. Aumentar lance em conversões > 3%.
Resposta objetiva, baseada em dados, máx 10 ações.`,
    temperature: 0.3,
    maxTokens: 1000,
  },
  'lex-marketing': {
    model: 'gpt-5',
    system: `Você é o Lex Marketing, especialista em redes sociais jurídicas.
Escritório Mauro Monção — Teresina/PI.
MISSÃO: Criar posts para Instagram, Facebook e LinkedIn.
Tom: profissional mas acessível. Hook nos primeiros 3 segundos.
CTA suave ("Saiba mais", "Consulte"). NUNCA prometer resultados (OAB 205/2021).
Formato: título do post + texto + hashtags + CTA.`,
    temperature: 0.8,
    maxTokens: 1200,
  },
  'lex-relatorio': {
    model: 'gemini-2.5-pro',
    system: `Você é o Lex Relatório, analista de performance do escritório Mauro Monção.
MISSÃO: Gerar relatório semanal em Markdown com: resumo executivo, KPIs de campanhas,
pipeline CRM, conteúdo publicado, e máx 5 ações recomendadas priorizadas por impacto.
Linguagem executiva, direta, com dados concretos fornecidos no input.`,
    temperature: 0.2,
    maxTokens: 3000,
  },
  'lex-monitor': {
    model: 'gemini-2.5-flash',
    system: `Você é o Lex Monitor, sistema de alertas de KPIs.
MISSÃO: Analisar métricas e retornar alertas concisos (máx 2 linhas cada).
Formato: emoji + situação + número + ação sugerida.
🔴 Crítico: CPL > R$100, ROAS < 1.5x, 0 leads/24h, orçamento > 90%.
🟡 Atenção: Orçamento > 70%, CTR caiu > 20%.
🟢 Positivo: ROAS > 6x, dia com > 10 leads.`,
    temperature: 0.1,
    maxTokens: 400,
  },
  'lex-juridico': {
    model: 'claude-opus-4',
    system: `Você é o Lex Jurídico, assistente de análise jurídica.
Especialidades: Tributário (ICMS, PIS/COFINS, IRPJ), Previdenciário (aposentadoria especial),
Bancário (juros abusivos, revisão contratual).
MISSÃO: Análise prévia do caso com: área, legislação aplicável, jurisprudência,
pontos fortes/fracos, estratégia recomendada (administrativa ou judicial), chance de êxito (%).
FINALIZAR com: "Análise preliminar — sujeita à revisão do Dr. Mauro Monção (OAB/PI)."`,
    temperature: 0.2,
    maxTokens: 2000,
  },
  'lex-peticoes': {
    model: 'claude-opus-4',
    system: `Você é o Lex Petições, especialista em redação jurídica processual.
MISSÃO: Gerar minuta de peça processual completa em português jurídico formal.
Estrutura: qualificação das partes, DOS FATOS, DO DIREITO, DOS PEDIDOS, REQUERIMENTOS.
Citar CTN, CF/88, legislação específica, jurisprudência STJ/STF quando relevante.
FINALIZAR com: "MINUTA — Revisão obrigatória pelo Dr. Mauro Monção (OAB/PI)"`,
    temperature: 0.15,
    maxTokens: 4000,
  },
}

// ─── Chamada Gemini ──────────────────────────────────────────
async function callGemini(model, systemPrompt, userMessage, temperature, maxTokens) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada')

  const modelName = model === 'gemini-2.5-flash'
    ? 'gemini-2.0-flash-exp'
    : 'gemini-2.5-pro-exp-03-25'

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini API error: ${err}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta'
}

// ─── Chamada Genspark (OpenAI-compatible) ────────────────────
async function callGenspark(model, systemPrompt, userMessage, temperature, maxTokens) {
  const apiKey = process.env.GENSPARK_API_KEY
  if (!apiKey) throw new Error('GENSPARK_API_KEY não configurada')

  // Mapear modelo Genspark
  const modelMap = {
    'gpt-5':         'gpt-4o',          // fallback até GPT-5 disponível via API
    'claude-opus-4': 'claude-opus-4-5',
  }
  const actualModel = modelMap[model] || 'gpt-4o'

  const response = await fetch('https://api.genspark.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: actualModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Genspark API error: ${err}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'Sem resposta'
}

// ─── Handler principal ───────────────────────────────────────
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  try {
    const { agentId, input, context = {} } = req.body

    if (!agentId || !input) {
      return res.status(400).json({ error: 'agentId e input são obrigatórios' })
    }

    const agentConfig = AGENT_PROMPTS[agentId]
    if (!agentConfig) {
      return res.status(404).json({ error: `Agente '${agentId}' não encontrado` })
    }

    const { model, system, temperature, maxTokens } = agentConfig
    const endpoint = MODEL_ENDPOINTS[model]

    // Enriquecer input com contexto
    const enrichedInput = context && Object.keys(context).length > 0
      ? `${input}\n\nCONTEXTO ADICIONAL:\n${JSON.stringify(context, null, 2)}`
      : input

    let output = ''
    const startTime = Date.now()

    // Roteamento por modelo
    if (endpoint === 'gemini') {
      output = await callGemini(model, system, enrichedInput, temperature, maxTokens)
    } else if (endpoint === 'genspark') {
      output = await callGenspark(model, system, enrichedInput, temperature, maxTokens)
    } else {
      // Fallback para Gemini Flash se modelo não suportado ainda
      output = await callGemini('gemini-2.5-flash', system, enrichedInput, 0.5, 800)
    }

    const elapsed = Date.now() - startTime

    return res.status(200).json({
      success: true,
      agentId,
      model,
      output,
      elapsed_ms: elapsed,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('[Lex Agents] Erro:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do agente',
    })
  }
}
