import React, { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { mockDailyMetrics, mockKPIs } from '../lib/mockData'
import { formatCurrency, formatNumber } from '../lib/utils'

const spendData = mockDailyMetrics.map(d => ({
  date: d.date,
  Google: d.googleSpent,
  Meta: d.metaSpent,
  Total: d.googleSpent + d.metaSpent,
}))

const conversionData = mockDailyMetrics.map(d => ({
  date: d.date,
  Google: d.googleConversions,
  Meta: d.metaConversions,
  Total: d.googleConversions + d.metaConversions,
}))

export default function Analytics() {
  const [periodo, setPeriodo] = useState<'7' | '14' | '30'>('14')
  const sliced = mockDailyMetrics.slice(-Number(periodo))
  const spendSliced = spendData.slice(-Number(periodo))
  const convSliced = conversionData.slice(-Number(periodo))

  const totalSpent = sliced.reduce((a, d) => a + d.googleSpent + d.metaSpent, 0)
  const totalLeads = sliced.reduce((a, d) => a + d.leads, 0)
  const totalClicks = sliced.reduce((a, d) => a + d.googleClicks + d.metaClicks, 0)
  const avgCPL = totalLeads > 0 ? totalSpent / totalLeads : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-white/60 text-sm mt-1">Performance detalhada de todas as campanhas</p>
        </div>
        <div className="flex gap-1 bg-white/6 border border-white/10 rounded-lg p-1">
          {(['7', '14', '30'] as const).map(p => (
            <button key={p} onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${periodo === p ? 'bg-navy text-white' : 'text-white/80 hover:bg-white/4'}`}>
              {p} dias
            </button>
          ))}
        </div>
      </div>

      {/* KPIs do período */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Investido', value: formatCurrency(totalSpent) },
          { label: 'Total de Leads', value: formatNumber(totalLeads) },
          { label: 'Total de Cliques', value: formatNumber(totalClicks) },
          { label: 'CPL Médio', value: formatCurrency(avgCPL) },
        ].map(item => (
          <div key={item.label} className="card text-center">
            <p className="text-2xl font-bold text-gold">{item.value}</p>
            <p className="text-white/60 text-xs mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Gasto por plataforma */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Investimento por Plataforma (R$)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={spendSliced}>
            <defs>
              <linearGradient id="colorGoogle" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4285F4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4285F4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorMeta" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fill: "rgba(159,176,215,0.65)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
            <Tooltip formatter={(v) => [formatCurrency(Number(v)), '']} />
            <Legend />
            <Area type="monotone" dataKey="Google" stroke="#4285F4" fill="url(#colorGoogle)" strokeWidth={2} />
            <Area type="monotone" dataKey="Meta" stroke="#6366f1" fill="url(#colorMeta)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Leads e Conversões */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Leads por Dia</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sliced}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(159,176,215,0.65)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(159,176,215,0.65)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="leads" fill="#c9a84c" radius={[4, 4, 0, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-semibold text-white mb-4">Conversões por Plataforma</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={convSliced}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(159,176,215,0.65)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(159,176,215,0.65)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Google" fill="#4285F4" radius={[4, 4, 0, 0]} stackId="stack" />
              <Bar dataKey="Meta" fill="#6366f1" radius={[4, 4, 0, 0]} stackId="stack" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cliques por plataforma */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Cliques por Plataforma</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={sliced}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fill: "rgba(159,176,215,0.65)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(159,176,215,0.65)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="googleClicks" stroke="#4285F4" strokeWidth={2} dot={false} name="Google" />
            <Line type="monotone" dataKey="metaClicks" stroke="#6366f1" strokeWidth={2} dot={false} name="Meta" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insights automáticos da IA */}
      <div className="card border-l-4 border-gold">
        <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
          🤖 Insights da IA (Lex Analytics)
        </h2>
        <div className="space-y-2">
          {[
            { icon: '📈', text: 'As campanhas de Tributário têm CTR 42% acima da média do setor jurídico (3.59% vs 2.5%). Recomendo aumentar o orçamento em 20%.' },
            { icon: '⚠️', text: 'A campanha "Revisão de Contrato Bancário" tem CPL de R$ 78 — 90% acima das demais. Sugerindo revisão das palavras-chave.' },
            { icon: '🎯', text: 'O retargeting no Meta Ads tem ROAS de 8.2x — melhor performance de todo o portfólio. Recomendo escalar o orçamento.' },
            { icon: '📅', text: 'Quinta e sexta-feira concentram 38% dos leads. Considere aumentar lances nesses dias.' },
          ].map((insight, i) => (
            <div key={i} className="flex gap-3 p-3 bg-amber-50 rounded-lg">
              <span className="text-lg">{insight.icon}</span>
              <p className="text-white/90 text-sm">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
