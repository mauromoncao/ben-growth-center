// ============================================================
// BEN GROWTH CENTER — Webhook Z-API WhatsApp
// Rota: POST /api/whatsapp-zapi  → mensagens recebidas
//
// DR. BEN  = Assistente Jurídico — atende CLIENTES via WhatsApp
// MARA IA  = Assistente Pessoal  — avisa DR. MAURO após triagem
//
// MODEL: gpt-4o-mini (OpenAI)
// ============================================================

export const config = { maxDuration: 30 }

const OPENAI_KEY        = process.env.OPENAI_API_KEY       || ''
const ZAPI_INSTANCE_ID  = process.env.ZAPI_INSTANCE_ID     || ''
const ZAPI_TOKEN        = process.env.ZAPI_TOKEN           || ''
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN    || ''
const DR_MAURO_WHATSAPP = process.env.PLANTONISTA_WHATSAPP || ''
const VPS_LEADS_URL     = process.env.VPS_LEADS_URL        || 'http://181.215.135.202:3001'

const ZAPI_BASE = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}`

function getBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'https://ben-growth-center.vercel.app'
}

// ── Enviar mensagem via Z-API ────────────────────────────────
async function enviarMensagem(numero, texto) {
  if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
    console.error('[Z-API] Credenciais não configuradas')
    return
  }
  try {
    const headers = { 'Content-Type': 'application/json' }
    if (ZAPI_CLIENT_TOKEN) headers['Client-Token'] = ZAPI_CLIENT_TOKEN

    const res = await fetch(`${ZAPI_BASE}/send-text`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        phone:   numero,
        message: texto,
      }),
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    if (res.ok) {
      console.log('[Z-API] Mensagem enviada para', numero, '— zaapId:', data?.zaapId)
    } else {
      console.error('[Z-API] Erro ao enviar:', JSON.stringify(data).slice(0, 200))
    }
    return data
  } catch (e) {
    console.error('[Z-API] fetch error:', e.message)
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
    console.error('[CRM] Erro registrar mensagem:', e.message)
  }
}

// ── Criar lead no CRM ────────────────────────────────────────
async function crmCriarLead({ nome, telefone, numero, area, urgencia, resumo, primeiroContato }) {
  const payload = {
    nome, telefone, numero, area, urgencia, resumo,
    canal: 'whatsapp-zapi',
    primeiro_contato: primeiroContato || new Date().toISOString(),
    whatsapp_link: `https://wa.me/${numero}`,
  }
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
    console.error('[CRM] Erro criar lead:', e.message)
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
if (!global.__drbenSessoesZapi) global.__drbenSessoesZapi = new Map()
if (!global.__drbenTriagemZapi) global.__drbenTriagemZapi = new Map()

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
  const fallback = '⚖️ Olá! Sou o Dr. Ben, assistente jurídico do escritório Mauro Monção Advogados. Estou com uma instabilidade técnica. Por favor, entre em contato: *(86) 99482-0054*'

  if (!OPENAI_KEY) return fallback

  const messages = [
    { role: 'system', content: DR_BEN_SYSTEM_PROMPT },
    ...history.slice(-20).map(m => ({
      role:    m.role === 'model' ? 'assistant' : (m.role ?? 'user'),
      content: m.content ?? '',
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
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 1024, temperature: 0.7 }),
      signal: AbortSignal.timeout(25000),
    })

    if (!response.ok) {
      console.error('[Dr. Ben] OpenAI erro:', response.status)
      return fallback
    }

    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content
    if (text) {
      console.log(`[Dr. Ben] gpt-4o-mini (${data?.usage?.total_tokens ?? '?'} tokens)`)
      return text
    }
    return fallback
  } catch (err) {
    console.error('[Dr. Ben] OpenAI error:', err.message)
    return fallback
  }
}

// ── MARA IA — avisa Dr. Mauro ────────────────────────────────
async function maraAvisarDrMauro({ nome, telefone, numero, area, urgencia, resumo, pushName }) {
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

  // Montar número limpo para link direto
  const numLimpo = numero.replace(/\D/g, '')
  const whatsappLink = `https://wa.me/${numLimpo}`

  // Nome de exibição — preferir nome coletado, fallback pushName
  const nomeExibir   = nome ?? pushName ?? 'Não informado'
  const foneExibir   = telefone ?? `+${numLimpo}`

  const msg = [
    `🤖 *MARA IA — Novo Lead Qualificado!*`,
    `_Triagem concluída às ${hora}_`,
    ``,
    `👤 *Nome:* ${nomeExibir}`,
    `📱 *WhatsApp:* ${foneExibir}`,
    `🔢 *Número:* +${numLimpo}`,
    `📂 *Área:* ${areaLabel}`,
    `${urgenciaEmoji} *Urgência:* ${urgenciaLabel}`,
    resumo ? `💬 *Resumo:* ${resumo}` : '',
    ``,
    `👉 *Atender agora:* ${whatsappLink}`,
    ``,
    `_Toque no link para abrir a conversa no WhatsApp._`,
  ].filter(l => l !== null && l !== undefined).join('\n')

  const mauroNum = DR_MAURO_WHATSAPP.replace(/\D/g, '')
  await enviarMensagem(mauroNum, msg)
  console.log(`[MARA IA] Dr. Mauro avisado — ${nomeExibir} (${foneExibir})`)
}

