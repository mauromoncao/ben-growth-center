// ============================================================
// BEN GROWTH CENTER — API Flow WhatsApp
// Rota: /api/flow/whatsapp
// Método: POST
// Recebe mensagens do WhatsApp Business API (Meta)
// e processa o fluxo Dr. Ben Flow sem ManyChat
// Economia: ~R$ 480/mês vs ManyChat Pro
// ============================================================

export const config = { maxDuration: 30 }

// Armazenamento em memória de sessões ativas (dev)
// Em produção: usar Redis ou banco de dados
const sessoes = new Map()

// Fluxo simplificado em JS (espelho do flowEngine.ts)
const FLUXO_PADRAO = {
  firstStepId: 's1',
  steps: {
    s1: {
      id: 's1', type: 'message',
      message: 'Olá! 👋 Sou o *Dr. Ben*, assistente jurídico do escritório *Mauro Monção Advogados*.\n\nEspecialistas em Tributário, Previdenciário e Bancário. Como posso te ajudar?',
      nextStepId: 's2',
    },
    s2: {
      id: 's2', type: 'question',
      message: 'Sobre qual assunto você precisa de orientação?',
      buttons: [
        { id: 'b1', label: '💼 Tributário/Impostos', nextStepId: 's3', payload: 'tributario' },
        { id: 'b2', label: '👴 Previdenciário/INSS', nextStepId: 's3', payload: 'previdenciario' },
        { id: 'b3', label: '🏦 Bancário/Juros', nextStepId: 's3', payload: 'bancario' },
        { id: 'b4', label: '❓ Outra dúvida', nextStepId: 's3', payload: 'geral' },
      ],
    },
    s3: {
      id: 's3', type: 'collect', collectKey: 'nome',
      message: 'Pode me dizer seu *nome completo*?',
      collectNextStepId: 's4',
    },
    s4: {
      id: 's4', type: 'collect', collectKey: 'problema',
      message: '{{nome}}, descreva brevemente o seu problema ou dúvida:',
      collectNextStepId: 's5',
    },
    s5: {
      id: 's5', type: 'collect', collectKey: 'valor_estimado',
      message: 'Qual o valor aproximado envolvido? (Ex: R$ 30.000)\n\n_Caso não saiba, responda "não sei"_',
      collectNextStepId: 's6',
    },
    s6: {
      id: 's6', type: 'ai_qualify',
      message: '🤖 _Um momento, estou analisando seu caso..._',
      aiNextStepHighScore: 's7_high',
      aiNextStepLowScore: 's7_low',
    },
    s7_high: {
      id: 's7_high', type: 'notify_human',
      message: '✅ *{{nome}}*, analisei seu caso e ele tem *alta prioridade*!\n\nUm especialista do escritório Mauro Monção entrará em contato em até *30 minutos* pelo número {{telefone}}. 📞\n\nAguarde — estamos te atendendo com prioridade!',
      nextStepId: 's_end',
    },
    s7_low: {
      id: 's7_low', type: 'schedule',
      message: 'Obrigado, *{{nome}}*! 😊\n\nSeu caso é interessante. Gostaria de agendar uma *consulta gratuita* de 30 minutos com o Dr. Mauro?\n\n📅 Escolha o horário: https://www.mauromoncao.adv.br/agendar\n\nOu responda *SIM* e eu marco para você!',
      nextStepId: 's_end',
    },
    s_end: {
      id: 's_end', type: 'end',
      message: 'Mauro Monção Advogados está sempre disponível! 🤝\n📍 Teresina, PI | 🌐 www.mauromoncao.adv.br',
    },
  },
}

function interpolar(texto, dados) {
  return texto.replace(/\{\{(\w+)\}\}/g, (_, key) => dados[key] || `[${key}]`)
}

