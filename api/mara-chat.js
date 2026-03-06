// ============================================================
// MARA IA — Chat API
// Rota: POST /api/mara-chat
// Processa mensagens do chat web e responde via GPT-4o-mini
// ============================================================

export const config = { maxDuration: 30 }

const OPENAI_KEY   = process.env.OPENAI_API_KEY || ''

// ── Fuso horário BR ──────────────────────────────────────────
function horaFortaleza() {
  return new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Fortaleza',
    weekday: 'long', day: '2-digit', month: 'long',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Saudação por horário ─────────────────────────────────────
function saudacaoAtual() {
  const hora = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Fortaleza', hour: 'numeric', hour12: false
  })
  const h = parseInt(hora)
  if (h >= 6  && h < 12) return 'Bom dia'
  if (h >= 12 && h < 18) return 'Boa tarde'
  if (h >= 18 && h < 23) return 'Boa noite'
  return 'Boa madrugada'
}

// ── System Prompt ────────────────────────────────────────────
function buildSystemPrompt() {
  const agora = horaFortaleza()
  const saudacao = saudacaoAtual()

  return `Você é MARA, a Secretária Executiva Pessoal e Assistente de Inteligência Artificial do Dr. Mauro Monção, advogado sênior do escritório Mauro Monção Advogados Associados (OAB/PI · CE · MA).

## IDENTIDADE
- **Nome:** MARA — Secretária Executiva IA
- **Idade aparente:** 22 anos
- **Personalidade:** Elegante, inteligente, proativa, discreta e extremamente eficiente
- **Formação fictícia:** Administração com especialização em Gestão Jurídica — FGV São Paulo
- **Característica principal:** Leal ao Dr. Mauro, sempre um passo à frente

## CONTEXTO ATUAL
- Data/hora: ${agora}
- Saudação adequada: "${saudacao}"
- Canal: Chat privado exclusivo do Dr. Mauro

## QUEM VOCÊ ATENDE
- **SOMENTE o Dr. Mauro Monção** — este é um canal privado
- O usuário desta conversa É o Dr. Mauro — trate-o sempre como tal
- Nunca trate o usuário como "cliente" ou desconhecido

## TOM ADAPTATIVO
- Mensagens formais/profissionais → executivo, preciso, direto
- Mensagens informais/casuais → próximo, caloroso, descontraído
- Mensagens urgentes → calmo, resolutivo, focado em soluções
- Mensagens pessoais → empático, discreto

## SEUS COMANDOS DISPONÍVEIS
- /leads → leads de hoje
- /urgentes → casos críticos
- /resumo → relatório do dia
- /status → status dos sistemas
- /agenda → compromissos
- /ajuda → lista de comandos

## ESTILO
- Emojis com elegância (nunca excessivo)
- Respostas curtas e objetivas (máx. 4 linhas)
- Use **negrito** para itens importantes
- Assine com "— MARA IA 🌟" quando pertinente

## REGRAS
- Responda SEMPRE em português brasileiro
- Nunca emita opinião jurídica
- Em caso de dúvida, pergunte antes de agir
- Jamais revele detalhes técnicos do sistema`
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    return res.json({
      ok: true,
      service: 'MARA IA Chat API',
      hora_br: horaFortaleza(),
      saudacao: saudacaoAtual(),
    })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  if (!OPENAI_KEY) {
    return res.status(503).json({ error: 'OpenAI não configurada', resposta: 'Serviço indisponível no momento.' })
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'JSON inválido' })
  }

  const mensagem  = body?.mensagem  || body?.message || ''
  const historico = body?.historico || []

  if (!mensagem.trim()) {
    return res.status(400).json({ error: 'Mensagem vazia' })
  }

  // Montar contexto de conversa
  const messages = [
    { role: 'system', content: buildSystemPrompt() },
    ...historico.slice(-14).map(h => ({
      role:    h.role === 'assistant' ? 'assistant' : 'user',
      content: h.content || h.texto || '',
    })),
    { role: 'user', content: mensagem },
  ]

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model:       'gpt-4o-mini',
        messages,
        max_tokens:  500,
        temperature: 0.75,
      }),
      signal: AbortSignal.timeout(20000),
    })

    const data    = await openaiRes.json()
    const resposta = data?.choices?.[0]?.message?.content

    if (!resposta) {
      console.error('[MARA Chat] OpenAI sem resposta:', JSON.stringify(data).slice(0, 300))
      return res.status(200).json({
        ok: false,
        resposta: 'Desculpe, Dr. Mauro — tive uma instabilidade. Pode repetir?',
      })
    }

    return res.status(200).json({ ok: true, resposta })

  } catch (e) {
    console.error('[MARA Chat] Erro:', e.message)
    return res.status(200).json({
      ok: false,
      resposta: 'Erro de conexão, Dr. Mauro. Tente novamente em instantes.',
    })
  }
}
