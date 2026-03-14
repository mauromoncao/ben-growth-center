// ============================================================
// BEN ECOSYSTEM — Cross-Module Integration Bridge
// Comunicação bidirecional: Ben Growth Center ↔ Ben Juris Center
// API real: /api/bridge  — Fallback: dados mock
// ============================================================

const BRIDGE_API = '/api/bridge'

// ── Funções reais de comunicação ─────────────────────────────

export async function listarEventosBridge(): Promise<CrossModuleEvent[]> {
  try {
    const r = await fetch(`${BRIDGE_API}?action=listar&modulo=growth`)
    const data = await r.json()
    return data.eventos || MOCK_CROSS_EVENTS
  } catch {
    return MOCK_CROSS_EVENTS
  }
}

export async function enviarLeadParaJuris(lead: {
  nome: string; telefone: string; email?: string
  area: string; score: number; valorEstimado?: number; urgencia: string
}): Promise<{ success: boolean; mensagem: string }> {
  try {
    const r = await fetch(BRIDGE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'enviar_lead', ...lead }),
    })
    const data = await r.json()
    return { success: data.success, mensagem: data.mensagem || 'Lead enviado ao Juris Center' }
  } catch {
    return { success: false, mensagem: 'Erro de conexão com a bridge' }
  }
}

export async function enviarEventoBridge(
  tipo: CrossModuleEventType,
  payload: Record<string, unknown>,
  agenteOrigem?: string
): Promise<{ success: boolean }> {
  try {
    const r = await fetch(BRIDGE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'enviar_evento', tipo, payload, agenteOrigem }),
    })
    const data = await r.json()
    return { success: data.success }
  } catch {
    return { success: false }
  }
}

export async function sincronizarComJuris(): Promise<{ success: boolean; mensagem: string; eventos_juris?: number }> {
  try {
    const r = await fetch(BRIDGE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sincronizar' }),
    })
    return r.json()
  } catch {
    return { success: false, mensagem: 'Falha na sincronização' }
  }
}

export async function getStatusBridge(): Promise<{ supabase: string; versao: string; timestamp: string }> {
  try {
    const r = await fetch(`${BRIDGE_API}?action=status`)
    return r.json()
  } catch {
    return { supabase: 'offline', versao: '2.0', timestamp: new Date().toISOString() }
  }
}

export const BEN_MODULES = {
  GROWTH: {
    id: 'ben-growth-center',
    nome: 'Ben Growth Center',
    modulo: 'Módulo 01',
    cor: '#00b37e',
    url: 'https://ben-growth-center.vercel.app',
  },
  JURIS: {
    id: 'ben-juris-center',
    nome: 'Ben Juris Center',
    modulo: 'Módulo 02',
    cor: '#3b82f6',
    url: 'https://ben-juris-center.vercel.app',
  },
} as const

// ─── Tipos de eventos cruzados ───────────────────────────────
export type CrossModuleEventType =
  | 'LEAD_QUALIFICADO'       // Growth → Juris: lead convertido em cliente jurídico
  | 'CLIENTE_ATIVO'          // Growth → Juris: novo cliente ativo no CRM
  | 'CONTRATO_ASSINADO'      // Juris → Growth: contrato fechado, iniciar onboarding
  | 'PROCESSO_ABERTO'        // Juris → Growth: processo novo, gerar conteúdo relacionado
  | 'HONORARIO_PAGO'         // Juris → Growth: financeiro confirmado
  | 'ALERTA_PRAZO'           // Juris → Growth: prazo crítico, notificar cliente
  | 'CAMPANHA_ATIVADA'       // Growth → Juris: campanha ativa para área jurídica
  | 'RELATORIO_CONSOLIDADO'  // Ambos: relatório unificado gerado

export interface CrossModuleEvent {
  id: string
  tipo: CrossModuleEventType
  origem: 'growth' | 'juris'
  destino: 'growth' | 'juris'
  timestamp: string
  payload: Record<string, unknown>
  status: 'pendente' | 'entregue' | 'erro'
  agenteOrigem?: string
}

