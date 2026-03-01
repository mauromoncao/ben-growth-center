import React from 'react'
import {
  TrendingUp, TrendingDown, Users, DollarSign,
  Target, Bot, FileText, ArrowUpRight,
  AlertCircle, CheckCircle2, Clock, Megaphone, BarChart3
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { mockKPIs, mockDailyMetrics, mockAgentActivities, mockLeads, mockCampaigns } from '../lib/mockData'
import { formatCurrency, formatNumber, formatPercent, getStatusColor, getStatusLabel } from '../lib/utils'

// ── helpers ──────────────────────────────────────────────────────────────────
const glass = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 16,
} as React.CSSProperties

const glassDark = {
  background: 'rgba(0,0,0,0.20)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
} as React.CSSProperties

const tooltipStyle = {
  background: '#0f2044',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  color: '#fff',
  fontFamily: 'Outfit, sans-serif',
  fontSize: 12,
}

const PIE_COLORS = ['#D4A017', '#00b37e', '#38bdf8', '#f59e0b']
const sourceData = [
  { name: 'Google Ads', value: 34 },
  { name: 'Meta Ads',   value: 41 },
  { name: 'Orgânico',   value: 17 },
  { name: 'WhatsApp',   value:  8 },
]
const areaData = [
  { name: 'Tributário',     leads: 38, conversões: 8 },
  { name: 'Previdenciário', leads: 29, conversões: 6 },
  { name: 'Bancário',       leads: 15, conversões: 2 },
  { name: 'Geral',          leads:  7, conversões: 1 },
]

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ title, value, variation, icon, accent, subtitle }: {
  title: string; value: string; variation?: number;
  icon: React.ReactNode; accent: string; subtitle?: string;
}) {
  const isPositive = variation !== undefined && variation > 0
  return (
    <div style={{ ...glass, borderLeft: `3px solid ${accent}` }} className="p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium font-sans" style={{ color: 'rgba(159,176,215,0.75)' }}>{title}</p>
          <p className="text-2xl font-bold text-white font-serif mt-1" style={{ letterSpacing: '-0.02em' }}>{value}</p>
          {subtitle && <p className="text-xs font-sans mt-0.5" style={{ color: 'rgba(159,176,215,0.55)' }}>{subtitle}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}22` }}>
          {icon}
        </div>
      </div>
      {variation !== undefined && (
        <div className="flex items-center gap-1.5">
          {isPositive
            ? <TrendingUp className="w-3.5 h-3.5" style={{ color: '#00b37e' }} />
            : <TrendingDown className="w-3.5 h-3.5" style={{ color: '#e11d48' }} />}
          <span className="text-sm font-bold font-sans" style={{ color: isPositive ? '#00b37e' : '#e11d48' }}>
            {formatPercent(variation)}
          </span>
          <span className="text-xs font-sans" style={{ color: 'rgba(159,176,215,0.55)' }}>vs. mês anterior</span>
        </div>
      )}
    </div>
  )
}

// ── componente principal ──────────────────────────────────────────────────────
export default function Dashboard() {
  const recentLeads      = mockLeads.slice(0, 5)
  const recentActivities = mockAgentActivities.slice(0, 5)

  return (
    <div className="space-y-6">

      {/* ── HEADER DOURADO ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4 rounded-2xl px-6 py-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #C8960E 0%, #D4A017 40%, #F0C040 70%, #C8960E 100%)',
          border: '1px solid rgba(212,160,23,0.60)',
          boxShadow: '0 4px 32px rgba(212,160,23,0.25)',
        }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.18) 0%, transparent 60%)' }} />
        <div className="relative">
          <h1 className="text-2xl font-bold font-serif" style={{ color: '#0f2044', letterSpacing: '-0.01em' }}>
            Dashboard Ads
          </h1>
          <p className="text-sm mt-1 font-sans" style={{ color: 'rgba(15,32,68,0.70)' }}>
            Campanhas · Leads · IA · Analytics — Fevereiro 2026
          </p>
        </div>
        <div className="flex gap-3 relative">
          <button className="btn-navy flex items-center gap-2 text-sm">
            <Bot className="w-4 h-4" />Acionar Agente
          </button>
          <button className="btn-ghost flex items-center gap-2 text-sm"
            style={{ background: 'rgba(15,32,68,0.18)', border: '1px solid rgba(15,32,68,0.35)', color: '#0f2044' }}>
            <FileText className="w-4 h-4" />Relatório
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Leads Gerados"   value={formatNumber(mockKPIs.totalLeads)}      variation={mockKPIs.leadsVariation}  icon={<Users      className="w-5 h-5" style={{ color: '#38bdf8' }} />} accent="#38bdf8" subtitle="Este mês" />
        <KPICard title="Investimento"    value={formatCurrency(mockKPIs.totalSpent)}    variation={mockKPIs.spentVariation}  icon={<DollarSign className="w-5 h-5" style={{ color: '#00b37e' }} />} accent="#00b37e" subtitle="Google + Meta" />
        <KPICard title="Custo por Lead"  value={formatCurrency(mockKPIs.avgCPL)}        variation={mockKPIs.cplVariation}    icon={<Target     className="w-5 h-5" style={{ color: '#a78bfa' }} />} accent="#a78bfa" subtitle="CPL médio" />
        <KPICard title="ROAS Geral"      value={`${mockKPIs.roas}x`}                   variation={mockKPIs.roasVariation}   icon={<TrendingUp className="w-5 h-5" style={{ color: '#D4A017' }} />} accent="#D4A017" subtitle="Retorno sobre investimento" />
      </div>

      {/* ── KPI SECUNDÁRIOS ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Impressões',      value: formatNumber(mockKPIs.totalImpressions), emoji: '👁️',  accent: '#38bdf8' },
          { label: 'Cliques',         value: formatNumber(mockKPIs.totalClicks),       emoji: '🖱️',  accent: '#00b37e' },
          { label: 'CTR Médio',       value: `${mockKPIs.avgCTR}%`,                   emoji: '📊',  accent: '#D4A017' },
          { label: 'Taxa Conversão',  value: `${mockKPIs.conversionRate}%`,            emoji: '✅',  accent: '#a78bfa' },
        ].map(item => (
          <div key={item.label} className="rounded-xl p-4 flex items-center gap-3"
            style={{ ...glass, borderLeft: `3px solid ${item.accent}` }}>
            <span className="text-2xl">{item.emoji}</span>
            <div>
              <p className="text-xs font-sans" style={{ color: 'rgba(159,176,215,0.65)' }}>{item.label}</p>
              <p className="text-lg font-bold text-white font-serif">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── CHARTS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl" style={glass}>
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-sm text-white font-sans flex items-center gap-2">
              <BarChart3 size={16} style={{ color: '#D4A017' }} />Cliques e Leads — Últimos 14 dias
            </span>
            <div className="flex gap-4 text-xs" style={{ color: 'rgba(159,176,215,0.65)' }}>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 inline-block rounded" /> Google</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-violet-400 inline-block rounded" /> Meta</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{ background: '#D4A017' }} /> Leads</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={mockDailyMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(159,176,215,0.65)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(159,176,215,0.65)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [formatNumber(Number(v)), n === 'googleClicks' ? 'Google' : n === 'metaClicks' ? 'Meta' : 'Leads']} />
              <Line type="monotone" dataKey="googleClicks" stroke="#38bdf8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="metaClicks"   stroke="#a78bfa" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="leads"        stroke="#D4A017" strokeWidth={2} dot={{ r: 3, fill: '#D4A017' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie — Origem dos Leads */}
        <div className="p-5 rounded-2xl" style={glass}>
          <span className="font-bold text-sm text-white font-sans flex items-center gap-2 mb-4">
            <Target size={16} style={{ color: '#00b37e' }} />Origem dos Leads
          </span>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={sourceData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {sourceData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Participação']} />
              <Legend iconType="circle" iconSize={8}
                formatter={(v) => <span style={{ color: 'rgba(159,176,215,0.80)', fontFamily: 'Outfit', fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── BAR + ATIVIDADE ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar */}
        <div className="p-5 rounded-2xl" style={glass}>
          <span className="font-bold text-sm text-white font-sans flex items-center gap-2 mb-4">
            <Megaphone size={16} style={{ color: '#D4A017' }} />Leads por Área Jurídica
          </span>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={areaData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fill: 'rgba(159,176,215,0.65)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(159,176,215,0.65)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="leads"     fill="#0f2044" radius={[4,4,0,0]} name="Leads" />
              <Bar dataKey="conversões" fill="#D4A017" radius={[4,4,0,0]} name="Conversões" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Atividade dos Agentes */}
        <div className="p-5 rounded-2xl" style={glassDark}>
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-sm text-white font-sans flex items-center gap-2">
              <Bot size={16} style={{ color: '#a78bfa' }} />Atividade dos Agentes IA
            </span>
            <a href="/agentes" className="text-xs font-sans flex items-center gap-1 hover:underline"
              style={{ color: '#D4A017' }}>
              Ver todos <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {activity.status === 'success'   && <CheckCircle2 className="w-4 h-4" style={{ color: '#00b37e' }} />}
                  {activity.status === 'running'   && <Clock className="w-4 h-4 animate-spin" style={{ color: '#38bdf8' }} />}
                  {activity.status === 'error'     && <AlertCircle className="w-4 h-4" style={{ color: '#e11d48' }} />}
                  {activity.status === 'scheduled' && <Clock className="w-4 h-4" style={{ color: 'rgba(159,176,215,0.50)' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium font-sans text-white/90 truncate">{activity.action}</p>
                  <p className="text-xs font-sans mt-0.5" style={{ color: 'rgba(159,176,215,0.55)' }}>
                    {activity.agent} · {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TABELA — Leads Recentes ─────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={glassDark}>
        <div className="px-5 py-3.5 flex items-center gap-2"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Users size={16} style={{ color: '#D4A017' }} />
          <span className="font-bold text-white text-sm font-sans">Leads Recentes</span>
          <a href="/leads" className="ml-auto text-xs font-sans flex items-center gap-1 hover:underline"
            style={{ color: '#D4A017' }}>
            Ver todos <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Nome', 'Área', 'Origem', 'Status', 'Valor Est.'].map(h => (
                  <th key={h} className="text-xs font-bold uppercase px-4 py-3 text-left font-sans"
                    style={{ color: 'rgba(159,176,215,0.65)', letterSpacing: '0.07em', background: 'rgba(0,0,0,0.15)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentLeads.map((lead) => (
                <tr key={lead.id}
                  className="transition-colors cursor-pointer hover:bg-white/5"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-white font-sans">{lead.name}</p>
                    <p className="text-xs font-sans" style={{ color: 'rgba(159,176,215,0.55)' }}>{lead.createdAt}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge badge-cyan">{lead.area}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-sans" style={{ color: 'rgba(159,176,215,0.80)' }}>
                    {getStatusLabel(lead.source)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={getStatusColor(lead.status)}>{getStatusLabel(lead.status)}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-white font-sans">
                    {lead.value ? formatCurrency(lead.value) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CAMPANHAS ATIVAS ───────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={glassDark}>
        <div className="px-5 py-3.5 flex items-center gap-2"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Megaphone size={16} style={{ color: '#D4A017' }} />
          <span className="font-bold text-white text-sm font-sans">Campanhas Ativas</span>
          <a href="/campanhas" className="ml-auto text-xs font-sans flex items-center gap-1 hover:underline"
            style={{ color: '#D4A017' }}>
            Gerenciar <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
          {mockCampaigns.filter(c => c.status === 'active').slice(0, 3).map((c) => (
            <div key={c.id} className="rounded-xl p-4 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212,160,23,0.40)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}>
              <div className="mb-3">
                <p className="font-semibold text-white text-sm font-sans truncate">{c.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="badge" style={{ background: c.platform === 'google' ? 'rgba(66,133,244,0.20)' : 'rgba(99,102,241,0.20)', color: c.platform === 'google' ? '#93c5fd' : '#c4b5fd' }}>
                    {c.platform === 'google' ? '🔵 Google' : '🟣 Meta'}
                  </span>
                  <span className="badge badge-emerald">{getStatusLabel(c.status)}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Gasto',  value: formatCurrency(c.spent) },
                  { label: 'CPL',    value: formatCurrency(c.cpl) },
                  { label: 'Leads',  value: String(c.conversions) },
                ].map(m => (
                  <div key={m.label}>
                    <p className="text-xs font-sans" style={{ color: 'rgba(159,176,215,0.55)' }}>{m.label}</p>
                    <p className="text-sm font-bold text-white font-sans">{m.value}</p>
                  </div>
                ))}
              </div>
              {/* Budget bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs font-sans mb-1"
                  style={{ color: 'rgba(159,176,215,0.55)' }}>
                  <span>Orçamento</span>
                  <span>{Math.round((c.spent / c.budget) * 100)}%</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min((c.spent / c.budget) * 100, 100)}%`, background: '#D4A017' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
