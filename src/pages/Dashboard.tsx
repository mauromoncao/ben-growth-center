import React from 'react'
import {
  TrendingUp, TrendingDown, Users, DollarSign,
  MousePointerClick, Target, Bot, FileText,
  ArrowUpRight, AlertCircle, CheckCircle2, Clock
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  mockKPIs, mockDailyMetrics, mockAgentActivities,
  mockLeads, mockCampaigns
} from '../lib/mockData'
import { formatCurrency, formatNumber, formatPercent, getStatusColor, getStatusLabel } from '../lib/utils'

interface KPICardProps {
  title: string
  value: string
  variation?: number
  icon: React.ReactNode
  color: string
  subtitle?: string
}

function KPICard({ title, value, variation, icon, color, subtitle }: KPICardProps) {
  const isPositive = variation && variation > 0
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          {subtitle && <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      {variation !== undefined && (
        <div className="flex items-center gap-1 mt-3">
          {isPositive
            ? <TrendingUp className="w-4 h-4 text-green-500" />
            : <TrendingDown className="w-4 h-4 text-red-500" />}
          <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercent(variation)}
          </span>
          <span className="text-slate-400 text-xs">vs. mês anterior</span>
        </div>
      )}
    </div>
  )
}

const PIE_COLORS = ['#4285F4', '#1877F2', '#34a853', '#ea4335']
const sourceData = [
  { name: 'Google Ads', value: 34 },
  { name: 'Meta Ads', value: 41 },
  { name: 'Orgânico', value: 17 },
  { name: 'WhatsApp', value: 8 },
]

const areaData = [
  { name: 'Tributário', leads: 38, conversões: 8 },
  { name: 'Previdenciário', leads: 29, conversões: 6 },
  { name: 'Bancário', leads: 15, conversões: 2 },
  { name: 'Geral', leads: 7, conversões: 1 },
]

export default function Dashboard() {
  const recentLeads = mockLeads.slice(0, 5)
  const recentActivities = mockAgentActivities.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Visão geral de campanhas, leads e IA — Fevereiro 2026</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-primary flex items-center gap-2 text-sm">
            <Bot className="w-4 h-4" />
            Acionar Agente
          </button>
          <button className="btn-secondary flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4" />
            Relatório
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Leads Gerados"
          value={formatNumber(mockKPIs.totalLeads)}
          variation={mockKPIs.leadsVariation}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50"
          subtitle="Este mês"
        />
        <KPICard
          title="Investimento"
          value={formatCurrency(mockKPIs.totalSpent)}
          variation={mockKPIs.spentVariation}
          icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
          color="bg-emerald-50"
          subtitle={`Google + Meta`}
        />
        <KPICard
          title="Custo por Lead"
          value={formatCurrency(mockKPIs.avgCPL)}
          variation={mockKPIs.cplVariation}
          icon={<Target className="w-6 h-6 text-purple-600" />}
          color="bg-purple-50"
          subtitle="CPL médio"
        />
        <KPICard
          title="ROAS Geral"
          value={`${mockKPIs.roas}x`}
          variation={mockKPIs.roasVariation}
          icon={<TrendingUp className="w-6 h-6 text-amber-600" />}
          color="bg-amber-50"
          subtitle="Retorno sobre investimento"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Impressões', value: formatNumber(mockKPIs.totalImpressions), icon: '👁️' },
          { label: 'Cliques', value: formatNumber(mockKPIs.totalClicks), icon: '🖱️' },
          { label: 'CTR Médio', value: `${mockKPIs.avgCTR}%`, icon: '📊' },
          { label: 'Taxa Conversão', value: `${mockKPIs.conversionRate}%`, icon: '✅' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="text-slate-500 text-xs">{item.label}</p>
              <p className="text-lg font-bold text-slate-800">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart — Cliques diários */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Cliques e Leads — Últimos 14 dias</h2>
            <div className="flex gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block" /> Google</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-indigo-500 inline-block" /> Meta</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500 inline-block" /> Leads</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={mockDailyMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, n) => [formatNumber(Number(v)), n === 'googleClicks' ? 'Google' : n === 'metaClicks' ? 'Meta' : 'Leads']} />
              <Line type="monotone" dataKey="googleClicks" stroke="#4285F4" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="metaClicks" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="leads" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart — Origem de Leads */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Origem dos Leads</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={sourceData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {sourceData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, 'Participação']} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart — Leads por área */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Leads por Área Jurídica</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={areaData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="leads" fill="#1a2a5e" radius={[4, 4, 0, 0]} name="Leads" />
              <Bar dataKey="conversões" fill="#c9a84c" radius={[4, 4, 0, 0]} name="Conversões" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Atividade dos Agentes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Atividade dos Agentes IA</h2>
            <a href="/agentes" className="text-primary text-xs hover:underline flex items-center gap-1">
              Ver todos <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="mt-0.5">
                  {activity.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {activity.status === 'running' && <Clock className="w-4 h-4 text-blue-500 animate-spin" />}
                  {activity.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                  {activity.status === 'scheduled' && <Clock className="w-4 h-4 text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 text-sm font-medium truncate">{activity.action}</p>
                  <p className="text-slate-400 text-xs">{activity.agent} · {activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leads recentes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Leads Recentes</h2>
          <a href="/leads" className="text-primary text-xs hover:underline flex items-center gap-1">
            Ver todos <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 text-slate-500 font-medium">Nome</th>
                <th className="text-left py-2 text-slate-500 font-medium">Área</th>
                <th className="text-left py-2 text-slate-500 font-medium">Origem</th>
                <th className="text-left py-2 text-slate-500 font-medium">Status</th>
                <th className="text-left py-2 text-slate-500 font-medium">Valor Est.</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-2.5">
                    <div>
                      <p className="font-medium text-slate-800">{lead.name}</p>
                      <p className="text-slate-400 text-xs">{lead.createdAt}</p>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <span className="badge-blue">{lead.area}</span>
                  </td>
                  <td className="py-2.5 text-slate-600">{getStatusLabel(lead.source)}</td>
                  <td className="py-2.5">
                    <span className={getStatusColor(lead.status)}>{getStatusLabel(lead.status)}</span>
                  </td>
                  <td className="py-2.5 font-medium text-slate-800">
                    {lead.value ? formatCurrency(lead.value) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campanhas ativas */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Campanhas Ativas</h2>
          <a href="/campanhas" className="text-primary text-xs hover:underline flex items-center gap-1">
            Gerenciar <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockCampaigns.filter(c => c.status === 'active').slice(0, 3).map((c) => (
            <div key={c.id} className="border border-slate-100 rounded-lg p-4 hover:border-primary-200 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm truncate">{c.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.platform === 'google' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {c.platform === 'google' ? '🔵 Google' : '🟣 Meta'}
                    </span>
                    <span className="badge-green">{getStatusLabel(c.status)}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div>
                  <p className="text-xs text-slate-400">Gasto</p>
                  <p className="text-sm font-semibold text-slate-700">{formatCurrency(c.spent)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">CPL</p>
                  <p className="text-sm font-semibold text-slate-700">{formatCurrency(c.cpl)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Leads</p>
                  <p className="text-sm font-semibold text-slate-700">{c.conversions}</p>
                </div>
              </div>
              {/* Budget bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Orçamento</span>
                  <span>{Math.round((c.spent / c.budget) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min((c.spent / c.budget) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
