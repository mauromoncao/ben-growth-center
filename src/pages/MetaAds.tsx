// ============================================================
// BEN GROWTH CENTER — Meta Ads Dashboard
// Ad Account: act_446623386807925
// ============================================================

import React, { useEffect, useState, useCallback } from 'react'
import {
  Megaphone, RefreshCw, Wifi, WifiOff, TrendingUp, TrendingDown,
  Play, Pause, Eye, MousePointer, DollarSign, Users,
  BarChart3, AlertCircle, ExternalLink, ChevronRight, Zap
} from 'lucide-react'
import { MetaAdsService, MetaCampanha, MetaInsight, META_AD_ACCOUNT_ID } from '../lib/metaAds'

// ─── Helpers ─────────────────────────────────────────────────
const fmtR = (v: string | number) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtN = (v: string | number) => Number(v).toLocaleString('pt-BR')
const fmtP = (v: string | number) => `${Number(v).toFixed(2)}%`

// ─── StatusBadge ─────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    ACTIVE:   'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    PAUSED:   'bg-amber-500/20 text-amber-300 border-amber-500/30',
    DELETED:  'bg-red-500/20 text-red-300 border-red-500/30',
    ARCHIVED: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  }
  const labels: Record<string, string> = {
    ACTIVE: '✅ Ativo', PAUSED: '⏸️ Pausado', DELETED: '🗑️ Deletado', ARCHIVED: '📦 Arquivado',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
      {labels[status] || status}
    </span>
  )
}