// ── Handler principal ────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // GET — health check e teste de envio
  if (req.method === 'GET') {
    const { action, para } = req.query

    // Ação de teste: GET /api/whatsapp-zapi?action=testar&para=5585991430969
    if (action === 'testar' && para) {
      try {
        const headers = { 'Content-Type': 'application/json' }
        if (ZAPI_CLIENT_TOKEN) headers['Client-Token'] = ZAPI_CLIENT_TOKEN

        const res2 = await fetch(`${ZAPI_BASE}/send-text`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            phone:   para,
            message: '✅ *Dr. Ben está online!*\n\nZ-API funcionando corretamente. Pode me mandar uma mensagem! 🤖⚖️',
          }),
          signal: AbortSignal.timeout(10000),
        })
        const data = await res2.json()
        return res.status(200).json({
          ok:        res2.ok,
          zapi_resp: data,
          token_ok:  !!ZAPI_CLIENT_TOKEN,
          instance:  ZAPI_INSTANCE_ID ? ZAPI_INSTANCE_ID.slice(0, 8) + '...' : '❌',
        })
      } catch (e) {
        return res.status(200).json({ ok: false, erro: e.message })
      }
    }

    return res.status(200).json({
      status:  'ok',
      service: 'Dr. Ben via Z-API WhatsApp',
      model:   'gpt-4o-mini',
      zapi:    ZAPI_INSTANCE_ID ? '✅ configurado' : '❌ faltando',
      token:   ZAPI_CLIENT_TOKEN ? '✅ client-token ok' : '❌ client-token ausente',
    })
  }

  if (req.method !== 'POST') return res.status(405).end()

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    console.log('[Z-API Webhook] Payload:', JSON.stringify(body).slice(0, 300))

    // Ignorar mensagens enviadas pelo próprio bot
    if (body?.fromMe === true) return res.status(200).json({ ok: true })

    // Ignorar status/notificações que não são mensagens
    if (!body?.phone && !body?.from) return res.status(200).json({ ok: true })

    // Extrair dados — Z-API envia phone ou from
    const numero   = (body?.phone || body?.from || '').replace(/[^0-9]/g, '')
    const texto    = body?.text?.message || body?.text || body?.message || ''
    const pushName = body?.senderName || body?.pushName || ''

    // Ignorar grupos e broadcasts
    if (numero.includes('@g') || numero.endsWith('@broadcast')) {
      return res.status(200).json({ ok: true })
    }

    if (!numero || numero.length < 8 || !texto) {
      console.log('[Z-API] Ignorando — sem número ou texto válido')
      return res.status(200).json({ ok: true })
    }

    console.log(`[Dr. Ben] Mensagem de ${numero} (${pushName}): "${texto}"`)

    // ── Detectar se é Dr. Mauro ───────────────────────────
    const mauroNorm = DR_MAURO_WHATSAPP.replace(/\D/g, '')
    const ehDrMauro = mauroNorm && numero.endsWith(mauroNorm.slice(-10))

    if (ehDrMauro) {
      const cmd = texto.trim().toLowerCase()

      if (cmd === '/reset' || cmd === 'reset') {
        global.__drbenSessoesZapi.delete(numero)
        global.__drbenTriagemZapi.delete(numero)
        global.__drbenSessoesZapi.set(numero, [])
        global.__drbenTriagemZapi.set(numero, { nome: null, telefone: null, area: null, urgencia: null, notificado: false })
        await enviarMensagem(numero, '✅ *Sessão resetada!*\n\nAgora você está em *modo cliente*. Mande qualquer mensagem e o Dr. Ben vai te atender normalmente.')
        return res.status(200).json({ ok: true, acao: 'reset' })
      }

      if (cmd === '/status' || cmd === 'status') {
        const sessao = global.__drbenSessoesZapi.get(numero)
        const msg = [
          '📊 *Status Dr. Ben (Z-API)*',
          `• Sessões ativas: ${global.__drbenSessoesZapi.size}`,
          `• Sua sessão: ${sessao ? `${sessao.length} msgs` : 'nenhuma'}`,
          `• IA: ${OPENAI_KEY ? '✅ gpt-4o-mini' : '❌ sem chave'}`,
          `• WhatsApp: ✅ Z-API`,
          `• Prompt: ✅ Oficial 7 etapas`,
          '',
          '_Comandos: /reset | /status | /sair_',
        ].join('\n')
        await enviarMensagem(numero, msg)
        return res.status(200).json({ ok: true, acao: 'status' })
      }

      if (cmd === '/sair' || cmd === 'sair') {
        global.__drbenSessoesZapi.delete(numero)
        global.__drbenTriagemZapi.delete(numero)
        await enviarMensagem(numero, '👋 *Saiu do modo cliente.*\n\n• */reset* — entrar como cliente\n• */status* — ver sistema')
        return res.status(200).json({ ok: true, acao: 'saiu' })
      }

      if (!global.__drbenSessoesZapi.has(numero)) {
        await enviarMensagem(numero, [
          '👋 *Olá, Dr. Mauro!*',
          '',
          'Comandos disponíveis:',
          '• */reset* — testar Dr. Ben como cliente',
          '• */status* — ver estado do sistema',
          '• */sair* — sair do modo cliente',
          '',
          '_Envie /reset para testar o Dr. Ben._',
        ].join('\n'))
        return res.status(200).json({ ok: true, acao: 'menu_dono' })
      }
    }

    // ── Criar/recuperar sessão ────────────────────────────
    if (!global.__drbenSessoesZapi.has(numero)) {
      global.__drbenSessoesZapi.set(numero, [])
    }

    // ── Formatar número WhatsApp do cliente ───────────────
    // numero = ex: 5585991430969 → formatar como (85) 99143-0969
    function formatarTelefone(n) {
      const d = n.replace(/\D/g, '')
      // DDI 55 + DDD 2 dígitos + 9 dígitos
      if (d.length === 13) return `(${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`
      // DDI 55 + DDD 2 dígitos + 8 dígitos
      if (d.length === 12) return `(${d.slice(2,4)}) ${d.slice(4,8)}-${d.slice(8)}`
      return d
    }
    const telefoneWhatsApp = numero.startsWith('55') ? formatarTelefone(numero) : numero

    if (!global.__drbenTriagemZapi.has(numero)) {
      global.__drbenTriagemZapi.set(numero, {
        nome:            pushName || null,
        telefone:        telefoneWhatsApp, // ← número WhatsApp já é o telefone!
        numeroWhatsApp:  numero,           // número puro para envio
        primeiroContato: new Date().toISOString(),
        area:            null,
        urgencia:        null,
        notificado:      false,
      })
    } else {
      const t = global.__drbenTriagemZapi.get(numero)
      // Atualizar nome se veio do pushName e ainda não temos
      if (pushName && !t.nome) t.nome = pushName
      // Garantir telefone sempre preenchido
      if (!t.telefone) t.telefone = telefoneWhatsApp
    }

    const history      = global.__drbenSessoesZapi.get(numero)
    const dadosTriagem = global.__drbenTriagemZapi.get(numero)

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

    // ── Criar lead no CRM assim que tiver nome (telefone já temos desde o início) ──
    if (dadosTriagem.nome && dadosTriagem.telefone && !dadosTriagem.notificado) {
      dadosTriagem.notificado = true

      // Resumo = mensagens do cliente concatenadas
      const mensagensCliente = history.filter(m => m.role === 'user').map(m => m.content ?? '')
      const resumo = mensagensCliente.slice(0, 3).join(' | ')?.slice(0, 200)

      crmCriarLead({
        nome:            dadosTriagem.nome,
        telefone:        dadosTriagem.telefone,
        numero,
        area:            dadosTriagem.area     ?? 'outros',
        urgencia:        dadosTriagem.urgencia ?? 'medium',
        resumo,
        primeiroContato: dadosTriagem.primeiroContato,
      })

      maraAvisarDrMauro({
        nome:     dadosTriagem.nome,
        telefone: dadosTriagem.telefone,
        numero,
        area:     dadosTriagem.area     ?? 'outros',
        urgencia: dadosTriagem.urgencia ?? 'medium',
        resumo,
        pushName,
      })

      console.log(`[Dr. Ben] Lead criado — ${dadosTriagem.nome} (${dadosTriagem.telefone}) — MARA avisou Dr. Mauro`)
    }

    // Enviar resposta via Z-API
    await enviarMensagem(numero, cleanReply)

    return res.status(200).json({ ok: true, respondido: true })

  } catch (e) {
    console.error('[Z-API Webhook] Erro:', e.message)
    return res.status(200).json({ ok: true })
  }
}