function calcularScore(dados) {
  let score = 30
  if (dados.nome && dados.nome.length > 2) score += 15
  if (dados.telefone) score += 10
  if (dados.problema && dados.problema.length > 10) score += 15
  if (dados.area && dados.area !== 'geral') score += 10

  // Valor estimado
  const valor = parseFloat((dados.valor_estimado || '').replace(/\D/g, ''))
  if (valor > 50000) score += 20
  else if (valor > 10000) score += 15
  else if (valor > 1000) score += 10

  // Palavras de urgência
  const urgencyWords = ['urgente', 'prazo', 'multa', 'executado', 'penhora', 'bloqueio', 'dívida', 'divida', 'notificação']
  if (urgencyWords.some(w => (dados.problema || '').toLowerCase().includes(w))) score += 10

  return Math.min(score, 95)
}

async function qualificarComIA(dados) {
  const GEMINI_API_KEY = process.env.OPENAI_API_KEY
  const GEMINI_API_URL = process.env.OPENAI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'

  if (!GEMINI_API_KEY) return { score: calcularScore(dados), resumo: '' }

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GEMINI_API_KEY}` },
      body: JSON.stringify({
        model: 'gemini-2.0-flash',
        messages: [
          {
            role: 'system',
            content: `Você é o Dr. Ben — assistente jurídico do escritório Mauro Monção em Teresina, PI.
