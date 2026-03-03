// ============================================================
// BEN GROWTH CENTER — Webhook Evolution API
// Rota: POST /api/whatsapp-evolution
// Recebe mensagens da Evolution API (WhatsApp via QR Code)
// e processa com Dr. Ben IA + MARA IA
// ============================================================

export const config = { maxDuration: 30 }

const GEMINI_KEY  = process.env.GEMINI_API_KEY
// VPS Hostinger — Evolution API 24/7
const EVOLUTION_URL    = process.env.EVOLUTION_API_URL   ?? 'http://181.215.135.202:8080'
const EVOLUTION_KEY    = process.env.EVOLUTION_API_KEY   ?? 'BenEvolution2026'
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE ?? 'drben'
const PLANTONISTA = process.env.PLANTONISTA_WHATSAPP ?? '5586999484761'

// ── Config MARA IA (carregada dinamicamente) ────────────────
let _maraConfig = null
async function getMaraConfig() {
  // Cache de 5 minutos
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

// ── Sessões em memória (Supabase em produção) ───────────────
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
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_KEY,
        },
        body: JSON.stringify({
          number: numero,
          text: texto,
        }),
      }
    )
    const data = await res.json()
    console.log('[Evolution] Mensagem enviada:', data)
    return data
  } catch (e) {
    console.error('[Evolution] Erro ao enviar:', e.message)
  }
}

// ── Consultar Dr. Ben IA (Gemini) ───────────────────────────
async function consultarDrBen(historico, novaMensagem) {
  const config = await getMaraConfig()

  const promptBase = config?.promptBase || `Você é o Dr. Ben, assistente jurídico inteligente do escritório Mauro Monção Advogados.
Especialidades: Direito Tributário, Previdenciário e Bancário.
Seja cordial, profissional e objetivo. Responda em português.
Ao final, sempre ofereça agendar uma consulta com o Dr. Mauro.`

  const saudacao = config?.saudacao || 'Olá! Sou o Dr. Ben, assistente jurídico do escritório Mauro Monção Advogados. Como posso te ajudar hoje?'

  if (!GEMINI_KEY) return saudacao

  const prompt = `${promptBase}

Histórico da conversa:
${historico}

Cliente: ${novaMensagem}
Dr. Ben:`

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
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Desculpe, não consegui processar sua mensagem. Tente novamente.'
  } catch (e) {
    console.error('[DrBen] Erro Gemini:', e.message)
    return 'Olá! Sou o Dr. Ben. Tive um problema técnico. Por favor, aguarde um momento.'
  }
}

// ── Notificar plantonista ────────────────────────────────────
async function notificarPlantonista(dados) {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) return
  const msg = `🚨 *LEAD URGENTE — Dr. Ben*\n\n👤 *Nome:* ${dados.nome ?? 'Não informado'}\n📱 *Número:* ${dados.numero}\n💬 *Mensagem:* ${dados.ultima_mensagem}\n\n_Atender em até 30 minutos!_`
  await enviarMensagem(PLANTONISTA, msg)
}

// ── Handler principal ────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, apikey')

  if (req.method === 'OPTIONS') return res.status(200).end()

  // ── GET — verificação do webhook ──────────────────────────
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', service: 'Dr. Ben WhatsApp Evolution' })
  }

  if (req.method !== 'POST') return res.status(405).end()

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    console.log('[Evolution Webhook] Evento recebido:', JSON.stringify(body).slice(0, 200))

    const evento = body?.event ?? body?.type ?? ''

    // ── Evento: mensagem recebida ─────────────────────────
    if (evento === 'messages.upsert' || evento === 'MESSAGES_UPSERT' || body?.data?.message) {
      const msgData = body?.data ?? body
      const fromMe  = msgData?.key?.fromMe ?? msgData?.message?.fromMe ?? false

      // Ignorar mensagens enviadas pelo próprio bot
      if (fromMe) return res.status(200).json({ ok: true })

      const numero  = (msgData?.key?.remoteJid ?? msgData?.from ?? '').replace('@s.whatsapp.net', '')
      const texto   = msgData?.message?.conversation
                   ?? msgData?.message?.extendedTextMessage?.text
                   ?? msgData?.text
                   ?? ''

      if (!numero || !texto) return res.status(200).json({ ok: true })

      console.log(`[Dr. Ben] Mensagem de ${numero}: ${texto}`)

      // Recuperar/criar sessão
      if (!sessoes.has(numero)) {
        sessoes.set(numero, { historico: [], nome: null, etapa: 'inicio' })
      }
      const sessao = sessoes.get(numero)

      // Construir histórico formatado
      const historicoTexto = sessao.historico
        .slice(-6) // últimas 6 mensagens
        .map(m => `${m.role === 'user' ? 'Cliente' : 'Dr. Ben'}: ${m.text}`)
        .join('\n')

      // Consultar Dr. Ben IA
      const resposta = await consultarDrBen(historicoTexto, texto)

      // Salvar na sessão
      sessao.historico.push({ role: 'user', text: texto })
      sessao.historico.push({ role: 'bot', text: resposta })

      // Detectar lead urgente — usa palavras-chave da config MARA IA
      const maraConf = await getMaraConfig()
      const palavrasUrgencia = maraConf?.repassePalavras ?? ['multa','auto de infração','execução fiscal','penhora','urgente','prazo','amanhã']
      const regexUrgencia = new RegExp(palavrasUrgencia.join('|'), 'i')
      const urgente = regexUrgencia.test(texto)
      if (urgente && sessao.historico.length <= 4) {
        await notificarPlantonista({
          numero,
          nome: sessao.nome,
          ultima_mensagem: texto,
        })
      }

      // Enviar resposta
      await enviarMensagem(numero, resposta)

      return res.status(200).json({ ok: true, respondido: true })
    }

    // ── Evento: QR Code gerado ────────────────────────────
    if (evento === 'qrcode.updated' || evento === 'QRCODE_UPDATED') {
      const qrcode = body?.data?.qrcode?.base64 ?? body?.qrcode ?? ''
      console.log('[Evolution] QR Code gerado — tamanho:', qrcode.length)
      // Salvar no Supabase para exibir no painel
      return res.status(200).json({ ok: true, qrcode })
    }

    // ── Evento: conexão estabelecida ──────────────────────
    if (evento === 'connection.update' || evento === 'CONNECTION_UPDATE') {
      const state = body?.data?.state ?? body?.state ?? ''
      console.log('[Evolution] Status conexão:', state)
      return res.status(200).json({ ok: true, state })
    }

    return res.status(200).json({ ok: true })

  } catch (e) {
    console.error('[Evolution Webhook] Erro:', e.message)
    return res.status(200).json({ ok: true }) // sempre 200 para Evolution não retentar
  }
}
