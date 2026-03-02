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

// ── style helpers ─────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
}

const tooltipStyle = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  color: '#1F2937',
  fontFamily: 'Inter, sans-serif',
  fontSize: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
}

const PIE_COLORS = ['#1E40AF', '#16A34A', '#D97706', '#7C3AED']
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

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({ title, value, variation, icon, accent, subtitle }: {
  title: string; value: string; variation?: number;
  icon: React.ReactNode; accent: string; subtitle?: string;
}) {
  const isPositive = variation !== undefined && variation > 0
  return (
    <div style={{ ...card, borderTop: `3px solid ${accent}` }} className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{title}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#111827', letterSpacing: '-0.02em' }}>{value}</p>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{subtitle}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}18` }}>
          {icon}
        </div>
      </div>
      {variation !== undefined && (
        <div className="flex items-center gap-1.5">
          {isPositive
            ? <TrendingUp className="w-3.5 h-3.5" style={{ color: '#16A34A' }} />
            : <TrendingDown className="w-3.5 h-3.5" style={{ color: '#DC2626' }} />}
          <span className="text-sm font-bold" style={{ color: isPositive ? '#16A34A' : '#DC2626' }}>
            {formatPercent(variation)}
          </span>
          <span className="text-xs" style={{ color: '#9CA3AF' }}>vs. mês anterior</span>
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

      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#111827' }}>Dashboard Ads</h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>
            Campanhas · Leads · IA · Analytics — Fevereiro 2026
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary flex items-center gap-2 text-sm">
            <Bot className="w-4 h-4" />Acionar Agente
          </button>
          <button className="btn-secondary flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4" />Relatório
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Leads Gerados"   value={formatNumber(mockKPIs.totalLeads)}      variation={mockKPIs.leadsVariation}  icon={<Users      className="w-5 h-5" style={{ color: '#1E40AF' }} />} accent="#1E40AF" subtitle="Este mês" />
        <KPICard title="Investimento"    value={formatCurrency(mockKPIs.totalSpent)}    variation={mockKPIs.spentVariation}  icon={<DollarSign className="w-5 h-5" style={{ color: '#16A34A' }} />} accent="#16A34A" subtitle="Google + Meta" />
        <KPICard title="Custo por Lead"  value={formatCurrency(mockKPIs.avgCPL)}        variation={mockKPIs.cplVariation}    icon={<Target     className="w-5 h-5" style={{ color: '#7C3AED' }} />} accent="#7C3AED" subtitle="CPL médio" />
        <KPICard title="ROAS Geral"      value={`${mockKPIs.roas}x`}                   variation={mockKPIs.roasVariation}   icon={<TrendingUp className="w-5 h-5" style={{ color: '#D97706' }} />} accent="#D97706" subtitle="Retorno sobre investimento" />
      </div>

      {/* ── KPI SECUNDÁRIOS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Impressões',     value: formatNumber(mockKPIs.totalImpressions), icon: '👁️',  accent: '#1E40AF' },
          { label: 'Cliques',        value: formatNumber(mockKPIs.totalClicks),       icon: '🖱️',  accent: '#16A34A' },
          { label: 'CTR Médio',      value: `${mockKPIs.avgCTR}%`,                   icon: '📊',  accent: '#D97706' },
          { label: 'Taxa Conversão', value: `${mockKPIs.conversionRate}%`,            icon: '✅',  accent: '#7C3AED' },
        ].map(item => (
          <div key={item.label} style={{ ...card, borderLeft: `3px solid ${item.accent}` }} className="p-4 flex items-center gap-3">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{item.label}</p>
              <p className="text-lg font-bold" style={{ color: '#111827' }}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── CHARTS ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl" style={card}>
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-sm flex items-center gap-2" style={{ color: '#111827' }}>
              <BarChart3 size={16} style={{ color: '#D4A017' }} />Cliques e Leads — Últimos 14 dias
            </span>
            <div className="flex gap-4 text-xs" style={{ color: '#9CA3AF' }}>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" /> Google</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-violet-500 inline-block rounded" /> Meta</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{ background: '#D4A017' }} /> Leads</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={mockDailyMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [formatNumber(Number(v)), n === 'googleClicks' ? 'Google' : n === 'metaClicks' ? 'Meta' : 'Leads']} />
              <Line type="monotone" dataKey="googleClicks" stroke="#3B82F6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="metaClicks"   stroke="#8B5CF6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="leads"        stroke="#D4A017" strokeWidth={2} dot={{ r: 3, fill: '#D4A017' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie — Origem dos Leads */}
        <div className="p-5 rounded-xl" style={card}>
          <span className="font-semibold text-sm flex items-center gap-2 mb-4" style={{ color: '#111827' }}>
            <Target size={16} style={{ color: '#16A34A' }} />Origem dos Leads
          </span>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={sourceData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {sourceData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Participação']} />
              <Legend iconType="circle" iconSize={8}
                formatter={(v) => <span style={{ color: '#6B7280', fontFamily: 'Inter', fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── BAR + ATIVIDADE ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar */}
        <div className="p-5 rounded-xl" style={card}>
          <span className="font-semibold text-sm flex items-center gap-2 mb-4" style={{ color: '#111827' }}>
            <Megaphone size={16} style={{ color: '#D4A017' }} />Leads por Área Jurídica
          </span>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={areaData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="leads"      fill="#DBEAFE" radius={[4,4,0,0]} name="Leads" />
              <Bar dataKey="conversões" fill="#1E40AF" radius={[4,4,0,0]} name="Conversões" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Atividade dos Agentes */}
        <div className="p-5 rounded-xl" style={card}>
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-sm flex items-center gap-2" style={{ color: '#111827' }}>
              <Bot size={16} style={{ color: '#7C3AED' }} />Atividade dos Agentes IA
            </span>
            <a href="/agentes" className="text-xs flex items-center gap-1 hover:underline"
              style={{ color: '#1E40AF' }}>
              Ver todos <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-2.5 rounded-lg" style={{ background: '#F9FAFB' }}>
                <div className="mt-0.5 flex-shrink-0">
                  {activity.status === 'success'   && <CheckCircle2 className="w-4 h-4" style={{ color: '#16A34A' }} />}
                  {activity.status === 'running'   && <Clock className="w-4 h-4 animate-spin" style={{ color: '#1E40AF' }} />}
                  {activity.status === 'error'     && <AlertCircle className="w-4 h-4" style={{ color: '#DC2626' }} />}
                  {activity.status === 'scheduled' && <Clock className="w-4 h-4" style={{ color: '#9CA3AF' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#111827' }}>{activity.action}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                    {activity.agent} · {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TABELA — Leads Recentes ──────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={card}>
        <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid #F3F4F6' }}>
          <Users size={16} style={{ color: '#D4A017' }} />
          <span className="font-semibold text-sm" style={{ color: '#111827' }}>Leads Recentes</span>
          <a href="/leads" className="ml-auto text-xs flex items-center gap-1 hover:underline"
            style={{ color: '#1E40AF' }}>
            Ver todos <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #F3F4F6', background: '#F9FAFB' }}>
                {['Nome', 'Área', 'Origem', 'Status', 'Valor Est.'].map(h => (
                  <th key={h} className="text-xs font-semibold uppercase px-4 py-3 text-left tracking-wide"
                    style={{ color: '#6B7280' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentLeads.map((lead) => (
                <tr key={lead.id}
                  className="transition-colors cursor-pointer"
                  style={{ borderBottom: '1px solid #F9FAFB' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold" style={{ color: '#111827' }}>{lead.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{lead.createdAt}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge badge-blue">{lead.area}</span>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#6B7280' }}>
                    {getStatusLabel(lead.source)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={getStatusColor(lead.status)}>{getStatusLabel(lead.status)}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold" style={{ color: '#111827' }}>
                    {lead.value ? formatCurrency(lead.value) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CAMPANHAS ATIVAS ────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={card}>
        <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid #F3F4F6' }}>
          <Megaphone size={16} style={{ color: '#D4A017' }} />
          <span className="font-semibold text-sm" style={{ color: '#111827' }}>Campanhas Ativas</span>
          <a href="/campanhas" className="ml-auto text-xs flex items-center gap-1 hover:underline"
            style={{ color: '#1E40AF' }}>
            Gerenciar <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
          {mockCampaigns.filter(c => c.status === 'active').slice(0, 3).map((c) => (
            <div key={c.id} className="rounded-xl p-4 transition-all cursor-pointer"
              style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1E40AF'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(30,64,175,0.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
              <div className="mb-3">
                <p className="font-semibold text-sm truncate" style={{ color: '#111827' }}>{c.name}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="badge" style={{ background: c.platform === 'google' ? '#DBEAFE' : '#EDE9FE', color: c.platform === 'google' ? '#1D4ED8' : '#6D28D9', fontSize: '0.65rem' }}>
                    {c.platform === 'google' ? 'Google Ads' : 'Meta Ads'}
                  </span>
                  <span className="badge badge-green">Ativo</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Gasto',  value: formatCurrency(c.spent) },
                  { label: 'CPL',    value: formatCurrency(c.cpl) },
                  { label: 'Leads',  value: String(c.conversions) },
                ].map(m => (
                  <div key={m.label}>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{m.label}</p>
                    <p className="text-sm font-bold" style={{ color: '#111827' }}>{m.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1" style={{ color: '#9CA3AF' }}>
                  <span>Orçamento</span>
                  <span>{Math.round((c.spent / c.budget) * 100)}%</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: '#E5E7EB' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min((c.spent / c.budget) * 100, 100)}%`, background: '#1E40AF' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
