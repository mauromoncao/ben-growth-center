// ============================================================
// BEN ECOSYSTEM — Integration Bridge API
// Rota: /api/bridge
// Comunicação bidirecional: Ben Growth Center ↔ Ben Juris Center
// Backend: Supabase (tabela cross_module_events)
// ============================================================

export const config = { maxDuration: 30 }

const SUPABASE_URL  = process.env.DATABASE_URL       // connection string
const SUPABASE_REST = process.env.SUPABASE_REST_URL  // ex: https://xxx.supabase.co
const SUPABASE_KEY  = process.env.SUPABASE_ANON_KEY  // anon key pública
const JURIS_URL     = 'https://ben-juris-center.vercel.app'
const GROWTH_URL    = 'https://ben-growth-center.vercel.app'
const BRIDGE_SECRET = process.env.JWT_SECRET || ''

// ── Helpers ──────────────────────────────────────────────────
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Ben-Module')
}

function gerarId() {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ── Supabase REST helper ──────────────────────────────────────
async function supabaseInsert(tabela, payload) {
  if (!SUPABASE_REST || !SUPABASE_KEY) return { mock: true }
  const r = await fetch(`${SUPABASE_REST}/rest/v1/${tabela}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  })
  return r.json()
}

async function supabaseSelect(tabela, filtros = '') {
  if (!SUPABASE_REST || !SUPABASE_KEY) return []
  const r = await fetch(`${SUPABASE_REST}/rest/v1/${tabela}?${filtros}&order=created_at.desc&limit=50`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  })
  return r.json()
}

// ── Notificar o módulo destino via webhook ────────────────────
async function notificarModuloDestino(evento) {
  const destUrl = evento.destino === 'juris'
    ? `${JURIS_URL}/api/bridge`
    : `${GROWTH_URL}/api/bridge`
  try {
    await fetch(destUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Ben-Module': evento.origem,
        Authorization: `Bearer ${BRIDGE_SECRET}`,
      },
      body: JSON.stringify({ action: 'receber_evento', evento }),
    })
  } catch (e) {
    console.warn('[Bridge] Falha ao notificar módulo destino:', e.message)
  }
}

// ═══════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { action } = req.method === 'GET' ? req.query : (req.body || {})

  try {
    // ── GET /api/bridge?action=listar ─────────────────────────
    if (req.method === 'GET' && action === 'listar') {
      const modulo = req.query.modulo || 'growth'
      const eventos = await supabaseSelect(
        'cross_module_events',
        `or=(origem.eq.${modulo},destino.eq.${modulo})`
      )
      // Fallback: retorna eventos mock se Supabase não configurado
      if (!Array.isArray(eventos) || eventos.length === 0) {
        return res.status(200).json({ success: true, eventos: MOCK_EVENTS_GROWTH, fonte: 'mock' })
      }
      return res.status(200).json({ success: true, eventos, fonte: 'supabase' })
    }

    // ── GET /api/bridge?action=status ────────────────────────
    if (req.method === 'GET' && action === 'status') {
      const supabaseOk = !!(SUPABASE_REST && SUPABASE_KEY)
      return res.status(200).json({
        success: true,
        modulo: 'ben-growth-center',
        versao: '2.0',
        supabase: supabaseOk ? 'conectado' : 'mock',
        juris_url: JURIS_URL,
        growth_url: GROWTH_URL,
        timestamp: new Date().toISOString(),
        eventos_suportados: [
          'LEAD_QUALIFICADO', 'CLIENTE_ATIVO', 'CONTRATO_ASSINADO',
          'PROCESSO_ABERTO', 'HONORARIO_PAGO', 'ALERTA_PRAZO',
          'CAMPANHA_ATIVADA', 'RELATORIO_CONSOLIDADO',
        ],
      })
    }

    // ── POST: enviar evento para o Juris ─────────────────────
    if (req.method === 'POST' && action === 'enviar_evento') {
      const { tipo, destino = 'juris', payload = {}, agenteOrigem } = req.body

      if (!tipo) return res.status(400).json({ error: 'tipo é obrigatório' })

      const evento = {
        id: gerarId(),
        tipo,
        origem: 'growth',
        destino,
        timestamp: new Date().toISOString(),
        payload,
        status: 'pendente',
        agenteOrigem: agenteOrigem || 'Dr. Ben Growth',
        created_at: new Date().toISOString(),
      }

      // Salvar no Supabase
      await supabaseInsert('cross_module_events', evento)

      // Notificar o módulo destino
      await notificarModuloDestino(evento)
      evento.status = 'entregue'

      console.log('[Bridge Growth→Juris]', tipo, JSON.stringify(payload).slice(0, 100))
      return res.status(200).json({ success: true, evento })
    }

    // ── POST: envio de lead qualificado (atalho) ─────────────
    if (req.method === 'POST' && action === 'enviar_lead') {
      const { nome, telefone, email, area, score, valorEstimado, urgencia, origem: origemLead } = req.body

      const payload = { nome, telefone, email, area, score, valorEstimado, urgencia, origemLead }
      const evento = {
        id: gerarId(),
        tipo: 'LEAD_QUALIFICADO',
        origem: 'growth',
        destino: 'juris',
        timestamp: new Date().toISOString(),
        payload,
        status: 'pendente',
        agenteOrigem: 'Dr. Ben CRM',
        created_at: new Date().toISOString(),
      }

      await supabaseInsert('cross_module_events', evento)
      await notificarModuloDestino(evento)
      evento.status = 'entregue'

      return res.status(200).json({ success: true, evento, mensagem: `Lead ${nome} enviado ao Juris Center` })
    }

    // ── POST: receber evento vindo do Juris ──────────────────
    if (req.method === 'POST' && action === 'receber_evento') {
      const authHeader = req.headers.authorization || ''
      if (!authHeader.includes(BRIDGE_SECRET)) {
        return res.status(401).json({ error: 'Não autorizado' })
      }
      const { evento } = req.body
      if (!evento) return res.status(400).json({ error: 'evento ausente' })

      // Salvar evento recebido localmente
      await supabaseInsert('cross_module_events', { ...evento, recebido_em: new Date().toISOString() })

      // Processar automaticamente por tipo
      await processarEventoRecebido(evento)

      console.log('[Bridge Juris→Growth] Evento recebido:', evento.tipo)
      return res.status(200).json({ success: true, processado: true })
    }

    // ── POST: sincronizar (pull do Juris) ─────────────────────
    if (req.method === 'POST' && action === 'sincronizar') {
      try {
        const r = await fetch(`${JURIS_URL}/api/bridge?action=listar&modulo=juris`, {
          headers: { Authorization: `Bearer ${BRIDGE_SECRET}` },
        })
        const data = await r.json()
        return res.status(200).json({
          success: true,
          mensagem: 'Sincronização concluída',
          eventos_juris: data.eventos?.length || 0,
          timestamp: new Date().toISOString(),
        })
      } catch (e) {
        return res.status(200).json({
          success: false,
          mensagem: 'Juris Center indisponível no momento',
          erro: e.message,
        })
      }
    }

    return res.status(400).json({ error: 'action inválida ou não informada' })

  } catch (error) {
    console.error('[Bridge Growth] Erro:', error)
    return res.status(500).json({ success: false, error: error.message })
  }
}

// ── Enviar WhatsApp ao plantonista ──────────────────────────
async function whatsappPlantonista(mensagem) {
  const PLANTONISTA = process.env.PLANTONISTA_WHATSAPP
  const WTOKEN      = process.env.WHATSAPP_TOKEN
  const WID         = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!PLANTONISTA || !WTOKEN || !WID) {
    console.log('[Bridge] WhatsApp plantonista não configurado — mensagem logada:', mensagem.slice(0, 80))
    return
  }
  try {
    await fetch(`https://graph.facebook.com/v21.0/${WID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${WTOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: PLANTONISTA.replace(/\D/g, ''),
        type: 'text',
        text: { body: mensagem },
      }),
    })
    console.log('[Bridge] ✅ Plantonista notificado via WhatsApp:', PLANTONISTA)
  } catch (e) {
    console.error('[Bridge] Erro WhatsApp plantonista:', e.message)
  }
}