Analise o lead e responda APENAS um JSON válido:
{"score": 0-100, "urgencia": "alta|media|baixa", "resumo": "2 linhas max", "proxima_acao": "texto curto"}
Score >= 70: encaminhar para humano imediatamente.
Score < 70: agendar consulta.`,
          },
          {
            role: 'user',
            content: `Lead: ${dados.nome || 'não informado'} | Área: ${dados.area || 'não informado'} | Problema: ${dados.problema || 'não informado'} | Valor: ${dados.valor_estimado || 'não informado'}`,
          },
        ],
        max_tokens: 150,
        temperature: 0.2,
      }),
    })

    if (!response.ok) return { score: calcularScore(dados), resumo: '' }

    const data = await response.json()
    const texto = data.choices?.[0]?.message?.content || ''
    const jsonMatch = texto.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        score: parsed.score || calcularScore(dados),
        urgencia: parsed.urgencia || 'media',
        resumo: parsed.resumo || '',
        proxima_acao: parsed.proxima_acao || '',
      }
    }
  } catch (e) {
    console.error('Erro IA:', e)
  }

  return { score: calcularScore(dados), urgencia: 'media', resumo: '', proxima_acao: '' }
}

async function enviarWhatsApp(para, mensagem, apiToken) {
  if (!apiToken || !para) return null
  // Integração real com Meta WhatsApp Business API v21
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: para.replace(/\D/g, ''),
          type: 'text',
          text: { body: mensagem },
        }),
      }
    )
    return response.json()
  } catch (e) {
    console.error('Erro WhatsApp:', e)
    return null
  }
}

async function notificarPlantonista(sessao, analise) {
  const PLANTONISTA_WHATSAPP = process.env.PLANTONISTA_WHATSAPP
  if (!PLANTONISTA_WHATSAPP) return

  const msg = `🔴 LEAD URGENTE — BEN GROWTH CENTER\n\n` +
    `👤 Nome: ${sessao.dados.nome || 'N/A'}\n` +
    `📱 Telefone: ${sessao.dados.telefone || sessao.contactId}\n` +
    `📋 Área: ${sessao.dados.area || 'N/A'}\n` +
    `💬 Problema: ${sessao.dados.problema || 'N/A'}\n` +
    `💰 Valor: ${sessao.dados.valor_estimado || 'N/A'}\n` +
    `⭐ Score Dr. Ben: ${analise.score}/100\n` +
    `🚨 Urgência: ${analise.urgencia?.toUpperCase()}\n\n` +
    `📊 Resumo IA: ${analise.resumo || 'N/A'}\n\n` +
    `⚡ Ação: ${analise.proxima_acao || 'Entrar em contato imediatamente'}`

  await enviarWhatsApp(PLANTONISTA_WHATSAPP, msg, process.env.WHATSAPP_TOKEN)
}

// ── Handler principal ─────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // ── Verificação de webhook do WhatsApp (GET) ──────────────
  if (req.method === 'GET') {
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'bengrowthcenter2026'

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge)
    }
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body

    // ── Processar mensagem recebida do WhatsApp ─────────────
    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages

    if (!messages || messages.length === 0) {
      return res.status(200).json({ status: 'no_messages' })
    }

    const msg = messages[0]
    const telefone = msg.from          // número do remetente
    const tipo = msg.type              // 'text', 'audio', 'interactive' etc.
    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN

    // ── SECRETÁRIA IA — Detectar número do Dr. Mauro ────────
    const PLANTONISTA = process.env.PLANTONISTA_WHATSAPP?.replace(/\D/g, '')
    const ehDrMauro = PLANTONISTA && telefone === PLANTONISTA

    // ── SECRETÁRIA IA — Mensagens de ÁUDIO ──────────────────
    // Qualquer áudio enviado pelo Dr. Mauro → MARA IA agenda
    if (tipo === 'audio' && msg.audio?.id) {
      console.log('[Flow] Áudio recebido de', telefone, '— roteando para MARA IA')
      try {
        const secretariaRes = await fetch(
          `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://ben-growth-center.vercel.app'}/api/secretaria`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioId: msg.audio.id,
              audioMime: msg.audio.mime_type || 'audio/ogg',
              telefone,
            }),
          }
        )
        const result = await secretariaRes.json()
        return res.status(200).json({
          status: 'audio_agendado',
          compromisso: result.compromisso,
          transcricao: result.transcricao,
        })
      } catch (e) {
        console.error('[Flow] Erro MARA IA:', e)
        await enviarWhatsApp(telefone,
          '⚠️ Olá! Sou a MARA IA. Não consegui processar o áudio. Tente enviar como texto.',
          WHATSAPP_TOKEN)
        return res.status(200).json({ status: 'audio_error' })
      }
    }

    const textoRecebido = tipo === 'text'
      ? msg.text?.body
      : msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || ''

    if (!textoRecebido) {
      return res.status(200).json({ status: 'empty_message' })
    }

    // ── SECRETÁRIA IA — Comandos de texto do Dr. Mauro ──────
    // Se for o Dr. Mauro enviando texto com palavra-chave de agenda
    const textoLowerFlow = textoRecebido.toLowerCase().trim()
    const isAgendaCommand = ehDrMauro && (
      textoLowerFlow.startsWith('agendar') ||
      textoLowerFlow.startsWith('agenda ') ||
      textoLowerFlow === 'agenda' ||
      textoLowerFlow === 'hoje' ||
      textoLowerFlow === 'compromissos' ||
      textoLowerFlow === 'minha agenda' ||
      textoLowerFlow.startsWith('cancelar comp_') ||
      textoLowerFlow.includes('audiência') || textoLowerFlow.includes('audiencia') ||
      textoLowerFlow.includes('reunião') || textoLowerFlow.includes('reuniao') ||
      textoLowerFlow.includes('prazo') ||
      textoLowerFlow.includes('consulta amanhã') || textoLowerFlow.includes('consulta amanha')
    )

    if (isAgendaCommand) {
      console.log('[Flow] Comando agenda de', telefone, ':', textoRecebido)
      try {
        const secretariaRes = await fetch(
          `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://ben-growth-center.vercel.app'}/api/secretaria`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto: textoRecebido, telefone }),
          }
        )
        const result = await secretariaRes.json()
        return res.status(200).json({
          status: 'agenda_processado',
          compromisso: result.compromisso,
        })
      } catch (e) {
        console.error('[Flow] Erro agenda:', e)
      }
    }

    // ── Busca ou cria sessão do contato ─────────────────────
    let sessao = sessoes.get(telefone)
    const ehNovoContato = !sessao || sessao.status === 'concluido' || sessao.status === 'repassado'

    if (ehNovoContato) {
      sessao = {
        id: `sess_${Date.now()}`,
        contactId: telefone,
        canal: 'whatsapp',
        currentStepId: FLUXO_PADRAO.firstStepId,
        dados: { telefone },
        status: 'ativo',
        iniciadoEm: new Date().toISOString(),
        historico: [],
      }
      sessoes.set(telefone, sessao)

      // Envia mensagem de boas-vindas
      const primeiroStep = FLUXO_PADRAO.steps[FLUXO_PADRAO.firstStepId]
      await enviarWhatsApp(telefone, interpolar(primeiroStep.message, sessao.dados), WHATSAPP_TOKEN)

      // Avança para próximo passo
      sessao.currentStepId = primeiroStep.nextStepId
      const segundoStep = FLUXO_PADRAO.steps[sessao.currentStepId]
      if (segundoStep) {
        await enviarWhatsApp(telefone, interpolar(segundoStep.message, sessao.dados), WHATSAPP_TOKEN)
      }

      return res.status(200).json({ status: 'flow_started' })
    }

    // ── Processa resposta na sessão ativa ───────────────────
    const currentStep = FLUXO_PADRAO.steps[sessao.currentStepId]
    if (!currentStep) {
      return res.status(200).json({ status: 'invalid_step' })
    }

    sessao.historico.push({ role: 'user', texto: textoRecebido, hora: new Date().toISOString() })

    let resposta = ''
    let proximoStepId = null
    let notificarHumano = false

    switch (currentStep.type) {
      case 'collect': {
        sessao.dados[currentStep.collectKey] = textoRecebido
        proximoStepId = currentStep.collectNextStepId
        break
      }
      case 'question': {
        const botao = currentStep.buttons?.find(b =>
          textoRecebido.toLowerCase().includes(b.label.toLowerCase().replace(/[^\w\s]/g, '').trim()) ||
          textoRecebido === b.id || textoRecebido === b.payload
        ) || currentStep.buttons?.[0] // fallback para o primeiro
        if (botao) {
          sessao.dados['area'] = botao.payload
          proximoStepId = botao.nextStepId
        } else {
          resposta = '😊 Por favor, escolha uma das opções acima.'
        }
        break
      }
      default:
        proximoStepId = currentStep.nextStepId || null
    }

    // ── Processar próximo passo ─────────────────────────────
    if (proximoStepId) {
      const proximoStep = FLUXO_PADRAO.steps[proximoStepId]
      if (!proximoStep) {
        return res.status(200).json({ status: 'step_not_found' })
      }

      sessao.currentStepId = proximoStepId

      // Passo especial: qualificação IA
      if (proximoStep.type === 'ai_qualify') {
        await enviarWhatsApp(telefone, interpolar(proximoStep.message, sessao.dados), WHATSAPP_TOKEN)

        const analise = await qualificarComIA(sessao.dados)
        sessao.dados['score'] = String(analise.score || 50)
        sessao.dados['resumo_ia'] = analise.resumo || ''

        const altaScore = (analise.score || 50) >= 70
        const destino = altaScore ? proximoStep.aiNextStepHighScore : proximoStep.aiNextStepLowScore
        if (destino) {
          const stepFinal = FLUXO_PADRAO.steps[destino]
          if (stepFinal) {
            sessao.currentStepId = destino
            resposta = interpolar(stepFinal.message, sessao.dados)
            if (stepFinal.type === 'notify_human') {
              notificarHumano = true
              sessao.status = 'repassado'
              await notificarPlantonista(sessao, analise)
            }
          }
        }
      } else {
        resposta = interpolar(proximoStep.message, sessao.dados)
        if (proximoStep.type === 'end') {
          sessao.status = 'concluido'
        }
      }
    }

    // ── Envia resposta ──────────────────────────────────────
    if (resposta) {
      await enviarWhatsApp(telefone, resposta, WHATSAPP_TOKEN)
      sessao.historico.push({ role: 'bot', texto: resposta, hora: new Date().toISOString() })
    }

    sessoes.set(telefone, sessao)

    return res.status(200).json({
      status: 'processed',
      sessionId: sessao.id,
      currentStep: sessao.currentStepId,
      notificouHumano: notificarHumano,
      dadosColetados: Object.keys(sessao.dados),
    })

  } catch (error) {
    console.error('Erro Dr. Ben Flow:', error)
    return res.status(500).json({ error: 'Internal server error', message: error.message })
  }
}
