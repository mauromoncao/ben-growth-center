// ============================================================
// BEN GROWTH CENTER — Webhook Twilio WhatsApp
// Rota: POST /api/whatsapp-twilio  → mensagens recebidas
//
// DR. BEN  = Assistente Jurídico — atende CLIENTES via WhatsApp
// MARA IA  = Assistente Pessoal  — avisa DR. MAURO após triagem
//
// MODEL: gpt-4o-mini (OpenAI)
// ============================================================

export const config = { maxDuration: 30 }

// ── Variáveis de ambiente ────────────────────────────────────
const OPENAI_KEY        = process.env.OPENAI_API_KEY       || ''
const TWILIO_SID        = process.env.TWILIO_ACCOUNT_SID   || ''
const TWILIO_TOKEN      = process.env.TWILIO_AUTH_TOKEN    || ''
const TWILIO_NUMBER     = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'
const DR_MAURO_WHATSAPP = process.env.PLANTONISTA_WHATSAPP  || ''
const VPS_LEADS_URL     = process.env.VPS_LEADS_URL         || 'http://181.215.135.202:3001'

function getBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'https://ben-growth-center.vercel.app'
}

// ── Enviar mensagem via Twilio ───────────────────────────────
async function enviarMensagem(numero, texto) {
  if (!TWILIO_SID || !TWILIO_TOKEN) {
    console.error('[Twilio] Credenciais não configuradas')
    return
  }

  // Garantir formato whatsapp:+55...
  const para = numero.startsWith('whatsapp:') ? numero : `whatsapp:${numero.startsWith('+') ? numero : '+' + numero}`

  try {
    const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')
    const body = new URLSearchParams({
      From: TWILIO_NUMBER,
      To:   para,
      Body: texto,
    })

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      {
        method:  'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type':  'application/x-www-form-urlencoded',
        },
        body: body.toString(),
        signal: AbortSignal.timeout(10000),
      }
    )
    const data = await res.json()
    if (res.ok) {
      console.log('[Twilio] Mensagem enviada — SID:', data?.sid)
    } else {
      console.error('[Twilio] Erro ao enviar:', JSON.stringify(data).slice(0, 200))
    }
    return data
  } catch (e) {
    console.error('[Twilio] fetch error:', e.message)
  }
}