export interface LeadComercial {
  id: string
  nome: string
  telefone: string
  email?: string
  areaJuridica: string
  score: number
  valorEstimado: number
  urgencia: 'alta' | 'media' | 'baixa'
  origem: 'WhatsApp' | 'Google Ads' | 'Site' | 'Indicação'
  dataCaptura: string
  agenteCaptou: string // ex: "Dr. Ben Atendimento"
  statusJuris?: 'aguardando' | 'triagem' | 'processo_aberto' | 'cliente_ativo'
}

export interface SinalComercialJuris {
  processoNumero: string
  cliente: string
  area: string
  fase: string
  dataAbertura: string
  honorarioTotal: number
  honorarioPago: number
  proximoPrazo?: string
  campanhaRelacionada?: string // slug da campanha no Growth
}

// ─── Simulação de eventos em tempo real ──────────────────────
export const MOCK_CROSS_EVENTS: CrossModuleEvent[] = [
  {
    id: 'evt-001',
    tipo: 'LEAD_QUALIFICADO',
    origem: 'growth',
    destino: 'juris',
    timestamp: '2026-03-01 09:14',
    payload: {
      cliente: 'José Alves Silva',
      telefone: '(86) 99821-4477',
      areaJuridica: 'Tributário',
      score: 88,
      valorEstimado: 45000,
    },
    status: 'entregue',
    agenteOrigem: 'Dr. Ben Atendimento',
  },
  {
    id: 'evt-002',
    tipo: 'CONTRATO_ASSINADO',
    origem: 'juris',
    destino: 'growth',
    timestamp: '2026-03-01 10:02',
    payload: {
      cliente: 'Comércio Santos Ltda',
      contrato: 'Recuperação PIS/COFINS',
      honorario: 12000,
      prazoContrato: '12 meses',
    },
    status: 'entregue',
    agenteOrigem: 'Dr. Ben Contratos',
  },
  {
    id: 'evt-003',
    tipo: 'PROCESSO_ABERTO',
    origem: 'juris',
    destino: 'growth',
    timestamp: '2026-03-01 11:30',
    payload: {
      processo: '0001234-22.2026.8.18.0140',
      area: 'Previdenciário',
      cliente: 'Maria Gomes',
      sugestaoConteudo: 'Artigo sobre aposentadoria especial rural no Piauí',
    },
    status: 'entregue',
    agenteOrigem: 'Dr. Ben Petições',
  },
  {
    id: 'evt-004',
    tipo: 'CAMPANHA_ATIVADA',
    origem: 'growth',
    destino: 'juris',
    timestamp: '2026-03-01 08:00',
    payload: {
      campanha: 'Recuperação Tributária — Google Ads',
      orcamentoDia: 150,
      leadsEsperados: 8,
      areaAlvo: 'Tributário',
    },
    status: 'entregue',
    agenteOrigem: 'Dr. Ben Campanhas',
  },
  {
    id: 'evt-005',
    tipo: 'ALERTA_PRAZO',
    origem: 'juris',
    destino: 'growth',
    timestamp: '2026-03-01 07:00',
    payload: {
      cliente: 'Auto Peças Piauí',
      prazo: '2026-03-05',
      descricao: 'Prazo para apresentação de defesa administrativa SEFAZ',
      urgencia: 'alta',
    },
    status: 'pendente',
    agenteOrigem: 'Dr. Ben Auditoria',
  },
]

export const MOCK_LEADS_PIPELINE: LeadComercial[] = [
  {
    id: 'lead-001',
    nome: 'José Alves Silva',
    telefone: '(86) 99821-4477',
    email: 'jose.alves@email.com',
    areaJuridica: 'Tributário',
    score: 88,
    valorEstimado: 45000,
    urgencia: 'alta',
    origem: 'WhatsApp',
    dataCaptura: '2026-03-01 09:14',
    agenteCaptou: 'Dr. Ben Atendimento',
    statusJuris: 'triagem',
  },
  {
    id: 'lead-002',
    nome: 'Comércio Santos Ltda',
    telefone: '(86) 3221-9988',
    areaJuridica: 'Tributário',
    score: 95,
    valorEstimado: 120000,
    urgencia: 'alta',
    origem: 'Google Ads',
    dataCaptura: '2026-02-28 14:30',
    agenteCaptou: 'Dr. Ben Atendimento',
    statusJuris: 'cliente_ativo',
  },
  {
    id: 'lead-003',
    nome: 'Maria Gomes',
    telefone: '(86) 99711-3344',
    areaJuridica: 'Previdenciário',
    score: 72,
    valorEstimado: 18000,
    urgencia: 'media',
    origem: 'Site',
    dataCaptura: '2026-03-01 11:15',
    agenteCaptou: 'Dr. Ben Atendimento',
    statusJuris: 'processo_aberto',
  },
]

