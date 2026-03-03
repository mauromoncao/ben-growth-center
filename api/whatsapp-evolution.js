// ============================================================
// BEN GROWTH CENTER — Webhook Evolution API
// Rota: POST /api/whatsapp-evolution
//
// DR. BEN   = Assistente Jurídico — atende os CLIENTES
// MARA IA   = Assistente Pessoal  — avisa o DR. MAURO
//
// Fluxo:
//   Cliente → Dr. Ben (triagem jurídica)
//   Dr. Ben → MARA IA avisa Dr. Mauro com resumo do lead
// ============================================================

export const config = { maxDuration: 30 }

const GEMINI_KEY         = process.env.GEMINI_API_KEY
const EVOLUTION_URL      = process.env.EVOLUTION_API_URL   ?? 'http://181.215.135.202:8080'
const EVOLUTION_KEY      = process.env.EVOLUTION_API_KEY   ?? 'BenEvolution2026'
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE  ?? 'drben'
// Número do DR. MAURO — a MARA IA avisa aqui
const DR_MAURO_WHATSAPP  = process.env.PLANTONISTA_WHATSAPP ?? '5586999484761'

// ── Config MARA IA (carregada dinamicamente) ────────────────
let _maraConfig = null
async function getMaraConfig() {
  if (_maraConfig && _maraConfig._cachedAt && (Date.now() - _maraConfig._cachedAt < 300000)) {
    return _maraConfig
  }
  try {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://ben-growth-center.vercel.app'
    const r = await fetch(`${base}/api/mara-config`)
    if (r.ok) {
      const d = await r.json()
      _maraConfig = { ...d.config, _cachedAt: Date.now() }
      return _maraConfig
    }
  } catch {}
  return null
}

// ── Sessões em memória ──────────────────────────────────────
const sessoes = new Map()

