import React, { useState } from 'react'
import { Plus, Pause, Play, Trash2, TrendingUp, TrendingDown, Filter } from 'lucide-react'
import { mockCampaigns } from '../lib/mockData'
import { formatCurrency, formatNumber, getStatusColor, getStatusLabel } from '../lib/utils'

export default function Campanhas() {
  const [filter, setFilter] = useState<'all' | 'google' | 'meta'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all')

  const filtered = mockCampaigns.filter(c => {
    if (filter !== 'all' && c.platform !== filter) return false
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    return true
  })

  const totals = filtered.reduce((acc, c) => ({
    budget: acc.budget + c.budget,
    spent: acc.spent + c.spent,
    clicks: acc.clicks + c.clicks,
    conversions: acc.conversions + c.conversions,
    impressions: acc.impressions + c.impressions,
  }), { budget: 0, spent: 0, clicks: 0, conversions: 0, impressions: 0 })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Campanhas</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie suas campanhas no Google Ads e Meta Ads</p>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Nova Campanha via IA
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {(['all', 'google', 'meta'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === f ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              {f === 'all' ? 'Todas' : f === 'google' ? '🔵 Google' : '🟣 Meta'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {(['all', 'active', 'paused'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${statusFilter === s ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              {s === 'all' ? 'Todos' : s === 'active' ? '✅ Ativos' : '⏸️ Pausados'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Orçamento Total', value: formatCurrency(totals.budget) },
          { label: 'Gasto Total', value: formatCurrency(totals.spent) },
          { label: 'Impressões', value: formatNumber(totals.impressions) },
          { label: 'Cliques', value: formatNumber(totals.clicks) },
          { label: 'Conversões', value: formatNumber(totals.conversions) },
        ].map(item => (
          <div key={item.label} className="card text-center">
            <p className="text-2xl font-bold text-primary">{item.value}</p>
            <p className="text-slate-500 text-xs mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Campaign Cards */}
      <div className="space-y-4">
        {filtered.map((campaign) => (
          <div key={campaign.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${campaign.platform === 'google' ? 'bg-blue-50' : 'bg-indigo-50'}`}>
                  {campaign.platform === 'google' ? '🔵' : '🟣'}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{campaign.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge-blue">{campaign.area}</span>
                    <span className={getStatusColor(campaign.status)}>{getStatusLabel(campaign.status)}</span>
                    <span className="text-slate-400 text-xs">Desde {campaign.startDate}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {campaign.status === 'active'
                  ? <button className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"><Pause className="w-4 h-4" /></button>
                  : <button className="p-2 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"><Play className="w-4 h-4" /></button>}
                <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-3 lg:grid-cols-7 gap-3">
              {[
                { label: 'Orçamento', value: formatCurrency(campaign.budget) },
                { label: 'Gasto', value: formatCurrency(campaign.spent) },
                { label: 'Impressões', value: formatNumber(campaign.impressions) },
                { label: 'Cliques', value: formatNumber(campaign.clicks) },
                { label: 'CTR', value: `${campaign.ctr}%` },
                { label: 'CPC', value: formatCurrency(campaign.cpc) },
                { label: 'CPL', value: formatCurrency(campaign.cpl) },
              ].map(m => (
                <div key={m.label} className="text-center">
                  <p className="text-slate-400 text-xs">{m.label}</p>
                  <p className="font-semibold text-slate-800 text-sm">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Budget progress */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Uso do Orçamento</span>
                <span>{formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget)} ({Math.round((campaign.spent / campaign.budget) * 100)}%)</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full">
                <div className={`h-full rounded-full transition-all ${campaign.spent / campaign.budget > 0.9 ? 'bg-red-400' : campaign.spent / campaign.budget > 0.7 ? 'bg-amber-400' : 'bg-green-400'}`}
                  style={{ width: `${Math.min((campaign.spent / campaign.budget) * 100, 100)}%` }} />
              </div>
            </div>

            {/* ROAS badge */}
            <div className="flex items-center gap-2 mt-3">
              {campaign.roas >= 3
                ? <TrendingUp className="w-4 h-4 text-green-500" />
                : <TrendingDown className="w-4 h-4 text-red-500" />}
              <span className={`text-sm font-medium ${campaign.roas >= 3 ? 'text-green-600' : 'text-red-600'}`}>
                ROAS {campaign.roas}x
              </span>
              <span className="text-slate-400 text-xs">·</span>
              <span className="text-slate-500 text-xs">{campaign.conversions} conversões</span>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Nova Campanha */}
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-primary-300 transition-colors cursor-pointer">
        <div className="w-12 h-12 bg-primary-50 rounded-xl mx-auto flex items-center justify-center mb-3">
          <Plus className="w-6 h-6 text-primary" />
        </div>
        <p className="font-medium text-slate-700">Criar Nova Campanha com IA</p>
        <p className="text-slate-400 text-sm mt-1">O Lex Campanhas pesquisa palavras-chave, gera os textos e cria a campanha automaticamente</p>
        <button className="btn-primary mt-4 text-sm">Acionar Lex Campanhas</button>
      </div>
    </div>
  )
}
