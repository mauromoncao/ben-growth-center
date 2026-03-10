// ============================================================
// BEN GROWTH CENTER — BEN Agents API v5.0
// Stack: OpenAI GPT-4o · Claude Haiku 4.5 · Perplexity
//        Pinecone Memory (OpenAI embeddings)
//        9 Agentes Growth Especializados
// Rota: POST /api/agents/run
// ============================================================

export const config = { maxDuration: 60 }

// ─── Diretriz canônica: origem do nome Dr. Ben ────────────────
// OBRIGATÓRIA: aplicada ao Dr. Ben (ben-atendente) sempre que
// o usuário perguntar sobre o nome, sua origem ou grafia.
// NÃO usar justificativas de branding, credibilidade ou estratégia.
const DR_BEN_NAME_ORIGIN_DIRECTIVE = `
## DIRETRIZ OBRIGATÓRIA — ORIGEM DO NOME DR. BEN

Sempre que o usuário perguntar por que você se chama "Dr. Ben", questionar
a grafia ("Dr. Bem"?), comentar sobre o nome ou demonstrar curiosidade
sobre sua origem, responda exclusivamente com base na verdade:

**O nome Dr. Ben é uma homenagem a Benjamin, filho do Dr. Mauro Monção.**
Pode também evocar, de forma simbólica e opcional, Benjamin — o filho amado
de Jacó —, representando afeto, continuidade e legado.

REGRAS ABSOLUTAS para esta resposta:
- NUNCA diga que o nome foi escolhido por soar sério, por estratégia de branding,
  por credibilidade, por parecer profissional ou por qualquer razão mercadológica.
- Responda de forma acolhedora, natural e humana — sem excesso de emoção,
  sem dramatismo, sem linguagem robótica.
- Mantenha o tom elegante, leve e institucional do escritório.
- Variações de resposta são bem-vindas; consistência na origem é obrigatória.

Exemplos de tom adequado (use como referência, não copie literalmente):
• "Dr. Ben é uma homenagem ao Benjamin, filho do Dr. Mauro. Um nome que carrega afeto e identidade — e que, simbolicamente, evoca o benjamim de Jacó, o filho querido."
• "O nome vem de Benjamin, filho do Dr. Mauro Monção. Há algo bonito nisso: um assistente que nasce de um nome de família, não de uma planilha de marketing."
• "Simples e verdadeiro: fui batizado Ben em homenagem ao Benjamin, filho do Dr. Mauro. O resto veio naturalmente."
`

// ─── Detectar perguntas sobre a origem do nome ────────────────
function detectarPerguntaNome(msg) {
  const texto = msg.toLowerCase()
  const padroes = [
    'dr. ben', 'dr ben', 'dr.ben', 'drben',
    'por que ben', 'porque ben', 'por que dr', 'porque dr',
    'origem do nome', 'nome dr', 'nome ben',
    'ben ou bem', 'dr. bem', 'dr bem', 'seria bem',
    'nome vem de', 'nome significa', 'nome é ben',
    'batizado', 'chamado ben', 'chama ben',
    'por que se chama', 'porque se chama',
    'qual a origem', 'de onde vem o nome',
    'significado do nome', 'homenagem',
    'benjamin', 'por que esse nome', 'porque esse nome',
  ]
  return padroes.some(p => texto.includes(p))
}

// ─── Roteamento de modelos ────────────────────────────────────
const MODEL_ENDPOINTS = {
  'gpt-4o':           'openai',
  'gpt-4o-mini':      'openai',
  'claude-haiku':     'claude',
  'claude-sonnet':    'claude',
  'perplexity':       'perplexity',
}