// ─── Card de Campanha ─────────────────────────────────────────
const CampanhaCard = ({
  campanha, insight, onToggle
}: {
  campanha: MetaCampanha
  insight?: MetaInsight
  onToggle: (id: string, status: 'ACTIVE' | 'PAUSED') => void
}) => {
  const [toggling, setToggling] = useState(false)

  const handleToggle = async () => {
    setToggling(true)
    const novoStatus = campanha.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    await onToggle(campanha.id, novoStatus)
    setToggling(false)
  }

  const roas      = MetaAdsService.getRoas(insight || {} as MetaInsight)
  const conversoes = MetaAdsService.getConversoes(insight || {} as MetaInsight)

  return (
    <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-white font-semibold truncate">{campanha.name}</p>
            <StatusBadge status={campanha.status} />
          </div>
          <p className="text-white/40 text-xs">
            ID: <span className="font-mono">{campanha.id}</span>
            {campanha.objective && ` · ${campanha.objective}`}
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`p-2 rounded-xl border transition-all flex-shrink-0 ${
            campanha.status === 'ACTIVE'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
          } disabled:opacity-50`}
          title={campanha.status === 'ACTIVE' ? 'Pausar' : 'Ativar'}
        >
          {toggling
            ? <RefreshCw className="w-4 h-4 animate-spin" />
            : campanha.status === 'ACTIVE'
              ? <Pause className="w-4 h-4" />
              : <Play className="w-4 h-4" />
          }
        </button>
      </div>

      {/* Métricas */}
      {insight ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Investido',    value: fmtR(insight.spend),        icon: <DollarSign className="w-3 h-3" />, color: 'text-white' },
            { label: 'Impressões',  value: fmtN(insight.impressions),   icon: <Eye className="w-3 h-3" />,        color: 'text-blue-300' },
            { label: 'Cliques',     value: fmtN(insight.clicks),        icon: <MousePointer className="w-3 h-3" />, color: 'text-purple-300' },
            { label: 'CTR',         value: fmtP(insight.ctr),           icon: <TrendingUp className="w-3 h-3" />, color: 'text-emerald-300' },
          ].map(m => (
            <div key={m.label} className="bg-white/5 rounded-xl p-3">
              <div className="flex items-center gap-1 text-white/40 mb-1">
                {m.icon}
                <span className="text-xs">{m.label}</span>
              </div>
              <p className={`font-bold text-sm ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <p className="text-white/30 text-xs">Métricas disponíveis após inserir o Access Token</p>
        </div>
      )}

      {/* ROAS + Conversões */}
      {insight && (roas > 0 || conversoes > 0) && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
          {roas > 0 && (
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-white/60">ROAS: </span>
              <span className={`text-xs font-bold ${roas >= 3 ? 'text-emerald-400' : roas >= 1.5 ? 'text-amber-400' : 'text-red-400'}`}>
                {roas.toFixed(2)}x
              </span>
            </div>
          )}
          {conversoes > 0 && (
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#D4A017]" />
              <span className="text-xs text-white/60">Conversões: </span>
              <span className="text-xs font-bold text-[#D4A017]">{conversoes}</span>
            </div>
          )}
          {insight.cpc && (
            <div className="flex items-center gap-1.5">
              <MousePointer className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs text-white/60">CPC: </span>
              <span className="text-xs font-bold text-purple-300">{fmtR(insight.cpc)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Página Principal ─────────────────────────────────────────
export default function MetaAds() {
  const [campanhas, setCampanhas]     = useState<MetaCampanha[]>([])
  const [insights, setInsights]       = useState<MetaInsight[]>([])
  const [gastos, setGastos]           = useState<{ hoje: any; mes: any }>({ hoje: null, mes: null })
  const [loading, setLoading]         = useState(true)
  const [conexao, setConexao]         = useState<'ok' | 'pendente' | 'erro' | 'verificando'>('verificando')
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [filtro, setFiltro]           = useState<'todos' | 'ACTIVE' | 'PAUSED'>('todos')

  const carregar = useCallback(async () => {
    setLoading(true)
    const [camps, ins, gas] = await Promise.all([
      MetaAdsService.listarCampanhas(),
      MetaAdsService.buscarInsights(),
      MetaAdsService.buscarGastos(),
    ])
    setCampanhas(camps)
    setInsights(ins)
    setGastos(gas)
    setLoading(false)
  }, [])

  const verificar = useCallback(async () => {
    setConexao('verificando')
    const r = await MetaAdsService.verificarToken()
    if (r.pendente) setConexao('pendente')
    else if (r.ok)  { setConexao('ok'); setNomeUsuario(r.nome || '') }
    else             setConexao('erro')
  }, [])

  useEffect(() => { verificar(); carregar() }, [verificar, carregar])

  const handleToggle = async (id: string, status: 'ACTIVE' | 'PAUSED') => {
    const ok = await MetaAdsService.atualizarStatus(id, status)
    if (ok) carregar()
  }

  // Encontrar insight de uma campanha
  const getInsight = (nome: string) =>
    insights.find(i => i.campaign_name === nome)

  // Filtrar campanhas
  const campsFiltradas = campanhas.filter(c =>
    filtro === 'todos' || c.status === filtro
  )

  // Totais dos insights
  const totalGasto      = insights.reduce((s, i) => s + parseFloat(i.spend || '0'), 0)
  const totalImpressoes = insights.reduce((s, i) => s + parseInt(i.impressions || '0'), 0)
  const totalCliques    = insights.reduce((s, i) => s + parseInt(i.clicks || '0'), 0)
  const totalConversoes = insights.reduce((s, i) => s + MetaAdsService.getConversoes(i), 0)
  const ctrMedio        = totalImpressoes > 0 ? (totalCliques / totalImpressoes) * 100 : 0

  return (
    <div className="min-h-screen bg-[#070d1f] text-white p-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #1877F2, #42b72a)' }}>
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            Meta Ads
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Conta: <span className="font-mono text-white/70">{META_AD_ACCOUNT_ID}</span>
            {nomeUsuario && <span className="ml-2 text-[#D4A017]">· {nomeUsuario}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Status conexão */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${
            conexao === 'ok'      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : conexao === 'pendente' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            : conexao === 'erro'  ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-slate-500/10 border-slate-500/30 text-slate-400'
          }`}>
            {conexao === 'ok' ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {conexao === 'ok'       ? 'Conectado'
             : conexao === 'pendente' ? '⚠️ Token pendente'
             : conexao === 'erro'   ? 'Erro de conexão'
             : 'Verificando…'}
          </div>
          <button onClick={carregar} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white/60 transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <a href="https://adsmanager.facebook.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/70 hover:text-white hover:border-white/20 text-sm transition-all">
            <ExternalLink className="w-4 h-4" /> Ads Manager
          </a>
        </div>
      </div>

      {/* Banner Token Pendente */}
      {conexao === 'pendente' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 font-semibold mb-1">Access Token pendente</p>
            <p className="text-amber-300/70 text-sm mb-3">
              A conta <span className="font-mono font-bold">{META_AD_ACCOUNT_ID}</span> está configurada.
              Para ver dados reais de campanhas, insira o Access Token:
            </p>
            <div className="bg-black/30 rounded-xl p-3 font-mono text-xs text-white/60 mb-3">
              1. Acesse: <span className="text-blue-400">https://developers.facebook.com</span><br/>
              2. Explorador de API Graph → Gerar Token<br/>
              3. Permissões: ads_read + ads_management<br/>
              4. Cole o token em Configurações → Meta Ads
            </div>
            <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
              <ExternalLink className="w-3.5 h-3.5" /> Abrir Explorador de API Graph
            </a>
          </div>
        </div>
      )}

      {/* Stats gerais — últimos 30 dias */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Gasto (30d)',     value: fmtR(totalGasto),       icon: <DollarSign className="w-5 h-5" />, color: 'text-white',       bg: 'bg-white/5',           border: 'border-white/10' },
          { label: 'Impressões',      value: fmtN(totalImpressoes),  icon: <Eye className="w-5 h-5" />,        color: 'text-blue-300',    bg: 'bg-blue-500/10',       border: 'border-blue-500/20' },
          { label: 'Cliques',         value: fmtN(totalCliques),     icon: <MousePointer className="w-5 h-5" />,color: 'text-purple-300', bg: 'bg-purple-500/10',     border: 'border-purple-500/20' },
          { label: 'Conversões',      value: fmtN(totalConversoes),  icon: <Zap className="w-5 h-5" />,        color: 'text-[#D4A017]',   bg: 'bg-amber-500/10',      border: 'border-amber-500/20' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={s.color}>{s.icon}</div>
              <p className="text-white/50 text-xs font-medium">{s.label}</p>
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Gastos hoje / mês */}
      {(gastos.hoje || gastos.mes) && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {gastos.hoje && (
            <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-4">
              <p className="text-white/50 text-xs font-medium mb-2">📅 Gasto Hoje</p>
              <p className="text-2xl font-bold text-white">{fmtR(gastos.hoje.spend)}</p>
              <p className="text-white/30 text-xs mt-1">{fmtN(gastos.hoje.impressions)} impressões · {fmtN(gastos.hoje.clicks)} cliques</p>
            </div>
          )}
          {gastos.mes && (
            <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-4">
              <p className="text-white/50 text-xs font-medium mb-2">📆 Gasto no Mês</p>
              <p className="text-2xl font-bold text-[#D4A017]">{fmtR(gastos.mes.spend)}</p>
              <p className="text-white/30 text-xs mt-1">{fmtN(gastos.mes.impressions)} impressões · {fmtN(gastos.mes.clicks)} cliques</p>
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {([
          { key: 'todos',  label: 'Todas' },
          { key: 'ACTIVE', label: '✅ Ativas' },
          { key: 'PAUSED', label: '⏸️ Pausadas' },
        ] as const).map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
              filtro === f.key
                ? 'bg-[#1877F2]/20 border-[#1877F2] text-blue-300'
                : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
            }`}>
            {f.label}
            {f.key !== 'todos' && (
              <span className="ml-1.5 opacity-60">
                ({campanhas.filter(c => c.status === f.key).length})
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-white/30 text-xs self-center">
          {campsFiltradas.length} campanha{campsFiltradas.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Lista de campanhas */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : campsFiltradas.length === 0 ? (
        <div className="text-center py-20">
          <Megaphone className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 font-medium">
            {conexao === 'pendente' ? 'Insira o Access Token para ver campanhas' : 'Nenhuma campanha encontrada'}
          </p>
          <p className="text-white/25 text-sm mt-1">
            Conta: {META_AD_ACCOUNT_ID}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {campsFiltradas.map(camp => (
            <CampanhaCard
              key={camp.id}
              campanha={camp}
              insight={getInsight(camp.name)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}