// ── Enviar mensagem via Evolution API ───────────────────────
async function enviarMensagem(numero, texto) {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) {
    console.log('[Evolution] ENV não configurada — simulando envio para', numero)
    return
  }
  try {
    const res = await fetch(
      `${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
        body: JSON.stringify({ number: numero, text: texto }),
      }
    )
    const data = await res.json()
    console.log('[Evolution] Mensagem enviada:', data)
    return data
  } catch (e) {
    console.error('[Evolution] Erro ao enviar:', e.message)
  }
}

// ── DR. BEN — Assistente Jurídico dos clientes ──────────────
async function consultarDrBen(historico, novaMensagem) {
  const maraConfig = await getMaraConfig()

  const promptBase = maraConfig?.promptBase ||
    `Você é o Dr. Ben, assistente jurídico do escritório Mauro Monção Advogados.
Especialidades: Direito Tributário, Previdenciário e Bancário.
Localização: Teresina, Piauí — Brasil.
Advogado responsável: Dr. Mauro Monção (OAB/PI).

REGRAS:
- Seja cordial, profissional e objetivo
- Responda em português do Brasil
- Nunca forneça pareceres jurídicos definitivos — indique a necessidade de consulta
- Ao final de cada resposta, ofereça agendar uma consulta com o Dr. Mauro
- Limite respostas a 3 parágrafos curtos para melhor leitura no WhatsApp`

  const saudacaoPadrao = maraConfig?.saudacao ||
    'Olá! Sou o Dr. Ben, assistente jurídico do escritório Mauro Monção Advogados. Como posso te ajudar hoje?'

  if (!GEMINI_KEY) return { resposta: saudacaoPadrao }

  const prompt =
    `${promptBase}\n\nHistórico da conversa:\n${historico}\n\nCliente: ${novaMensagem}\nDr. Ben:`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
        }),
      }
    )
    const data = await res.json()
    const resposta = data?.candidates?.[0]?.content?.parts?.[0]?.text
      ?? 'Desculpe, não consegui processar sua mensagem. Tente novamente.'
    return { resposta }
  } catch (e) {
    console.error('[Dr. Ben] Erro Gemini:', e.message)
    return { resposta: 'Olá! Sou o Dr. Ben. Tive um problema técnico momentâneo. Por favor, aguarde.' }
  }
}

// ── DR. BEN — Triagem do lead após coletar dados ────────────
async function fazerTriagem(historico) {
  if (!GEMINI_KEY) return null

  const prompt =
    `Você é o Dr. Ben, assistente jurídico. Analise esta conversa e faça a triagem do lead para o Dr. Mauro Monção.

Conversa:
${historico}

Responda APENAS um JSON válido, sem markdown:
{
  "nome": "nome do cliente ou null",
  "area": "tributario|previdenciario|bancario|trabalhista|civil|outro",
  "resumo": "resumo do problema em 1 frase objetiva",
  "urgencia": "alta|media|baixa",
  "observacao": "detalhes importantes para o Dr. Mauro"
}`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 300, temperature: 0.1 },
        }),
      }
    )
    const data = await res.json()
    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const match = texto.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
  } catch (e) {
    console.error('[Dr. Ben Triagem] Erro:', e.message)
  }
  return null
}

// ── MARA IA — Avisa o Dr. Mauro após triagem do Dr. Ben ─────
async function maraAvisarDrMauro(dados) {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) return

  const urgenciaEmoji = { alta: '🔴', media: '🟡', baixa: '🟢' }[dados.urgencia] ?? '🟡'
  const areaLabel = {
    tributario:    '🧾 Tributário',
    previdenciario:'👴 Previdenciário',
    bancario:      '🏦 Bancário',
    trabalhista:   '👷 Trabalhista',
    civil:         '⚖️ Cível',
    outro:         '📋 Outro',
  }[dados.area] ?? dados.area

  const hora = new Date().toLocaleTimeString('pt-BR', {
    timeZone: 'America/Fortaleza',
    hour: '2-digit', minute: '2-digit',
  })

  const msg =
    `🤖 *MARA IA — Novo lead qualificado!*\n` +
    `_Dr. Ben concluiu a triagem às ${hora}_\n\n` +
    `👤 *Cliente:* ${dados.nome ?? 'Não informado'}\n` +
    `📱 *Número:* +${dados.numero}\n` +
    `${areaLabel}\n` +
    `${urgenciaEmoji} *Urgência:* ${(dados.urgencia ?? 'media').toUpperCase()}\n` +
    `💬 *Resumo:* ${dados.resumo ?? dados.ultimaMensagem}\n` +
    (dados.observacao ? `📝 *Obs:* ${dados.observacao}\n` : '') +
    `\n_Toque no número para assumir o atendimento._`

  await enviarMensagem(DR_MAURO_WHATSAPP, msg)
  console.log(`[MARA IA] Dr. Mauro avisado sobre lead: ${dados.numero}`)
}

// ── Handler principal ────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, apikey')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      service: 'Dr. Ben (Assistente Jurídico) + MARA IA (Assistente Pessoal)',
    })
  }

  if (req.method !== 'POST') return res.status(405).end()

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    console.log('[Webhook] Evento:', JSON.stringify(body).slice(0, 200))

    const evento = body?.event ?? body?.type ?? ''

    // ── Mensagem recebida de cliente ──────────────────────
    if (evento === 'messages.upsert' || evento === 'MESSAGES_UPSERT' || body?.data?.message) {
      const msgData = body?.data ?? body
      const fromMe  = msgData?.key?.fromMe ?? msgData?.message?.fromMe ?? false

      // Ignorar mensagens do próprio bot
      if (fromMe) return res.status(200).json({ ok: true })

      const numero = (msgData?.key?.remoteJid ?? msgData?.from ?? '').replace('@s.whatsapp.net', '')
      const texto  = msgData?.message?.conversation
                  ?? msgData?.message?.extendedTextMessage?.text
                  ?? msgData?.text
                  ?? ''

      if (!numero || !texto) return res.status(200).json({ ok: true })

      console.log(`[Dr. Ben] Mensagem de ${numero}: "${texto}"`)

      // Criar/recuperar sessão do cliente
      if (!sessoes.has(numero)) {
        sessoes.set(numero, { historico: [], nome: null, triagemFeita: false })
      }
      const sessao = sessoes.get(numero)

      // Histórico formatado para contexto
      const historicoTexto = sessao.historico
        .slice(-6)
        .map(m => `${m.role === 'user' ? 'Cliente' : 'Dr. Ben'}: ${m.text}`)
        .join('\n')

      // ── Dr. Ben responde ao cliente ───────────────────────
      const { resposta } = await consultarDrBen(historicoTexto, texto)

      sessao.historico.push({ role: 'user', text: texto })
      sessao.historico.push({ role: 'bot',  text: resposta })

      // ── Após 3ª mensagem: Dr. Ben faz triagem ────────────
      // MARA IA avisa o Dr. Mauro com o resumo completo
      const maraConfig = await getMaraConfig()
      const msgParaTriagem = maraConfig?.mensagensParaTriagem ?? 3
      const totalMsgCliente = sessao.historico.filter(m => m.role === 'user').length

      if (totalMsgCliente >= msgParaTriagem && !sessao.triagemFeita) {
        sessao.triagemFeita = true

        const historicoCompleto = sessao.historico
          .map(m => `${m.role === 'user' ? 'Cliente' : 'Dr. Ben'}: ${m.text}`)
          .join('\n')

        // Triagem + aviso MARA IA em paralelo (não bloqueia resposta ao cliente)
        fazerTriagem(historicoCompleto).then(triagem => {
          maraAvisarDrMauro({
            numero,
            nome:          triagem?.nome       ?? null,
            area:          triagem?.area        ?? 'outro',
            urgencia:      triagem?.urgencia    ?? 'media',
            resumo:        triagem?.resumo      ?? texto,
            observacao:    triagem?.observacao  ?? null,
            ultimaMensagem: texto,
          })
        }).catch(e => console.error('[MARA IA] Erro ao avisar Dr. Mauro:', e))

        console.log(`[Dr. Ben] Triagem concluída após ${totalMsgCliente} msgs — MARA IA notificando Dr. Mauro`)
      }

      // ── Dr. Ben envia resposta ao cliente ─────────────────
      await enviarMensagem(numero, resposta)

      return res.status(200).json({ ok: true, respondido: true })
    }

    // ── QR Code atualizado ────────────────────────────────
    if (evento === 'qrcode.updated' || evento === 'QRCODE_UPDATED') {
      const qrcode = body?.data?.qrcode?.base64 ?? body?.qrcode ?? ''
      console.log('[Evolution] QR Code gerado')
      return res.status(200).json({ ok: true, qrcode })
    }

    // ── Status da conexão ─────────────────────────────────
    if (evento === 'connection.update' || evento === 'CONNECTION_UPDATE') {
      const state = body?.data?.state ?? body?.state ?? ''
      console.log('[Evolution] Conexão:', state)
      return res.status(200).json({ ok: true, state })
    }

    return res.status(200).json({ ok: true })

  } catch (e) {
    console.error('[Webhook] Erro:', e.message)
    return res.status(200).json({ ok: true }) // sempre 200 para Evolution não retentar
  }
}