// ── Registrar mensagem no CRM ────────────────────────────────
async function crmRegistrarMensagem(numero, role, texto, nomeWhatsApp) {
  const payload = { numero, role, texto }
  if (nomeWhatsApp) payload.nomeWhatsApp = nomeWhatsApp
  try {
    await fetch(`${VPS_LEADS_URL}/leads/mensagem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    })
    return
  } catch {}
  try {
    await fetch(`${getBaseUrl()}/api/leads?action=mensagem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (e) {
    console.error('[CRM] Erro ao registrar mensagem:', e.message)
  }
}

// ── Criar lead no CRM ────────────────────────────────────────
async function crmCriarLead({ nome, telefone, numero, area, urgencia, resumo }) {
  const payload = { nome, telefone, numero, area, urgencia, resumo, canal: 'whatsapp-twilio' }
  try {
    await fetch(`${VPS_LEADS_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    })
    console.log(`[CRM] Lead salvo: ${nome} — ${telefone || numero}`)
    return
  } catch {}
  try {
    await fetch(`${getBaseUrl()}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (e) {
    console.error('[CRM] Erro ao criar lead:', e.message)
  }
}

// ── PROMPT OFICIAL Dr. Ben — 7 etapas ───────────────────────
const DR_BEN_SYSTEM_PROMPT = `Você é o Dr. Ben, assistente jurídico digital do escritório Mauro Monção Advogados Associados (OAB/PI · CE · MA), com sede em Parnaíba-PI.

Sua missão é realizar a triagem inicial do visitante, entender o problema jurídico e encaminhar para o advogado especialista correto. Você NÃO emite pareceres, NÃO representa o cliente e NÃO promete resultados.

## FLUXO OBRIGATÓRIO (siga esta ordem):

**ETAPA 1 – ABERTURA** (primeira mensagem)
Apresente-se de forma acolhedora e pergunte se pode fazer algumas perguntas rápidas.

**ETAPA 2 – IDENTIFICAÇÃO**
Pergunte:
- O atendimento é para você mesmo(a) ou para empresa/terceiro?
- Você já é cliente do escritório ou é o primeiro contato?

**ETAPA 3 – COLETA DA DEMANDA**
Pergunte: "Em poucas palavras, qual é o problema jurídico que você está enfrentando hoje?"
Ouça sem opinar. Não faça análise jurídica.

**ETAPA 4 – CLASSIFICAÇÃO DA ÁREA**
Com base no relato, infira a área: Tributário | Previdenciário | Bancário | Imobiliário | Família e Sucessões | Advocacia Pública | Trabalhista | Consumidor | Outros.
Confirme com o usuário: "Pelo que você descreveu, isso parece estar ligado a [ÁREA]. Confere?"

**ETAPA 5 – URGÊNCIA**
Pergunte: "Existe prazo próximo, risco imediato ou alguma situação urgente acontecendo agora?"
Classifique internamente: low | medium | high | critical.

**ETAPA 6 – COLETA DE CONTATO**
Diga: "Para encaminharmos seu caso ao advogado especialista, preciso do seu nome e WhatsApp."
Colete nome e telefone (WhatsApp).

**ETAPA 7 – ENCAMINHAMENTO**
Confirme o recebimento, agradeça e informe que a equipe jurídica entrará em contato em breve.
Encerre gentilmente.

## REGRAS ABSOLUTAS:
- NUNCA solicite CPF, CNPJ, RG, número de processo ou arquivos
- NUNCA emita parecer, opinião jurídica ou análise do caso
- NUNCA prometa resultados, prazos ou êxito
- NUNCA recuse ou descarte um atendimento
- Responda SEMPRE em português brasileiro
- Seja cordial, profissional e objetivo
- Mensagens curtas (máx. 3 parágrafos por resposta)
- Quando coletar nome e telefone, inclua no final: [CONTACT:{"name":"...","phone":"..."}]
- Quando identificar a área jurídica, inclua: [AREA:tributario|previdenciario|bancario|imobiliario|familia|publico|trabalhista|consumidor|outros]
- Quando avaliar urgência, inclua: [URGENCY:low|medium|high|critical]`

// ── Sessões em memória ───────────────────────────────────────
if (!global.__drbenSessoesTwilio) global.__drbenSessoesTwilio = new Map()
if (!global.__drbenTriagemTwilio) global.__drbenTriagemTwilio = new Map()

// ── Extrair marcadores ───────────────────────────────────────
function extrairMarcadores(texto) {
  const resultado = { contact: null, area: null, urgencia: null }
  const contactMatch = texto.match(/\[CONTACT:(\{[^}]+\})\]/)
  if (contactMatch) {
    try { resultado.contact = JSON.parse(contactMatch[1]) } catch {}
  }
  const areaMatch = texto.match(/\[AREA:([\w|]+)\]/)
  if (areaMatch) resultado.area = areaMatch[1].split('|')[0]
  const urgenciaMatch = texto.match(/\[URGENCY:(\w+)\]/)
  if (urgenciaMatch) resultado.urgencia = urgenciaMatch[1]
  return resultado
}

// ── Consultar Dr. Ben (OpenAI GPT-4o-mini) ───────────────────
async function consultarDrBen(history, novaMensagem) {
  const fallback = '⚖️ Olá! Sou o Dr. Ben, assistente jurídico do escritório Mauro Monção Advogados. Estou com uma instabilidade técnica agora. Por favor, entre em contato: *(86) 99482-0054*'

  if (!OPENAI_KEY) {
    console.error('[Dr. Ben] OPENAI_API_KEY ausente!')
    return fallback
  }

  const messages = [
    { role: 'system', content: DR_BEN_SYSTEM_PROMPT },
    ...history.slice(-20).map(m => ({
      role:    m.role === 'model' ? 'assistant' : (m.role ?? 'user'),
      content: m.content ?? m.parts?.[0]?.text ?? '',
    })),
    { role: 'user', content: novaMensagem },
  ]

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model:       'gpt-4o-mini',
        messages,
        max_tokens:  1024,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(25000),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[Dr. Ben] OpenAI erro:', response.status, errText.slice(0, 200))
      return fallback
    }

    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content
    if (text) {
      console.log(`[Dr. Ben] Respondido via gpt-4o-mini (${data?.usage?.total_tokens ?? '?'} tokens)`)
      return text
    }
    return fallback
  } catch (err) {
    console.error('[Dr. Ben] OpenAI error:', err.message)
    return fallback
  }
}

// ── MARA IA — avisa Dr. Mauro ────────────────────────────────
async function maraAvisarDrMauro({ nome, telefone, numero, area, urgencia, resumo }) {
  if (!DR_MAURO_WHATSAPP) return

  const urgenciaEmoji = { low: '🟢', medium: '🟡', high: '🔴', critical: '🚨' }[urgencia] ?? '🟡'
  const urgenciaLabel = { low: 'BAIXA', medium: 'MÉDIA', high: 'ALTA', critical: 'CRÍTICA' }[urgencia] ?? 'MÉDIA'
  const areaLabel = {
    tributario: '🧾 Tributário', previdenciario: '👴 Previdenciário',
    bancario: '🏦 Bancário', imobiliario: '🏠 Imobiliário',
    familia: '👨‍👩‍👧 Família', publico: '⚖️ Advocacia Pública',
    trabalhista: '👷 Trabalhista', consumidor: '🛒 Consumidor',
    outros: '📋 Outros',
  }[area] ?? '📋 Outros'

  const hora = new Date().toLocaleTimeString('pt-BR', {
    timeZone: 'America/Fortaleza', hour: '2-digit', minute: '2-digit',
  })

  const foneContato  = telefone ?? numero
  const whatsappLink = foneContato ? `https://wa.me/55${foneContato.replace(/\D/g, '')}` : null

  const msg =
    `🤖 *MARA IA — Novo lead qualificado!*\n` +
    `_Dr. Ben concluiu a triagem às ${hora}_\n\n` +
    `👤 *Cliente:* ${nome ?? 'Não informado'}\n` +
    `📱 *WhatsApp:* ${telefone ?? ('via +' + numero)}\n` +
    `${areaLabel}\n` +
    `${urgenciaEmoji} *Urgência:* ${urgenciaLabel}\n` +
    (resumo ? `💬 *Resumo:* ${resumo}\n` : '') +
    (whatsappLink ? `\n👉 ${whatsappLink}` : '') +
    `\n\n_Toque no link para iniciar o atendimento._`

  const mauroNum = DR_MAURO_WHATSAPP.replace(/\D/g, '')
  await enviarMensagem(`+${mauroNum}`, msg)
  console.log(`[MARA IA] Dr. Mauro avisado sobre lead de ${numero}`)
}

// ── Handler principal ────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  // GET — health check
  if (req.method === 'GET') {
    return res.status(200).json({
      status:  'ok',
      service: 'Dr. Ben (Assistente Jurídico) via Twilio WhatsApp',
      model:   'gpt-4o-mini',
      twilio:  TWILIO_SID ? '✅ configurado' : '❌ faltando',
    })
  }

  if (req.method !== 'POST') return res.status(405).end()

  try {
    // Twilio envia como form-urlencoded
    const body = typeof req.body === 'string'
      ? Object.fromEntries(new URLSearchParams(req.body))
      : req.body

    console.log('[Twilio Webhook] Recebido:', JSON.stringify(body).slice(0, 300))

    const fromRaw = body?.From || ''  // ex: whatsapp:+5585991430969
    const texto   = body?.Body || ''
    const profile = body?.ProfileName || ''

    if (!fromRaw || !texto) {
      return res.status(200).send('<Response></Response>')
    }

    // Extrair número limpo
    const numero   = fromRaw.replace('whatsapp:', '').replace(/[^0-9+]/g, '')
    const pushName = profile

    console.log(`[Dr. Ben] Mensagem de ${numero} (${pushName}): "${texto}"`)

    // ── Detectar se é Dr. Mauro ───────────────────────────
    const mauroNorm = DR_MAURO_WHATSAPP.replace(/\D/g, '')
    const ehDrMauro = mauroNorm && numero.replace(/\D/g, '').endsWith(mauroNorm.slice(-10))

    if (ehDrMauro) {
      const cmd = texto.trim().toLowerCase()

      if (cmd === '/reset' || cmd === 'reset') {
        global.__drbenSessoesTwilio.delete(numero)
        global.__drbenTriagemTwilio.delete(numero)
        global.__drbenSessoesTwilio.set(numero, [])
        global.__drbenTriagemTwilio.set(numero, { nome: null, telefone: null, area: null, urgencia: null, notificado: false })
        await enviarMensagem(fromRaw, '✅ *Sessão resetada!*\n\nAgora você está em *modo cliente*. Mande qualquer mensagem e o Dr. Ben vai te atender normalmente.')
        return res.status(200).send('<Response></Response>')
      }

      if (cmd === '/status' || cmd === 'status') {
        const sessao = global.__drbenSessoesTwilio.get(numero)
        const msg = [
          '📊 *Status Dr. Ben (Twilio)*',
          `• Sessões ativas: ${global.__drbenSessoesTwilio.size}`,
          `• Sua sessão: ${sessao ? `${sessao.length} msgs` : 'nenhuma'}`,
          `• IA: ${OPENAI_KEY ? '✅ gpt-4o-mini' : '❌ sem chave'}`,
          `• WhatsApp: ✅ Twilio`,
          `• Prompt: ✅ Oficial 7 etapas`,
          '',
          '_Comandos: /reset | /status | /sair_',
        ].join('\n')
        await enviarMensagem(fromRaw, msg)
        return res.status(200).send('<Response></Response>')
      }

      if (cmd === '/sair' || cmd === 'sair') {
        global.__drbenSessoesTwilio.delete(numero)
        global.__drbenTriagemTwilio.delete(numero)
        await enviarMensagem(fromRaw, '👋 *Saiu do modo cliente.*\n\n• */reset* — entrar como cliente\n• */status* — ver sistema')
        return res.status(200).send('<Response></Response>')
      }

      if (!global.__drbenSessoesTwilio.has(numero)) {
        await enviarMensagem(fromRaw, [
          '👋 *Olá, Dr. Mauro!*',
          '',
          'Comandos disponíveis:',
          '• */reset* — testar Dr. Ben como cliente',
          '• */status* — ver estado do sistema',
          '• */sair* — sair do modo cliente',
          '',
          '_Envie /reset para testar o Dr. Ben._',
        ].join('\n'))
        return res.status(200).send('<Response></Response>')
      }
    }

    // ── Criar/recuperar sessão ────────────────────────────
    if (!global.__drbenSessoesTwilio.has(numero)) {
      global.__drbenSessoesTwilio.set(numero, [])
    }
    if (!global.__drbenTriagemTwilio.has(numero)) {
      global.__drbenTriagemTwilio.set(numero, {
        nome:      pushName || null,
        telefone:  null,
        area:      null,
        urgencia:  null,
        notificado: false,
      })
    } else if (pushName && !global.__drbenTriagemTwilio.get(numero).nome) {
      global.__drbenTriagemTwilio.get(numero).nome = pushName
    }

    const history      = global.__drbenSessoesTwilio.get(numero)
    const dadosTriagem = global.__drbenTriagemTwilio.get(numero)

    // Registrar no CRM
    crmRegistrarMensagem(numero, 'lead', texto, pushName || dadosTriagem.nome)

    // Dr. Ben responde
    const aiText = await consultarDrBen(history, texto)

    // Salvar histórico
    history.push({ role: 'user',      content: texto  })
    history.push({ role: 'assistant', content: aiText })

    // Extrair marcadores
    const marcadores = extrairMarcadores(aiText)
    if (marcadores.area)     dadosTriagem.area     = marcadores.area
    if (marcadores.urgencia) dadosTriagem.urgencia = marcadores.urgencia
    if (marcadores.contact) {
      dadosTriagem.nome     = marcadores.contact.name  ?? dadosTriagem.nome
      dadosTriagem.telefone = marcadores.contact.phone ?? dadosTriagem.telefone
    }

    // Limpar marcadores
    const cleanReply = aiText
      .replace(/\[CONTACT:\{[^}]*\}\]/g, '')
      .replace(/\[AREA:[\w|]+\]/g, '')
      .replace(/\[URGENCY:\w+\]/g, '')
      .trim()

    // Registrar resposta no CRM
    crmRegistrarMensagem(numero, 'dr_ben', cleanReply)

    // MARA IA avisa Dr. Mauro quando triagem completa
    if (dadosTriagem.nome && dadosTriagem.telefone && !dadosTriagem.notificado) {
      dadosTriagem.notificado = true

      const mensagensCliente = history
        .filter(m => m.role === 'user')
        .map(m => m.content ?? '')
      const resumo = mensagensCliente.length > 1
        ? mensagensCliente[Math.min(2, mensagensCliente.length - 1)]
        : mensagensCliente[0]

      crmCriarLead({
        nome:     dadosTriagem.nome,
        telefone: dadosTriagem.telefone,
        numero,
        area:     dadosTriagem.area    ?? 'outros',
        urgencia: dadosTriagem.urgencia ?? 'medium',
        resumo:   resumo?.slice(0, 150),
      })

      maraAvisarDrMauro({
        nome:     dadosTriagem.nome,
        telefone: dadosTriagem.telefone,
        numero,
        area:     dadosTriagem.area    ?? 'outros',
        urgencia: dadosTriagem.urgencia ?? 'medium',
        resumo:   resumo?.slice(0, 150),
      })

      console.log(`[Dr. Ben] Triagem completa — ${dadosTriagem.nome} — MARA IA avisando Dr. Mauro`)
    }

    // Enviar resposta via Twilio
    await enviarMensagem(fromRaw, cleanReply)

    return res.status(200).send('<Response></Response>')

  } catch (e) {
    console.error('[Twilio Webhook] Erro:', e.message)
    return res.status(200).send('<Response></Response>')
  }
}
