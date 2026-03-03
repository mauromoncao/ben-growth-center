// ============================================================
// BEN GROWTH CENTER — Meta Ads Integration
// Ad Account: act_4244231065854550 (Dr Mauro Monção)
// ============================================================

export const META_AD_ACCOUNT_ID = 'act_4244231065854550'

// ─── Tipos ───────────────────────────────────────────────────
export interface MetaCampanha {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  objective: string
  daily_budget?: string
  lifetime_budget?: string
  start_time?: string
  stop_time?: string
  created_time: string
}

export interface MetaInsight {
  campaign_name?: string
  campaign_id?: string
  impressions: string
  clicks: string
  spend: string
  ctr: string
  cpc: string
  cpm: string
  reach: string
  frequency?: string
  date_start: string
  date_stop: string
  actions?: Array<{ action_type: string; value: string }>
  purchase_roas?: Array<{ action_type: string; value: string }>
  cost_per_action_type?: Array<{ action_type: string; value: string }>
}

export interface MetaContaAds {
  id: string
  name: string
  account_status: number
  currency: string
  timezone_name: string
  amount_spent?: string
  balance?: string
}

export interface MetaGastos {
  hoje: { spend: string; impressions: string; clicks: string; reach: string } | null
  mes:  { spend: string; impressions: string; clicks: string; reach: string } | null
}

// ─── Status account ──────────────────────────────────────────
export const ACCOUNT_STATUS: Record<number, string> = {
  1: '✅ Ativa', 2: '🔴 Desativada', 3: '⚠️ Não confirmada',
  7: '⏳ Pendente', 8: '❌ Em revisão', 9: '🚫 Encerrada',
}

// ─── Serviço Meta Ads ─────────────────────────────────────────
export const MetaAdsService = {

  // Verificar se token está configurado
  async verificarToken(): Promise<{ ok: boolean; pendente?: boolean; nome?: string; erro?: string }> {
    try {
      const r = await fetch('/api/meta-ads?action=teste')
      if (!r.ok) return { ok: false, erro: `HTTP ${r.status}` }
      const data = await r.json()
      if (data.status === 'pending_token') return { ok: false, pendente: true }
      return { ok: true, nome: data.name }
    } catch (e: any) {
      return { ok: false, erro: e.message }
    }
  },

  // Dados da conta
  async buscarConta(): Promise<MetaContaAds | null> {
    try {
      const r = await fetch('/api/meta-ads?action=conta')
      if (!r.ok) return null
      const data = await r.json()
      if (data.status === 'pending_token') return null
      return data
    } catch { return null }
  },

  // Listar campanhas
  async listarCampanhas(): Promise<MetaCampanha[]> {
    try {
      const r = await fetch('/api/meta-ads?action=campanhas&limit=50')
      if (!r.ok) return []
      const data = await r.json()
      if (data.status === 'pending_token') return []
      return data.data || []
    } catch { return [] }
  },

  // Insights últimos 30 dias
  async buscarInsights(since?: string, until?: string): Promise<MetaInsight[]> {
    try {
      let url = '/api/meta-ads?action=insights&limit=50'
      if (since && until) url += `&since=${since}&until=${until}`
      const r = await fetch(url)
      if (!r.ok) return []
      const data = await r.json()
      if (data.status === 'pending_token') return []
      return data.data || []
    } catch { return [] }
  },

  // Gastos hoje e no mês
  async buscarGastos(): Promise<MetaGastos> {
    try {
      const r = await fetch('/api/meta-ads?action=gastos')
      if (!r.ok) return { hoje: null, mes: null }
      const data = await r.json()
      if (data.status === 'pending_token') return { hoje: null, mes: null }
      return data
    } catch { return { hoje: null, mes: null } }
  },

  // Pausar ou ativar campanha
  async atualizarStatus(campaignId: string, status: 'ACTIVE' | 'PAUSED'): Promise<boolean> {
    try {
      const r = await fetch('/api/meta-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'atualizar_status', campaign_id: campaignId, status }),
      })
      return r.ok
    } catch { return false }
  },

  // ── Helpers de formatação ─────────────────────────────────
  fmtValor: (v: string | number) =>
    Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),

  fmtNum: (v: string | number) =>
    Number(v).toLocaleString('pt-BR'),

  fmtPct: (v: string | number) =>
    `${Number(v).toFixed(2)}%`,

  getRoas(insight: MetaInsight): number {
    const roas = insight.purchase_roas?.find(a => a.action_type === 'omni_purchase')
    return roas ? parseFloat(roas.value) : 0
  },

  getConversoes(insight: MetaInsight): number {
    const conv = insight.actions?.find(a =>
      ['lead', 'offsite_conversion.fb_pixel_lead', 'omni_lead'].includes(a.action_type)
    )
    return conv ? parseInt(conv.value) : 0
  },

  getStatusLabel(status: string): string {
    return { ACTIVE: '✅ Ativo', PAUSED: '⏸️ Pausado', DELETED: '🗑️ Deletado', ARCHIVED: '📦 Arquivado' }[status] || status
  },

  getStatusColor(status: string): string {
    return {
      ACTIVE:   'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      PAUSED:   'bg-amber-500/20 text-amber-300 border-amber-500/30',
      DELETED:  'bg-red-500/20 text-red-300 border-red-500/30',
      ARCHIVED: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    }[status] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'
  },
}