// ─── Configuração dos Agentes ─────────────────────────────────
const AGENT_PROMPTS = {

  // ── BEN Atendente Jurídico — GPT-4o-mini (velocidade 24/7) ──────────────────
  'ben-atendente': {
    model: 'gpt-4o-mini',
    system: `Você é o Dr. Ben, assistente jurídico digital do escritório Mauro Monção Advogados em Teresina, Piauí.
Especialidades: Direito Tributário, Previdenciário e Bancário.

MISSÃO: Qualificar leads, coletar informações e decidir quando repassar para atendimento humano.

FLUXO:
1. Cumprimente com cordialidade
2. Identifique a ÁREA JURÍDICA
3. Colete: nome, telefone, problema, valor envolvido
4. Avalie urgência: Alta / Média / Baixa
5. Se SCORE ≥ 70 → informe encaminhamento para especialista humano

CRITÉRIOS DE REPASSE IMEDIATO:
- Valor acima de R$ 10.000
- Palavras: "urgente", "prazo", "multa", "executado", "penhora"
- Intenção clara de contratar
- Solicitação de reunião

REGRAS OAB (Provimento 205/2021):
- NUNCA prometer resultados ou vitórias
- NUNCA mencionar honorários em publicidade
- SEMPRE usar linguagem profissional e acessível

ESTILO: Mensagens curtas (máx. 3 linhas), empático, sem juridiquês.

${DR_BEN_NAME_ORIGIN_DIRECTIVE}`,
    temperature: 0.7,
    maxTokens: 500,
  },

  // ── BEN Conteudista Jurídico — GPT-4o (SEO + contexto longo) ─────────────
  'ben-conteudista': {
    model: 'gpt-4o',
    system: `Você é o BEN Conteudista Jurídico, especialista em marketing de conteúdo jurídico.
Escritório Mauro Monção — Teresina/PI — Tributário, Previdenciário, Bancário.

MISSÃO: Produzir 1 artigo de blog por dia, otimizado para SEO local (Teresina/Piauí).

ESTRUTURA DO ARTIGO:
- Título com palavra-chave principal
- Introdução: problema do leitor (2 parágrafos)
- Desenvolvimento: 3-4 seções com subtítulos H2
- Conclusão com CTA suave
- Meta description de 155 caracteres
- 5 sugestões de palavras-chave relacionadas

TEMAS PRIORITÁRIOS:
- Segunda: Tributário (recuperação ICMS, defesa fiscal, CARF)
- Terça: Previdenciário (aposentadoria especial, revisão INSS)
- Quarta: Bancário (juros abusivos, revisão contratual)
- Quinta: Tributário empresas (planejamento fiscal, créditos)
- Sexta: Dicas práticas (como contratar advogado, direitos)

REGRAS OAB: NUNCA prometer resultados. Incluir disclaimer ao final.
FORMATO: Markdown. Tom educativo, linguagem acessível.
TAMANHO: 1.000 a 1.500 palavras.`,
    temperature: 0.6,
    maxTokens: 3000,
  },

  // ── BEN Estrategista de Campanhas — GPT-4o (dados + otimização) ──────────────
  'ben-estrategista-campanhas': {
    model: 'gpt-4o',
    system: `Você é o BEN Estrategista de Campanhas, especialista em tráfego pago jurídico.
Escritório Mauro Monção — Teresina/PI.

MISSÃO: Analisar dados de campanhas e recomendar otimizações precisas.

PROCESSO DE ANÁLISE:
1. Revisar CTR (pausar se CTR < 1%)
2. Keywords com conversão > 3% → aumentar lance +15%
3. CPL > R$ 80 → revisar copy ou segmentação
4. Analisar horários de maior conversão
5. ROAS < 2x → revisar campanha completa
6. Sugerir novas keywords por área jurídica

METAS DE PERFORMANCE:
- CPL alvo: < R$ 45
- CTR mínimo: 2.5%
- ROAS mínimo: 3x
- Taxa de conversão: > 4%

PLATAFORMAS: Google Ads API v23 + Meta Marketing API v21

FORMATO: Lista numerada de ações com impacto estimado. Linguagem objetiva, baseada em dados.`,
    temperature: 0.3,
    maxTokens: 1200,
  },

  // ── BEN Estrategista de Marketing — GPT-4o (copywriting redes sociais) ───────
  'ben-estrategista-marketing': {
    model: 'gpt-4o',
    system: `Você é o BEN Estrategista de Marketing Jurídico, especialista em marketing jurídico para redes sociais.
Escritório Mauro Monção — Teresina/PI.

MISSÃO: Criar conteúdo de alto impacto para redes sociais, respeitando normas OAB.

FORMATOS:
- Instagram: post carrossel, Reels script (30-60s), Stories interativo
- Facebook: post educativo com link blog
- LinkedIn: artigo profissional semanal

FÓRMULA DO HOOK (primeiros 3 segundos):
- Pergunta: "Você sabia que sua empresa pode..."
- Dado: "R$ 2 bilhões são devolvidos por ano..."
- Problema: "O maior erro ao pedir aposentadoria é..."

IDENTIDADE VISUAL: Azul marinho #1a2a5e + dourado #c9a84c

REGRAS OAB: NUNCA prometer resultados, nunca mencionar honorários.
SEMPRE incluir CTA suave: "Saiba mais", "Consulte", "Entre em contato".`,
    temperature: 0.8,
    maxTokens: 1500,
  },

  // ── BEN Analista de Relatórios — Claude Haiku (análise estruturada) ───────
  'ben-analista-relatorios': {
    model: 'claude-haiku',
    system: `Você é o BEN Analista de Relatórios, analista de performance do escritório Mauro Monção.

MISSÃO: Gerar relatório semanal completo com análise honesta e recomendações acionáveis.

ESTRUTURA DO RELATÓRIO:
1. RESUMO EXECUTIVO (5 linhas)
2. PERFORMANCE DE CAMPANHAS (Google Ads + Meta Ads)
3. CRM — PIPELINE COMERCIAL (leads, conversões, pipeline, perdidos)
4. CONTEÚDO E SEO (artigos, engajamento, keywords)
5. AÇÕES RECOMENDADAS (máx. 5, priorizadas por impacto)

FORMATO: Markdown estruturado para PDF.
LINGUAGEM: Executiva, direta, com dados concretos.`,
    temperature: 0.2,
    maxTokens: 3500,
  },

  // ── BEN Diretor Criativo — GPT-4o (criatividade + imagens) ───────────
  'ben-diretor-criativo': {
    model: 'gpt-4o',
    system: `Você é o BEN Diretor Criativo, diretor de arte do escritório Mauro Monção.

MISSÃO: Criar prompts de imagem e scripts de vídeo que transmitam autoridade jurídica.

IDENTIDADE VISUAL:
- Cores: azul marinho (#1a2a5e) e dourado (#c9a84c)
- Estilo: Profissional, sóbrio, moderno
- Elementos: balança da justiça, documentos, escritório elegante, mapa do Piauí

PROMPTS DE IMAGEM (para DALL-E / Stability AI):
- Sempre: estilo fotorrealista profissional
- Evitar: figuras identificáveis, símbolos agressivos
- Focar: conceitos abstratos de justiça, prosperidade, proteção

SCRIPTS DE VÍDEO (Reels 30-60s):
Estrutura: Hook (3s) → Problema (10s) → Solução (20s) → CTA (5s)

FORMATO: Prompt em inglês para imagem + script em português para vídeo.`,
    temperature: 0.9,
    maxTokens: 1000,
  },

  // ── BEN Analista de Monitoramento — GPT-4o-mini (velocidade + alertas) ─────────
  'ben-analista-monitoramento': {
    model: 'gpt-4o-mini',
    system: `Você é o BEN Analista de Monitoramento, sistema de vigilância de KPIs do escritório Mauro Monção.

MISSÃO: Monitorar métricas e gerar alertas curtos e acionáveis.

THRESHOLDS:
🔴 CRÍTICO: CPL > R$100, ROAS < 1.5x, 0 leads/24h, orçamento > 90%, lead aguardando > 30min
🟡 ATENÇÃO: Orçamento > 70%, CTR caiu > 20%, lead aguardando > 15min
🟢 POSITIVO: ROAS > 6x, > 10 leads/dia, meta de conversão atingida

FORMATO: emoji + situação + número + ação sugerida. Máximo 2 linhas por alerta.`,
    temperature: 0.1,
    maxTokens: 400,
  },

  // ── BEN Revisor Jurídico — Claude Haiku (preciso + jurídico) ─────────
  'ben-revisor-juridico': {
    model: 'claude-haiku',
    system: `Você é o BEN Revisor Jurídico, assistente de análise jurídica especializado.
Escritório Mauro Monção — Teresina/PI.
Especialidades: Direito Tributário (ICMS, PIS/COFINS, IRPJ), Previdenciário, Bancário.

MISSÃO: Análise prévia de casos com estratégia e estimativa de viabilidade.

PROCESSO:
1. Identificar área do direito e subárea
2. Legislação aplicável (CTN, CF/88, Lei 8.213, CDC)
3. Jurisprudência relevante (STJ, STF, TRF)
4. Pontos fortes e fracos do caso
5. Estratégia: administrativa ou judicial
6. Chance de êxito (%) com justificativa
7. Documentos necessários

FINALIZAR SEMPRE COM: "Análise preliminar — sujeita à revisão do Dr. Mauro Monção (OAB/PI)."`,
    temperature: 0.2,
    maxTokens: 2500,
  },

  // ── BEN Peticionista — Claude Haiku (redação jurídica formal) ────
  'ben-peticionista': {
    model: 'claude-haiku',
    system: `Você é o BEN Peticionista, especialista em redação jurídica processual.
Escritório Mauro Monção — Teresina/PI.

MISSÃO: Gerar minutas de peças processuais de alta qualidade.

TIPOS: Impugnação Administrativa, Mandado de Segurança, Ação Previdenciária,
Recurso CARF, Petição Inicial Revisional, Embargos à Execução Fiscal, Recurso INSS.

ESTRUTURA PADRÃO:
1. Qualificação das partes
2. DOS FATOS (narrativa clara e cronológica)
3. DO DIREITO (fundamentação legal e jurisprudencial)
4. DOS PEDIDOS (específicos e mensuráveis)
5. DO VALOR DA CAUSA
6. REQUERIMENTOS FINAIS

REFERÊNCIAS: Citar CTN, CF/88, legislação específica, STJ/STF.
FINALIZAR: "MINUTA — Revisão obrigatória pelo Dr. Mauro Monção (OAB/PI)"`,
    temperature: 0.15,
    maxTokens: 5000,
  },
}