// ── Processar evento recebido do Juris ────────────────────────
async function processarEventoRecebido(evento) {
  switch (evento.tipo) {
    case 'CONTRATO_ASSINADO':
      console.log('[Bridge] Contrato assinado — dispara onboarding:', evento.payload?.cliente)
      await whatsappPlantonista(
        `✅ CONTRATO ASSINADO — BEN JURIS\n\n` +
        `👤 Cliente: ${evento.payload?.cliente || 'N/A'}\n` +
        `📋 Contrato: ${evento.payload?.contrato || 'N/A'}\n` +
        `💰 Honorário: R$ ${Number(evento.payload?.honorario || 0).toLocaleString('pt-BR')}\n\n` +
        `✅ Onboarding iniciado automaticamente.`
      )
      break
    case 'HONORARIO_PAGO':
      console.log('[Bridge] Honorário pago — atualiza CRM:', evento.payload?.valor)
      await whatsappPlantonista(
        `💰 HONORÁRIO RECEBIDO — BEN JURIS\n\n` +
        `👤 Cliente: ${evento.payload?.cliente || 'N/A'}\n` +
        `💵 Valor: R$ ${Number(evento.payload?.valor || 0).toLocaleString('pt-BR')}\n` +
        `📄 Ref: ${evento.payload?.referencia || 'N/A'}`
      )
      break
    case 'ALERTA_PRAZO':
      console.log('[Bridge] Alerta de prazo — notifica plantonista:', evento.payload?.prazo)
      await whatsappPlantonista(
        `🔴 ALERTA DE PRAZO — BEN JURIS\n\n` +
        `👤 Cliente: ${evento.payload?.cliente || 'N/A'}\n` +
        `📅 Prazo: ${evento.payload?.prazo || 'N/A'}\n` +
        `⚖️ ${evento.payload?.descricao || 'Prazo processual crítico'}\n` +
        `🚨 Urgência: ${(evento.payload?.urgencia || 'ALTA').toUpperCase()}\n\n` +
        `⚡ Ação imediata necessária!`
      )
      break
    case 'PROCESSO_ABERTO':
      console.log('[Bridge] Processo aberto — sugere conteúdo:', evento.payload?.sugestaoConteudo)
      await whatsappPlantonista(
        `⚖️ PROCESSO ABERTO — BEN JURIS\n\n` +
        `👤 Cliente: ${evento.payload?.cliente || 'N/A'}\n` +
        `📁 Nº: ${evento.payload?.processo || 'N/A'}\n` +
        `📋 Área: ${evento.payload?.area || 'N/A'}\n\n` +
        `💡 Sugestão de conteúdo: ${evento.payload?.sugestaoConteudo || 'N/A'}`
      )
      break
    default:
      console.log('[Bridge] Evento recebido sem handler específico:', evento.tipo)
  }
}

// ── Dados mock de fallback ────────────────────────────────────
const MOCK_EVENTS_GROWTH = [
  {
    id: 'evt-mock-001',
    tipo: 'LEAD_QUALIFICADO',
    origem: 'growth',
    destino: 'juris',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    payload: { cliente: 'Carlos Mendes', area: 'Tributário', score: 92, valorEstimado: 180000 },
    status: 'entregue',
    agenteOrigem: 'Dr. Ben CRM',
  },
  {
    id: 'evt-mock-002',
    tipo: 'CONTRATO_ASSINADO',
    origem: 'juris',
    destino: 'growth',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    payload: { cliente: 'Fernanda Costa', contrato: 'Juros Abusivos', honorario: 8500 },
    status: 'entregue',
    agenteOrigem: 'Dr. Ben Contratos',
  },
  {
    id: 'evt-mock-003',
    tipo: 'CAMPANHA_ATIVADA',
    origem: 'growth',
    destino: 'juris',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    payload: { campanha: 'Recuperação Tributária', orcamentoDia: 150, areaAlvo: 'Tributário' },
    status: 'entregue',
    agenteOrigem: 'Lex Campanhas',
  },
]
