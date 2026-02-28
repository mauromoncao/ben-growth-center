import React from 'react'
import {
  TrendingUp, Users, DollarSign, Target, Bot, Megaphone,
  FileText, Bell, ArrowUpRight, CheckCircle2, AlertCircle, Zap
} from 'lucide-react'
import { mockKPIs, mockCampaigns, mockAgentActivities } from '../lib/mockData'
import { crmLeadsMock } from './CRM'
import { formatCurrency, formatNumber } from '../lib/utils'
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts'
import { mockDailyMetrics } from '../lib/mockData'

const metaComercial = [
  { name: 'Leads', value: 89, meta: 120, cor: '#1a2a5e' },
  { name: 'Conversões', value: 17, meta: 25, cor: '#c9a84c' },
  { name: 'ROAS', value: 48, meta: 60, cor: '#34a853' },
]

export default function HubComercial() {
  const aguardando = crmLeadsMock.filter(l => l.status === 'aguardando')
  const convertidos = crmLeadsMock.filter(l => l.status === 'convertido')
  const valorTotal = convertidos.reduce((a, l) => a + (l.valor || 0), 0)
  const agentesAtivos = mockAgentActivities.filter(a => a.status === 'success' || a.status === 'running').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Ben Growth Center</h1>
            <p className="text-growth-600 text-xs font-semibold uppercase tracking-wider">Centro de Inteligência Comercial Jurídica</p>
          </div>
          <p className="text-slate-500 text-sm mt-1">Visão geral unificada — Tráfego · Marketing · CRM · Dr. Ben</p>
        </div>
        <div className="flex items-center gap-3">
          {aguardando.length > 0 && (
            <a href="/crm" className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-full px-4 py-2 hover:bg-amber-100 transition-colors">
              <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="text-amber-700 text-sm font-medium">{aguardando.length} aguardando atendimento</span>
              <ArrowUpRight className="w-3 h-3 text-amber-500" />
            </a>
          )}
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-700 text-xs font-medium">{agentesAtivos} Agentes Ativos</span>
          </div>
        </div>
      </div>

      {/* Big KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            titulo: 'Leads Totais', valor: formatNumber(mockKPIs.totalLeads),
            sub: 'Este mês', variacao: '+23%', positivo: true,
            icone: <Users className="w-6 h-6 text-blue-600" />, cor: 'bg-blue-50'
          },
          {
            titulo: 'Valor Convertido', valor: formatCurrency(valorTotal),
            sub: `${convertidos.length} contratos`, variacao: '+18%', positivo: true,
            icone: <DollarSign className="w-6 h-6 text-emerald-600" />, cor: 'bg-emerald-50'
          },
          {
            titulo: 'Investimento Ads', valor: formatCurrency(mockKPIs.totalSpent),
            sub: 'Google + Meta', variacao: '+8%', positivo: false,
            icone: <Megaphone className="w-6 h-6 text-purple-600" />, cor: 'bg-purple-50'
          },
          {
            titulo: 'ROAS Médio', valor: `${mockKPIs.roas}x`,
            sub: 'Retorno sobre invest.', variacao: '+0.6x', positivo: true,
            icone: <TrendingUp className="w-6 h-6 text-amber-600" />, cor: 'bg-amber-50'
          },
        ].map(k => (
          <div key={k.titulo} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm">{k.titulo}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{k.valor}</p>
                <p className="text-slate-400 text-xs mt-0.5">{k.sub}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${k.cor}`}>{k.icone}</div>
            </div>
            <div className={`text-sm font-medium mt-3 ${k.positivo ? 'text-green-600' : 'text-red-500'}`}>
              {k.variacao} vs. mês anterior
            </div>
          </div>
        ))}
      </div>

      {/* Módulos do Sistema */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Tráfego', icone: '📊', cor: 'from-blue-600 to-blue-800',
            stats: `${mockCampaigns.filter(c => c.status === 'active').length} camp. ativas`,
            link: '/campanhas', status: '✅ Operacional'
          },
          {
            label: 'Marketing IA', icone: '✍️', cor: 'from-purple-600 to-purple-800',
            stats: `${mockKPIs.contentPublished} conteúdos publicados`,
            link: '/conteudo', status: '✅ Operacional'
          },
          {
            label: 'CRM', icone: '👥', cor: 'from-emerald-600 to-emerald-800',
            stats: `${crmLeadsMock.length} leads ativos`,
            link: '/crm', status: aguardando.length > 0 ? `⚠️ ${aguardando.length} aguardando` : '✅ Operacional'
          },
          {
            label: 'Dr. Ben IA', icone: '🤖', cor: 'from-amber-500 to-amber-700',
            stats: 'WhatsApp + Site ativos',
            link: '/dr-ben', status: '✅ Online'
          },
        ].map(mod => (
          <a key={mod.label} href={mod.link}
            className={`bg-gradient-to-br ${mod.cor} rounded-xl p-4 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer`}>
            <span className="text-3xl block mb-2">{mod.icone}</span>
            <p className="font-bold text-lg">{mod.label}</p>
            <p className="text-white/70 text-xs mt-1">{mod.stats}</p>
            <p className="text-white/90 text-xs mt-2 font-medium">{mod.status}</p>
          </a>
        ))}
      </div>

      {/* Pipeline + Gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mini pipeline CRM */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Pipeline Comercial</h2>
            <a href="/crm" className="text-primary text-xs hover:underline flex items-center gap-1">
              CRM Completo <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Novos Leads', count: crmLeadsMock.filter(l => l.status === 'novo').length, cor: 'bg-blue-400', pct: 30 },
              { label: 'Qualificados', count: crmLeadsMock.filter(l => l.status === 'qualificado').length, cor: 'bg-green-400', pct: 20 },
              { label: '⏳ Aguard. Humano', count: crmLeadsMock.filter(l => l.status === 'aguardando').length, cor: 'bg-amber-400', pct: 15 },
              { label: 'Em Atendimento', count: crmLeadsMock.filter(l => l.status === 'em_atendimento').length, cor: 'bg-purple-400', pct: 10 },
              { label: '🏆 Convertidos', count: crmLeadsMock.filter(l => l.status === 'convertido').length, cor: 'bg-emerald-400', pct: 25 },
            ].map(etapa => (
              <div key={etapa.label} className="flex items-center gap-3">
                <p className="text-slate-600 text-sm w-36 flex-shrink-0">{etapa.label}</p>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${etapa.cor} rounded-full flex items-center justify-end pr-2 transition-all`}
                    style={{ width: `${etapa.pct * 3}%` }}>
                    <span className="text-white text-xs font-bold">{etapa.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leads diários */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Leads × Investimento (7 dias)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mockDailyMetrics.slice(-7)}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="leads" stroke="#c9a84c" fill="url(#colorLeads)" strokeWidth={2} name="Leads" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agentes + Últimos leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Agentes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Agentes IA</h2>
            <a href="/agentes" className="text-primary text-xs hover:underline flex items-center gap-1">
              Ver todos <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-2">
            {[
              { nome: 'Lex Conteúdo', icone: '📝', status: 'active', ultima: 'Hoje 07:00', modelo: 'Gemini 2.5 Pro' },
              { nome: 'Lex Campanhas', icone: '🎯', status: 'active', ultima: 'Hoje 08:47', modelo: 'GPT-5' },
              { nome: 'Lex Marketing', icone: '📱', status: 'active', ultima: 'Hoje 07:05', modelo: 'Claude Opus' },
              { nome: 'Lex Monitor', icone: '🔔', status: 'active', ultima: 'Hoje 14:22', modelo: 'Gemini Flash' },
            ].map(ag => (
              <div key={ag.nome} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{ag.icone}</span>
                  <div>
                    <p className="font-medium text-slate-700 text-sm">{ag.nome}</p>
                    <p className="text-slate-400 text-xs">{ag.modelo} · {ag.ultima}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-600 text-xs">Ativo</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Últimos leads Dr. Ben */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Últimas Entradas — Dr. Ben</h2>
            <a href="/dr-ben" className="text-primary text-xs hover:underline flex items-center gap-1">
              Ver integração <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-2">
            {crmLeadsMock.slice(0, 5).map(lead => (
              <div key={lead.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary font-bold text-xs">{lead.nome[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700 text-sm">{lead.nome}</p>
                    <p className="text-slate-400 text-xs">{lead.area} · {lead.origem}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${
                    lead.urgencia === 'alta' ? 'text-red-500' :
                    lead.urgencia === 'media' ? 'text-amber-500' : 'text-green-500'
                  }`}>{lead.score}</span>
                  {lead.status === 'aguardando' && (
                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium animate-pulse">
                      ⏳ Aguard.
                    </span>
                  )}
                  {lead.status === 'convertido' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Missão comercial */}
      <div className="card bg-gradient-to-r from-primary-900 to-primary-700 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-growth rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-xl mb-1">Meta Comercial — Março 2026</h2>
            <p className="text-primary-200 text-sm mb-4">Ben Growth Center: tráfego + IA + CRM centralizado — sem sistemas externos</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Leads/mês', atual: 89, meta: 150, cor: 'bg-blue-400' },
                { label: 'Conversões', atual: 17, meta: 30, cor: 'bg-gold' },
                { label: 'Receita (R$)', atual: 34800, meta: 60000, cor: 'bg-green-400' },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex justify-between text-xs text-primary-200 mb-1">
                    <span>{m.label}</span>
                    <span>{typeof m.atual === 'number' && m.atual > 999 ? formatCurrency(m.atual) : m.atual}/{typeof m.meta === 'number' && m.meta > 999 ? formatCurrency(m.meta) : m.meta}</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full">
                    <div className={`h-full ${m.cor} rounded-full`} style={{ width: `${Math.min((m.atual / m.meta) * 100, 100)}%` }} />
                  </div>
                  <p className="text-white/60 text-xs mt-1">{Math.round((m.atual / m.meta) * 100)}% da meta</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