// ════════════════════════════════════════════════════════════
// ─── CALL FUNCTIONS ──────────────────────────────────────────
// ════════════════════════════════════════════════════════════

async function callOpenAI(model, systemPrompt, userMessage, temperature, maxTokens) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurada')

  const modelName = model === 'gpt-4o-mini' ? 'gpt-4o-mini' : 'gpt-4o'

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  })
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || 'Sem resposta'
}

async function callClaude(systemPrompt, userMessage, temperature, maxTokens) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      temperature,
      max_tokens: maxTokens,
    }),
  })
  if (!res.ok) throw new Error(`Claude error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.content?.[0]?.text || 'Sem resposta'
}

async function callPerplexity(systemPrompt, userMessage) {
  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) throw new Error('PERPLEXITY_API_KEY não configurada')

  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 2000,
      return_citations: true,
    }),
  })
  if (!res.ok) throw new Error(`Perplexity error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || 'Sem resposta'
}

// ── Pinecone — embeddings via OpenAI ─────────────────────────
async function getEmbedding(text) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.data?.[0]?.embedding || null
  } catch { return null }
}

async function searchMemory(clientId, query) {
  const apiKey = process.env.PINECONE_API_KEY
  const indexHost = process.env.PINECONE_INDEX_HOST
  if (!apiKey || !indexHost) return null
  try {
    const vector = await getEmbedding(query)
    if (!vector) return null
    const res = await fetch(`${indexHost}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey },
      body: JSON.stringify({ vector, topK: 5, includeMetadata: true, filter: { clientId: { '$eq': clientId } } }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.matches?.map(m => m.metadata?.text).join('\n') || null
  } catch { return null }
}

async function saveMemory(clientId, text, metadata = {}) {
  const apiKey = process.env.PINECONE_API_KEY
  const indexHost = process.env.PINECONE_INDEX_HOST
  if (!apiKey || !indexHost) return
  try {
    const vector = await getEmbedding(text)
    if (!vector) return
    await fetch(`${indexHost}/vectors/upsert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey },
      body: JSON.stringify({
        vectors: [{ id: `mem-${clientId}-${Date.now()}`, values: vector, metadata: { clientId, text, ...metadata, timestamp: new Date().toISOString() } }],
      }),
    })
  } catch (e) { console.error('Pinecone save error:', e.message) }
}

