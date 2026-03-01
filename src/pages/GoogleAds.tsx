import React, { useState, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  TrendingUp, TrendingDown, MousePointerClick, Eye,
  DollarSign, Target, RefreshCw, AlertCircle,
  Play, Pause, ChevronDown, Search, Filter,
  BarChart2, Users, Zap, ArrowUpRight
} from 'lucide-react'
import {
  GoogleAdsService, GOOGLE_ADS_ACCOUNTS,
  fmtR, fmtN, fmtP, statusColor, statusLabel,
  type AccountKey, type GACampanha, type GAInsights, type GADiario
} from '../lib/googleAds'

// ─── KPI Card ────────────────────────────────────────────────
function KPICard({
  label, value, sub, icon: Icon, trend, color = '#D4A017'
}: {
  label: string; value: string; sub?: string
  icon: React.ElementType; trend?: number; color?: string
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
          <Icon size={18} style={{ color }} />
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 text-xs font-medium"
            style={{ color: trend >= 0 ? '#22c55e' : '#ef4444' }}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white font-sans">{value}</p>
      <p className="text-xs font-sans mt-0.5" style={{ color: 'rgba(159,176,215,0.70)' }}>{label}</p>
      {sub && <p className="text-xs font-sans mt-1" style={{ color: 'rgba(159,176,215,0.50)' }}>{sub}</p>}
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const color = statusColor(status)
  const label = statusLabel(status)
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: `${color}18`, color, border: `1px solid ${color}35` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

// ─── Campanha Card ────────────────────────────────────────────
function CampanhaCard({
  camp, onToggle
}: {
  camp: GACampanha
  onToggle: (id: string, status: 'ENABLED' | 'PAUSED') => void
}) {
  const [toggling, setToggling] = useState(false)

  const handleToggle = async () => {
    setToggling(true)
    const newStatus = camp.status === 'ENABLED' ? 'PAUSED' : 'ENABLED'
    await onToggle(camp.id, newStatus)
    setToggling(false)
  }

  return (
    <div className="card p-4 hover:border-gold/30 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold font-sans truncate">{camp.nome}</p>
          <p className="text-xs font-sans mt-0.5" style={{ color: 'rgba(159,176,215,0.55)' }}>
            {camp.tipo?.replace('_', ' ')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={camp.status} />
          {camp.status !== 'REMOVED' && (
            <button
              onClick={handleToggle}
              disabled={toggling}
              title={camp.status === 'ENABLED' ? 'Pausar' : 'Ativar'}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: camp.status === 'ENABLED' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                border: camp.status === 'ENABLED' ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(34,197,94,0.35)',
                color: camp.status === 'ENABLED' ? '#f59e0b' : '#22c55e',
                opacity: toggling ? 0.5 : 1,
              }}>
              {camp.status === 'ENABLED' ? <Pause size={12} /> : <Play size={12} />}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Gasto', value: fmtR(camp.gasto) },
          { label: 'Cliques', value: fmtN(camp.cliques) },
          { label: 'CTR', value: fmtP(camp.ctr) },
          { label: 'Impressões', value: fmtN(camp.impressoes) },
          { label: 'Conversões', value: fmtN(camp.conversoes) },
          { label: 'CPA', value: camp.cpa > 0 ? fmtR(camp.cpa) : '—' },
        ].map(item => (
          <div key={item.label} className="text-center p-2 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-xs font-bold text-white font-sans">{item.value}</p>
            <p className="text-xs font-sans" style={{ color: 'rgba(159,176,215,0.55)' }}>{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tela de credenciais pendentes ───────────────────────────
function PendingCredentials({ account }: { account: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(212,160,23,0.12)', border: '1px solid rgba(212,160,23,0.30)' }}>
        <Zap size={28} style={{ color: '#D4A017' }} />
      </div>
      <h3 className="text-white text-lg font-bold font-sans mb-2">Google Ads — Configurando</h3>
      <p className="text-sm font-sans mb-1" style={{ color: 'rgba(159,176,215,0.70)' }}>
        Conta selecionada: <strong className="text-white">{account}</strong>
      </p>
      <p className="text-sm font-sans mb-6 max-w-sm" style={{ color: 'rgba(159,176,215,0.60)' }}>
        As credenciais OAuth estão sendo configuradas. Em produção, os dados reais das campanhas serão exibidos aqui.
      </p>
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm text-left">
        {[
          { label: 'MCC ID', value: '104-876-3500', ok: true },
          { label: 'Developer Token', value: 'fFzZ3NC...', ok: true },
          { label: 'OAuth Client ID', value: 'Pendente', ok: false },
          { label: 'Refresh Token', value: 'Pendente', ok: false },
        ].map(item => (
          <div key={item.label} className="card p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ background: item.ok ? '#22c55e' : '#f59e0b' }} />
              <p className="text-xs font-sans font-medium" style={{ color: 'rgba(159,176,215,0.70)' }}>{item.label}</p>
            </div>
            <p className="text-xs font-mono text-white truncate">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────
export default function GoogleAds() {
  const [account, setAccount] = useState<AccountKey>('escritorio')
  const [days, setDays] = useState('30')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingCredentials, setPendingCredentials] = useState(false)

  const [insights, setInsights] = useState<GAInsights | null>(null)
  const [campanhas, setCampanhas] = useState<GACampanha[]>([])
  const [diario, setDiario] = useState<GADiario[]>([])
  const [tab, setTab] = useState<'campanhas' | 'grafico' | 'keywords'>('campanhas')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPendingCredentials(false)
    try {
      // Testar conexão primeiro
      const teste = await GoogleAdsService.testar(account) as any
      if (teste.status === 'pending_credentials') {
        setPendingCredentials(true)
        setLoading(false)
        return
      }

      const [ins, camps, daily] = await Promise.all([
        GoogleAdsService.insights(account, days),
        GoogleAdsService.campanhas(account, days),
        GoogleAdsService.diario(account, days),
      ])
      setInsights(ins)
      setCampanhas(camps.campanhas)
      setDiario(daily.diario)
    } catch (e: any) {
      // Se retornar pending_credentials no erro
      if (e.message?.includes('pending_credentials') || e.message?.includes('Configure')) {
        setPendingCredentials(true)
      } else {
        setError(e.message || 'Erro ao carregar dados')
      }
    } finally {
      setLoading(false)
    }
  }, [account, days])

  useEffect(() => { load() }, [load])

  const handleToggle = async (campaignId: string, status: 'ENABLED' | 'PAUSED') => {
    try {
      await GoogleAdsService.updateStatus(account, campaignId, status)
      await load()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const campsFiltradas = campanhas.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-sans">Google Ads</h1>
          <p className="text-sm font-sans mt-0.5" style={{ color: 'rgba(159,176,215,0.65)' }}>
            Performance de campanhas — MCC 104-876-3500
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Seletor de conta */}
          <div className="relative">
            <select
              value={account}
              onChange={e => setAccount(e.target.value as AccountKey)}
              className="appearance-none font-sans text-sm text-white pl-3 pr-8 py-2 rounded-xl cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
              {Object.entries(GOOGLE_ADS_ACCOUNTS).map(([key, val]) => (
                <option key={key} value={key} style={{ background: '#0f2044' }}>
                  {val.label} ({val.id.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')})
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'rgba(159,176,215,0.60)' }} />
          </div>

          {/* Período */}
          <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
            {['7', '14', '30'].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium font-sans transition-all"
                style={days === d
                  ? { background: '#D4A017', color: '#0f2044', fontWeight: 700 }
                  : { color: 'rgba(159,176,215,0.80)' }}>
                {d}d
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button onClick={load} disabled={loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(159,176,215,0.70)' }}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)' }}>
          <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
          <p className="text-sm font-sans" style={{ color: '#fca5a5' }}>{error}</p>
        </div>
      )}

      {/* Credenciais pendentes */}
      {pendingCredentials && (
        <PendingCredentials account={GOOGLE_ADS_ACCOUNTS[account].label} />
      )}

      {/* Conteúdo principal */}
      {!pendingCredentials && (
        <>
          {/* KPIs */}
          {loading && !insights ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="w-10 h-10 rounded-xl mb-3" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div className="h-6 w-24 rounded mb-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div className="h-3 w-16 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
                </div>
              ))}
            </div>
          ) : insights ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard label="Total Investido" value={fmtR(insights.gasto)}
                sub={`${days} dias`} icon={DollarSign} color="#D4A017" />
              <KPICard label="Cliques" value={fmtN(insights.cliques)}
                sub={`CTR: ${fmtP(insights.ctr)}`} icon={MousePointerClick} color="#3b82f6" />
              <KPICard label="Impressões" value={fmtN(insights.impressoes)}
                sub={`Share: ${fmtP(insights.impression_share)}`} icon={Eye} color="#8b5cf6" />
              <KPICard label="Conversões" value={fmtN(insights.conversoes)}
                sub={insights.conversoes > 0 ? `CPA: ${fmtR(insights.gasto / insights.conversoes)}` : 'Sem conversões'}
                icon={Target} color="#22c55e" />
            </div>
          ) : null}

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl p-1 w-fit"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {([
              { id: 'campanhas', label: 'Campanhas', icon: BarChart2 },
              { id: 'grafico',   label: 'Gráfico',   icon: TrendingUp },
            ] as const).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium font-sans transition-all"
                style={tab === t.id
                  ? { background: '#D4A017', color: '#0f2044', fontWeight: 700 }
                  : { color: 'rgba(159,176,215,0.80)' }}>
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab: Campanhas */}
          {tab === 'campanhas' && (
            <div className="space-y-4">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(159,176,215,0.50)' }} />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar campanha..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-sans text-white placeholder:text-white/30 outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }} />
              </div>

              {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="card p-4 animate-pulse h-40" />
                  ))}
                </div>
              ) : campsFiltradas.length === 0 ? (
                <div className="card p-10 text-center">
                  <Filter size={24} className="mx-auto mb-3" style={{ color: 'rgba(159,176,215,0.40)' }} />
                  <p className="text-sm font-sans" style={{ color: 'rgba(159,176,215,0.60)' }}>
                    {search ? 'Nenhuma campanha encontrada' : 'Nenhuma campanha ativa'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {campsFiltradas.map(c => (
                    <CampanhaCard key={c.id} camp={c} onToggle={handleToggle} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Gráfico */}
          {tab === 'grafico' && (
            <div className="space-y-4">
              {/* Gasto diário */}
              <div className="card p-5">
                <p className="text-white font-semibold font-sans mb-4">Investimento Diário (R$)</p>
                {loading ? (
                  <div className="h-48 animate-pulse rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={diario}>
                      <defs>
                        <linearGradient id="gastoGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4A017" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#D4A017" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="data" tick={{ fill: 'rgba(159,176,215,0.60)', fontSize: 11 }}
                        tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fill: 'rgba(159,176,215,0.60)', fontSize: 11 }}
                        tickFormatter={v => `R$${v}`} width={50} />
                      <Tooltip
                        contentStyle={{ background: '#0a1628', border: '1px solid rgba(212,160,23,0.30)', borderRadius: 8 }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(v: number) => [fmtR(v), 'Gasto']} />
                      <Area type="monotone" dataKey="gasto" stroke="#D4A017" fill="url(#gastoGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Cliques e Impressões */}
              <div className="card p-5">
                <p className="text-white font-semibold font-sans mb-4">Cliques vs Impressões</p>
                {loading ? (
                  <div className="h-48 animate-pulse rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={diario}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="data" tick={{ fill: 'rgba(159,176,215,0.60)', fontSize: 11 }}
                        tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fill: 'rgba(159,176,215,0.60)', fontSize: 11 }} width={45} />
                      <Tooltip
                        contentStyle={{ background: '#0a1628', border: '1px solid rgba(212,160,23,0.30)', borderRadius: 8 }}
                        labelStyle={{ color: '#fff' }} />
                      <Legend wrapperStyle={{ color: 'rgba(159,176,215,0.70)', fontSize: 12 }} />
                      <Bar dataKey="cliques" name="Cliques" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="conversoes" name="Conversões" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {/* Resumo de contas */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-white font-sans">Contas Vinculadas ao MCC</p>
              <span className="text-xs font-sans px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
                MCC 104-876-3500
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(GOOGLE_ADS_ACCOUNTS).map(([key, val]) => (
                <button key={key} onClick={() => setAccount(key as AccountKey)}
                  className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                  style={{
                    background: account === key ? 'rgba(212,160,23,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${account === key ? 'rgba(212,160,23,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: account === key ? '#D4A017' : 'rgba(255,255,255,0.08)', color: account === key ? '#0f2044' : 'rgba(159,176,215,0.70)' }}>
                    <Users size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold font-sans text-white">{val.label}</p>
                    <p className="text-xs font-sans truncate" style={{ color: 'rgba(159,176,215,0.60)' }}>
                      {val.id.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}
                    </p>
                  </div>
                  <ArrowUpRight size={14} style={{ color: account === key ? '#D4A017' : 'rgba(159,176,215,0.40)' }} />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