export const MOCK_SINAIS_JURIS: SinalComercialJuris[] = [
  {
    processoNumero: '0001234-22.2026.8.18.0140',
    cliente: 'Maria Gomes',
    area: 'Previdenciário',
    fase: 'Inicial — aguardando citação',
    dataAbertura: '2026-03-01',
    honorarioTotal: 4500,
    honorarioPago: 1500,
    proximoPrazo: '2026-03-15',
    campanhaRelacionada: 'aposentadoria-especial-rural',
  },
  {
    processoNumero: '0009876-11.2025.8.18.0001',
    cliente: 'Comércio Santos Ltda',
    area: 'Tributário',
    fase: 'Recurso Administrativo — CARF',
    dataAbertura: '2025-11-10',
    honorarioTotal: 35000,
    honorarioPago: 20000,
    proximoPrazo: '2026-03-20',
    campanhaRelacionada: 'recuperacao-tributaria',
  },
]

// ─── Funções utilitárias de integração ───────────────────────

export function getEventosPorTipo(tipo: CrossModuleEventType): CrossModuleEvent[] {
  return MOCK_CROSS_EVENTS.filter(e => e.tipo === tipo)
}

export function getEventosPendentes(): CrossModuleEvent[] {
  return MOCK_CROSS_EVENTS.filter(e => e.status === 'pendente')
}

export function getLeadsPorStatusJuris(status: LeadComercial['statusJuris']): LeadComercial[] {
  return MOCK_LEADS_PIPELINE.filter(l => l.statusJuris === status)
}

export function calcularTaxaConversaoJuris(): number {
  const total = MOCK_LEADS_PIPELINE.length
  const convertidos = MOCK_LEADS_PIPELINE.filter(
    l => l.statusJuris === 'cliente_ativo' || l.statusJuris === 'processo_aberto'
  ).length
  return total > 0 ? Math.round((convertidos / total) * 100) : 0
}

export function getCorEventType(tipo: CrossModuleEventType): string {
  const cores: Record<CrossModuleEventType, string> = {
    LEAD_QUALIFICADO:      'bg-green-500/20 text-green-400 border-green-500/30',
    CLIENTE_ATIVO:         'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    CONTRATO_ASSINADO:     'bg-blue-500/20 text-blue-400 border-blue-500/30',
    PROCESSO_ABERTO:       'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    HONORARIO_PAGO:        'bg-amber-500/20 text-amber-400 border-amber-500/30',
    ALERTA_PRAZO:          'bg-red-500/20 text-red-400 border-red-500/30',
    CAMPANHA_ATIVADA:      'bg-purple-500/20 text-purple-400 border-purple-500/30',
    RELATORIO_CONSOLIDADO: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  }
  return cores[tipo]
}

export function getLabelEventType(tipo: CrossModuleEventType): string {
  const labels: Record<CrossModuleEventType, string> = {
    LEAD_QUALIFICADO:      '🎯 Lead Qualificado',
    CLIENTE_ATIVO:         '✅ Cliente Ativo',
    CONTRATO_ASSINADO:     '📋 Contrato Assinado',
    PROCESSO_ABERTO:       '🔱 Processo Aberto',
    HONORARIO_PAGO:        '💰 Honorário Pago',
    ALERTA_PRAZO:          '🔴 Alerta de Prazo',
    CAMPANHA_ATIVADA:      '📢 Campanha Ativa',
    RELATORIO_CONSOLIDADO: '📊 Relatório Consolidado',
  }
  return labels[tipo]
}