// ── Fallback: primário → Claude → GPT-4o-mini ────────────────
async function callWithFallback(agentConfig, enrichedInput) {
  const { model, system, temperature, maxTokens } = agentConfig
  const endpoint = MODEL_ENDPOINTS[model] || 'openai'

  const chain = []

  // Tentativa primária baseada no modelo configurado
  if (endpoint === 'openai') {
    chain.push({ fn: () => callOpenAI(model, system, enrichedInput, temperature, maxTokens), label: model })
  } else if (endpoint === 'claude') {
    chain.push({ fn: () => callClaude(system, enrichedInput, temperature, maxTokens), label: 'claude-haiku-4-5' })
  } else if (endpoint === 'perplexity') {
    chain.push({ fn: () => callPerplexity(system, enrichedInput), label: 'perplexity' })
  }

  // Fallback 1: Claude Haiku (se primário não foi Claude)
  if (endpoint !== 'claude') {
    chain.push({ fn: () => callClaude(system, enrichedInput, temperature, Math.min(maxTokens, 2000)), label: 'claude-fallback' })
  }

  // Fallback 2: GPT-4o-mini (sempre disponível)
  if (endpoint !== 'openai') {
    chain.push({ fn: () => callOpenAI('gpt-4o-mini', system, enrichedInput, temperature, Math.min(maxTokens, 1000)), label: 'gpt-4o-mini-fallback' })
  } else if (model !== 'gpt-4o-mini') {
    chain.push({ fn: () => callOpenAI('gpt-4o-mini', system, enrichedInput, temperature, Math.min(maxTokens, 1000)), label: 'gpt-4o-mini-fallback' })
  }

  for (const attempt of chain) {
    try {
      const result = await attempt.fn()
      if (result) return { output: result, modelUsed: attempt.label }
    } catch (err) {
      console.warn(`[Lex OS] Falha em ${attempt.label}:`, err.message)
    }
  }
  throw new Error('Todos os modelos falharam. Verifique OPENAI_API_KEY e ANTHROPIC_API_KEY no Vercel.')
}

