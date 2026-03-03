// ============================================================
// BEN GROWTH CENTER — Webhook Evolution API
// Rota: POST /api/whatsapp-evolution
//
// DR. BEN   = Assistente Jurídico — atende os CLIENTES via WhatsApp
// MARA IA   = Assistente Pessoal  — avisa o DR. MAURO quando
//             Dr. Ben coleta o contato do cliente
//
// PROMPT: idêntico ao drben-oficial/api/chat.js
// MODEL:  gemini-2.5-flash (igual ao site/widget)
// FORMAT: system_instruction + contents[] (igual ao site/widget)
// ============================================================

export const config = { maxDuration: 30 }

// ── Variáveis de ambiente ────────────────────────────────────
const GEMINI_KEY         = process.env.GEMINI_API_KEY
const EVOLUTION_URL      = process.env.EVOLUTION_API_URL   ?? ''
const EVOLUTION_KEY      = process.env.EVOLUTION_API_KEY   ?? ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE  ?? 'drben'
const DR_MAURO_WHATSAPP  = process.env.PLANTONISTA_WHATSAPP ?? ''

// ── URL base do próprio serviço e da VPS ────────────────────
function getBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'https://ben-growth-center.vercel.app'
}

// URL da API de Leads na VPS (SQLite persistente)
const VPS_LEADS_URL = process.env.VPS_LEADS_URL || 'http://181.215.135.202:3001'

// ── Registrar mensagem no CRM (VPS SQLite → fallback Vercel) ─
async function crmRegistrarMensagem(numero, role, texto) {
  // Tentar VPS diretamente (mais rápido, persistente)
  try {
    await fetch(`${VPS_LEADS_URL}/leads/mensagem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero, role, texto }),
      signal: AbortSignal.timeout(3000),
    })
    return
  } catch {}
  // Fallback: Vercel API
  try {
    await fetch(`${getBaseUrl()}/api/leads?action=mensagem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero, role, texto }),
    })
  } catch (e) {
    console.error('[CRM] Erro ao registrar mensagem:', e.message)
  }
}

// ── Criar ou atualizar lead no CRM ──────────────────────────
async function crmCriarLead({ nome, telefone, numero, area, urgencia, resumo }) {
  const payload = { nome, telefone, numero, area, urgencia, resumo, canal: 'whatsapp' }
  // Tentar VPS diretamente
  try {
    await fetch(`${VPS_LEADS_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    })
    console.log(`[CRM] Lead salvo na VPS: ${nome} — ${telefone || numero}`)
    return
  } catch {}
  // Fallback: Vercel API
  try {
    await fetch(`${getBaseUrl()}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    console.log(`[CRM] Lead salvo (memória): ${nome} — ${telefone || numero}`)
  } catch (e) {
    console.error('[CRM] Erro ao criar lead:', e.message)
  }
}

// ── PROMPT OFICIAL — idêntico ao drben-oficial/api/chat.js ──
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

// ── Sessões em memória (histórico por número de WhatsApp) ───
// Estrutura: { history: [{role, parts}], triagem: {...}, notificado: bool }
if (!global.__drbenSessoes)  global.__drbenSessoes  = new Map()
if (!global.__drbenTriagem)  global.__drbenTriagem  = new Map()

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
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
        body:    JSON.stringify({ number: numero, text: texto }),
      }
    )
    const data = await res.json()
    console.log('[Evolution] Mensagem enviada:', JSON.stringify(data).slice(0, 100))
    return data
  } catch (e) {
    console.error('[Evolution] Erro ao enviar:', e.message)
  }
}

