// ============================================================
// BEN GROWTH CENTER — Google Ads Service Types & Functions
// Accounts: 384-372-0833 (escritório) | 469-833-8084 (estudos)
// ============================================================

export const GOOGLE_ADS_ACCOUNTS = {
  escritorio: { id: '3843720833', label: 'Escritório', email: 'mauromoncaoadv.escritorio@gmail.com' },
  estudos:    { id: '4698338084', label: 'Estudos',    email: 'mauromoncaoestudos@gmail.com'        },
} as const

export type AccountKey = keyof typeof GOOGLE_ADS_ACCOUNTS

// ─── Tipos ───────────────────────────────────────────────────
export interface GAInsights {
  account:          string
  periodo:          string
  impressoes:       number
  cliques:          number
  gasto:            number
  conversoes:       number
  ctr:              number
  cpc:              number
  impression_share: number
}

export interface GACampanha {
  id:         string
  nome:       string
  status:     'ENABLED' | 'PAUSED' | 'REMOVED' | string
  tipo:       string
  impressoes: number
  cliques:    number
  gasto:      number
  conversoes: number
  ctr:        number
  cpc:        number
  cpa:        number
}

export interface GADiario {
  data:       string
  impressoes: number
  cliques:    number
  gasto:      number
  conversoes: number
}

export interface GAKeyword {
  texto:      string
  tipo:       string
  status:     string
  campanha:   string
  impressoes: number
  cliques:    number
  gasto:      number
  conversoes: number
  cpc:        number
  quality:    number
}

export interface GAAdGroup {
  id:         string
  nome:       string
  status:     string
  campanha:   string
  impressoes: number
  cliques:    number
  gasto:      number
  conversoes: number
  ctr:        number
  cpc:        number
}

// ─── Base URL do proxy ───────────────────────────────────────
const BASE = '/api/google-ads'

// ─── Chamada genérica ─────────────────────────────────────────
async function call<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${BASE}?${qs}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro Google Ads')
  return data as T
}

// ─── Serviço Google Ads ──────────────────────────────────────
export const GoogleAdsService = {
  async testar(account: AccountKey = 'escritorio') {
    return call<{ status: string; customer: object; account: string }>({
      action: 'teste', account,
    })
  },

  async insights(account: AccountKey = 'escritorio', days = '30') {
    return call<GAInsights>({ action: 'insights', account, days })
  },

  async campanhas(account: AccountKey = 'escritorio', days = '30') {
    return call<{ campanhas: GACampanha[] }>({ action: 'campanhas', account, days })
  },

  async diario(account: AccountKey = 'escritorio', days = '30') {
    return call<{ diario: GADiario[] }>({ action: 'diario', account, days })
  },

  async adGroups(account: AccountKey = 'escritorio', days = '30') {
    return call<{ grupos: GAAdGroup[] }>({ action: 'adgroups', account, days })
  },

  async keywords(account: AccountKey = 'escritorio', days = '30') {
    return call<{ keywords: GAKeyword[] }>({ action: 'keywords', account, days })
  },

  async updateStatus(account: AccountKey, campaignId: string, status: 'ENABLED' | 'PAUSED') {
    const res = await fetch(`${BASE}?action=update_status&account=${account}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, status }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Falha ao atualizar status')
    return data
  },
}

// ─── Formatadores ─────────────────────────────────────────────
export const fmtR = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export const fmtN = (v: number) =>
  new Intl.NumberFormat('pt-BR').format(v)

export const fmtP = (v: number, decimals = 2) =>
  `${(v * 100).toFixed(decimals)}%`

export const statusColor = (s: string) => ({
  ENABLED: '#22c55e',
  PAUSED:  '#f59e0b',
  REMOVED: '#ef4444',
}[s] ?? '#94a3b8')

export const statusLabel = (s: string) => ({
  ENABLED: 'Ativa',
  PAUSED:  'Pausada',
  REMOVED: 'Removida',
}[s] ?? s)