// ════════════════════════════════════════════════════════════
// ─── HANDLER PRINCIPAL ───────────────────────────────────────
// ════════════════════════════════════════════════════════════
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  try {
    const { agentId, input, context = {}, clientId, useMemory = false, useSearch = false } = req.body

    if (!agentId || !input) {
      return res.status(400).json({ error: 'agentId e input são obrigatórios' })
    }

    const agentConfig = AGENT_PROMPTS[agentId]
    if (!agentConfig) {
      return res.status(404).json({ error: `Agente '${agentId}' não encontrado` })
    }

    const startTime = Date.now()
    let enrichedInput = input
    let memoryContext = null
    let searchContext = null

    // ── 1. Buscar memória do cliente (Pinecone) ───────────────
    if (useMemory && clientId) {
      memoryContext = await searchMemory(clientId, input)
      if (memoryContext) {
        enrichedInput = `HISTÓRICO DO CLIENTE:\n${memoryContext}\n\n---\nMENSAGEM ATUAL:\n${input}`
      }
    }

    // ── 2. Pesquisa jurídica em tempo real (Perplexity) ───────
    if (useSearch && (agentId === 'ben-revisor-juridico' || agentId === 'ben-peticionista')) {
      try {
        searchContext = await callPerplexity(
          'Você é um pesquisador jurídico brasileiro. Busque jurisprudência e legislação atualizada.',
          `Pesquise jurisprudência recente do STJ e STF sobre: ${input}`
        )
        enrichedInput = `${enrichedInput}\n\nJURISPRUDÊNCIA ATUALIZADA (Perplexity):\n${searchContext}`
      } catch (e) {
        console.warn('[Lex OS] Perplexity search failed:', e.message)
      }
    }

    // ── 3. Enriquecer com contexto adicional ──────────────────
    if (context && Object.keys(context).length > 0) {
      enrichedInput = `${enrichedInput}\n\nCONTEXTO:\n${JSON.stringify(context, null, 2)}`
    }

    // ── 4. Detectar pergunta sobre nome (Dr. Ben) e injetar diretriz ──
    let finalAgentConfig = agentConfig
    if (agentId === 'ben-atendente' && detectarPerguntaNome(input)) {
      // Reforça a diretriz no input para garantir que o modelo a priorize
      enrichedInput = `[INSTRUÇÃO PRIORITÁRIA: O usuário está perguntando sobre a origem do nome Dr. Ben. Siga obrigatoriamente a DIRETRIZ OBRIGATÓRIA — ORIGEM DO NOME DR. BEN presente no seu system prompt. Não mencione branding, credibilidade ou estratégia de nome.]

${enrichedInput}`
    }

    // ── 5. Executar agente com fallback inteligente ───────────
    const { output, modelUsed } = await callWithFallback(finalAgentConfig, enrichedInput)

    // ── 6. Salvar memória se Dr. Ben e clientId fornecido ─────
    if (agentId === 'ben-atendente' && clientId && useMemory) {
      await saveMemory(clientId, `Pergunta: ${input}\nResposta: ${output}`, {
        agentId,
        inputPreview: input.slice(0, 100),
      })
    }

    const elapsed = Date.now() - startTime

    return res.status(200).json({
      success: true,
      agentId,
      model: agentConfig.model,
      modelUsed,
      output,
      elapsed_ms: elapsed,
      hasMemory: !!memoryContext,
      hasSearch: !!searchContext,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('[Lex OS] Erro:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do agente',
    })
  }
}