// ── Extrair marcadores do texto da IA (igual ao drben-oficial) ─
function extrairMarcadores(texto) {
  const resultado = { contact: null, area: null, urgencia: null }

  // [CONTACT:{"name":"...","phone":"..."}]
  const contactMatch = texto.match(/\[CONTACT:(\{[^}]+\})\]/)
  if (contactMatch) {
    try { resultado.contact = JSON.parse(contactMatch[1]) } catch {}
  }

  // [AREA:tributario]
  const areaMatch = texto.match(/\[AREA:([\w|]+)\]/)
  if (areaMatch) resultado.area = areaMatch[1].split('|')[0]

  // [URGENCY:high]
  const urgenciaMatch = texto.match(/\[URGENCY:(\w+)\]/)
  if (urgenciaMatch) resultado.urgencia = urgenciaMatch[1]

  return resultado
}

// ── DR. BEN — chama Gemini com system_instruction + contents[] ─
// Formato IDÊNTICO ao drben-oficial/api/chat.js
async function consultarDrBen(history, novaMensagem) {
  const fallback = 'Desculpe, estou com uma instabilidade técnica no momento. Por favor, fale diretamente com nossa equipe pelo WhatsApp: (86) 99482-0054'

  if (!GEMINI_KEY) return fallback

  // Adicionar a nova mensagem do cliente ao histórico para esta chamada
  const contents = [
    ...history.slice(-20),
    { role: 'user', parts: [{ text: novaMensagem }] },
  ]

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`

  const payload = {
    system_instruction: { parts: [{ text: DR_BEN_SYSTEM_PROMPT }] },
    contents,
    generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
  }

  try {
    const response = await fetch(geminiUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[Dr. Ben] Gemini erro:', response.status, errText.slice(0, 200))
      return fallback
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    return text ?? fallback
  } catch (err) {
    console.error('[Dr. Ben] fetch error:', err.message)
    return fallback
  }
}

// ── MARA IA — Avisa Dr. Mauro via WhatsApp (igual ao drben-oficial) ─
async function maraAvisarDrMauro({ nome, telefone, numero, area, urgencia, resumo }) {
  if (!EVOLUTION_URL || !EVOLUTION_KEY || !DR_MAURO_WHATSAPP) {
    console.log('[MARA IA] Configuração incompleta — aviso não enviado')
    return
  }

  const urgenciaEmoji = { low: '🟢', medium: '🟡', high: '🔴', critical: '🚨' }[urgencia] ?? '🟡'
  const urgenciaLabel = { low: 'BAIXA', medium: 'MÉDIA', high: 'ALTA', critical: 'CRÍTICA' }[urgencia] ?? 'MÉDIA'

  const areaLabel = {
    tributario:    '🧾 Tributário',
    previdenciario:'👴 Previdenciário',
    bancario:      '🏦 Bancário',
    imobiliario:   '🏠 Imobiliário',
    familia:       '👨‍👩‍👧 Família e Sucessões',
    publico:       '⚖️ Advocacia Pública',
    trabalhista:   '👷 Trabalhista',
    consumidor:    '🛒 Consumidor',
    outros:        '📋 Outros',
  }[area] ?? ('📋 ' + (area ?? 'Outros'))

  const hora = new Date().toLocaleTimeString('pt-BR', {
    timeZone: 'America/Fortaleza',
    hour: '2-digit', minute: '2-digit',
  })

  // Número para link do WhatsApp: preferir telefone informado, senão usar número do remetente
  const foneContato = telefone ?? numero
  const whatsappLink = foneContato
    ? `https://wa.me/55${foneContato.replace(/\D/g, '')}`
    : null

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

  await enviarMensagem(DR_MAURO_WHATSAPP, msg)
  console.log(`[MARA IA] Dr. Mauro avisado sobre lead de ${numero}`)
}

// ── Handler principal ────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, apikey')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    return res.status(200).json({
      status:  'ok',
      service: 'Dr. Ben (Assistente Jurídico) + MARA IA (Assistente Pessoal)',
      prompt:  'Prompt oficial 7 etapas — drben-oficial sync',
      model:   'gemini-2.5-flash',
    })
  }

  if (req.method !== 'POST') return res.status(405).end()

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    console.log('[Webhook] Evento:', JSON.stringify(body).slice(0, 200))

    const evento = body?.event ?? body?.type ?? ''

    // ── Mensagem recebida de cliente ─────────────────────────
    if (
      evento === 'messages.upsert' ||
      evento === 'MESSAGES_UPSERT'  ||
      body?.data?.message
    ) {
      const msgData = body?.data ?? body
      const fromMe  = msgData?.key?.fromMe ?? msgData?.message?.fromMe ?? false

      // Ignorar mensagens enviadas pelo próprio bot
      if (fromMe) return res.status(200).json({ ok: true })

      const numero = (msgData?.key?.remoteJid ?? msgData?.from ?? '').replace('@s.whatsapp.net', '')
      const texto  = msgData?.message?.conversation
                  ?? msgData?.message?.extendedTextMessage?.text
                  ?? msgData?.text
                  ?? ''

      if (!numero || !texto) return res.status(200).json({ ok: true })

      // ── Detectar se é o Dr. Mauro (dono) ─────────────────
      const numeroNorm = numero.replace(/\D/g, '')
      const mauroNorm  = DR_MAURO_WHATSAPP.replace(/\D/g, '')
      const ehDrMauro  = mauroNorm && numeroNorm.endsWith(mauroNorm.slice(-10))

      if (ehDrMauro) {
        const cmd = texto.trim().toLowerCase()

        // /reset — zerar sessão de teste
        if (cmd === '/reset' || cmd === 'reset') {
          global.__drbenSessoes.delete(numero)
          global.__drbenTriagem.delete(numero)
          await enviarMensagem(numero, '✅ *Sessão resetada!*\nAgora sou um cliente novo para você. Pode mandar mensagem normalmente.')
          return res.status(200).json({ ok: true, acao: 'reset' })
        }

        // /status — ver estado do sistema
        if (cmd === '/status' || cmd === 'status') {
          const sessao = global.__drbenSessoes.get(numero)
          const msg = [
            '📊 *Status Dr. Ben*',
            `• Sessões ativas: ${global.__drbenSessoes.size}`,
            `• Sua sessão: ${sessao ? `${sessao.length} msgs no histórico` : 'nenhuma'}`,
            `• Gemini: ${GEMINI_KEY ? '✅ gemini-2.5-flash' : '❌ sem chave'}`,
            `• Evolution: ${EVOLUTION_URL ? '✅ ' + EVOLUTION_URL : '❌ não configurado'}`,
            `• Prompt: ✅ Oficial 7 etapas (drben-oficial sync)`,
            '',
            '_Comandos: /reset | /status | /teste_',
          ].join('\n')
          await enviarMensagem(numero, msg)
          return res.status(200).json({ ok: true, acao: 'status' })
        }

        // /teste — forçar modo cliente
        if (cmd === '/teste' || cmd === 'teste') {
          global.__drbenSessoes.delete(numero)
          global.__drbenTriagem.delete(numero)
          await enviarMensagem(numero, '🧪 *Modo teste ativado!*\nVou te atender como se fosse um cliente novo.\nMande sua próxima mensagem normalmente.')
          return res.status(200).json({ ok: true, acao: 'modo_teste' })
        }

        // Sem sessão ativa = primeira mensagem do Dr. Mauro → menu
        if (!global.__drbenSessoes.has(numero)) {
          await enviarMensagem(numero, [
            '👋 *Olá, Dr. Mauro!*',
            '',
            'Comandos disponíveis:',
            '• */teste* — interagir como cliente',
            '• */reset* — zerar sessão atual',
            '• */status* — ver estado do sistema',
            '',
            '_Ou envie /teste para iniciar uma conversa de teste._',
          ].join('\n'))
          return res.status(200).json({ ok: true, acao: 'menu_dono' })
        }
        // Tem sessão ativa → modo teste: continua como cliente
      }

      console.log(`[Dr. Ben] Mensagem de ${numero}${ehDrMauro ? ' (Dr. Mauro/teste)' : ''}: "${texto}"`)

      // ── Criar ou recuperar sessão (histórico Gemini) ──────
      if (!global.__drbenSessoes.has(numero)) {
        global.__drbenSessoes.set(numero, [])
      }
      if (!global.__drbenTriagem.has(numero)) {
        global.__drbenTriagem.set(numero, {
          nome:      null,
          telefone:  null,
          area:      null,
          urgencia:  null,
          notificado: false,
        })
      }

      const history      = global.__drbenSessoes.get(numero)
      const dadosTriagem = global.__drbenTriagem.get(numero)

      // ── Registrar mensagem do cliente no CRM ─────────────
      crmRegistrarMensagem(numero, 'lead', texto)

      // ── Dr. Ben responde (gemini-2.5-flash + system_instruction) ─
      const aiText = await consultarDrBen(history, texto)

      // Salvar no histórico no formato correto do Gemini (contents[])
      history.push({ role: 'user',  parts: [{ text: texto   }] })
      history.push({ role: 'model', parts: [{ text: aiText  }] })

      // ── Extrair marcadores da resposta (igual ao drben-oficial) ─
      const marcadores = extrairMarcadores(aiText)

      if (marcadores.area)    dadosTriagem.area    = marcadores.area
      if (marcadores.urgencia) dadosTriagem.urgencia = marcadores.urgencia
      if (marcadores.contact) {
        dadosTriagem.nome     = marcadores.contact.name  ?? dadosTriagem.nome
        dadosTriagem.telefone = marcadores.contact.phone ?? dadosTriagem.telefone
      }

      // ── Limpar marcadores antes de enviar ao cliente ──────
      const cleanReply = aiText
        .replace(/\[CONTACT:\{[^}]*\}\]/g, '')
        .replace(/\[AREA:[\w|]+\]/g, '')
        .replace(/\[URGENCY:\w+\]/g, '')
        .trim()

      // ── Registrar resposta do Dr. Ben no CRM ─────────────
      crmRegistrarMensagem(numero, 'dr_ben', cleanReply)

      // ── MARA IA avisa Dr. Mauro UMA ÚNICA VEZ quando contato coletado ─
      if (dadosTriagem.nome && dadosTriagem.telefone && !dadosTriagem.notificado) {
        dadosTriagem.notificado = true

        // Resumo = ~3ª mensagem do cliente (problema jurídico)
        const mensagensCliente = history
          .filter(m => m.role === 'user')
          .map(m => m.parts[0].text)
        const resumo = mensagensCliente.length > 1
          ? mensagensCliente[Math.min(2, mensagensCliente.length - 1)]
          : mensagensCliente[0]

        // Criar lead no CRM com todos os dados coletados
        crmCriarLead({
          nome:     dadosTriagem.nome,
          telefone: dadosTriagem.telefone,
          numero,
          area:     dadosTriagem.area    ?? 'outros',
          urgencia: dadosTriagem.urgencia ?? 'medium',
          resumo:   resumo?.slice(0, 150),
        })

        // MARA IA avisa Dr. Mauro no WhatsApp
        maraAvisarDrMauro({
          nome:     dadosTriagem.nome,
          telefone: dadosTriagem.telefone,
          numero,
          area:     dadosTriagem.area    ?? 'outros',
          urgencia: dadosTriagem.urgencia ?? 'medium',
          resumo:   resumo?.slice(0, 150),
        })

        console.log(`[Dr. Ben] Triagem completa — lead no CRM + MARA IA avisando Dr. Mauro sobre ${dadosTriagem.nome}`)
      }

      // ── Enviar resposta via Evolution API ─────────────────
      await enviarMensagem(numero, cleanReply)

      return res.status(200).json({ ok: true, respondido: true })
    }

    // ── QR Code atualizado ────────────────────────────────
    if (evento === 'qrcode.updated' || evento === 'QRCODE_UPDATED') {
      console.log('[Evolution] QR Code gerado')
      return res.status(200).json({ ok: true })
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
