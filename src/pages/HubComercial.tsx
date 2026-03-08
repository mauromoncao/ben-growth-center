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
  { name: 'Leads', value: 89, meta: 120, cor: '#0f2044' },
  { name: 'Conversões', value: 17, meta: 25, cor: '#D4A017' },
  { name: 'ROAS', value: 48, meta: 60, cor: '#00b37e' },
]

export default function HubComercial() {
  const aguardando = crmLeadsMock.filter(l => l.status === 'aguardando')
  const convertidos = crmLeadsMock.filter(l => l.status === 'convertido')
  const valorTotal = convertidos.reduce((a, l) => a + (l.valor || 0), 0)
  const agentesAtivos = mockAgentActivities.filter(a => a.status === 'success' || a.status === 'running').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="flex items-center justify-between flex-wrap gap-4 rounded-2xl px-6 py-5 relative overflow-hidden mb-6"
        style={{
          background: 'linear-gradient(135deg, #C8960E 0%, #D4A017 40%, #F0C040 70%, #C8960E 100%)',
          border: '1px solid rgba(212,160,23,0.60)',
          boxShadow: '0 4px 32px rgba(212,160,23,0.25)',
        }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.18) 0%, transparent 60%)' }} />
        <div className="relative">
          <h1 className="text-2xl font-bold font-serif" style={{ color: '#0f2044', letterSpacing: '-0.01em' }}>Ben Growth Center</h1>
          <p className="text-xs font-semibold uppercase tracking-wider font-sans" style={{ color: 'rgba(15,32,68,0.65)' }}>Centro de Inteligência Comercial Jurídica</p>
          <p className="text-sm mt-1 font-sans" style={{ color: 'rgba(15,32,68,0.70)' }}>Visão geral unificada — Tráfego · Marketing · CRM · Dr. Ben</p>
        </div>
        <div className="flex items-center gap-3">
          {aguardando.length > 0 && (
            <a href="/crm" className="flex items-center gap-2 rounded-full px-4 py-2 transition-colors" style={{ background: "rgba(245,158,11,0.20)", border: "1px solid rgba(245,158,11,0.45)" }}>
              <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="text-sm font-medium font-sans" style={{ color: "#fde68a" }}>{aguardando.length} aguardando atendimento</span>
              <ArrowUpRight className="w-3 h-3 text-amber-500" />
            </a>
          )}
          <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: "rgba(0,179,126,0.18)", border: "1px solid rgba(0,179,126,0.40)" }}>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium font-sans" style={{ color: "#6ee7b7" }}>{agentesAtivos} Agentes Ativos</span>
          </div>
        </div>
      </div>

      {/* Big KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            titulo: 'Leads Totais', valor: formatNumber(mockKPIs.totalLeads),
            sub: 'Este mês', variacao: '+23%', positivo: true,
            icone: <Users className="w-5 h-5" style={{ color: '#4B6EA3' }} />, cor: 'rgba(56,189,248,0.18)'
          },
          {
            titulo: 'Valor Convertido', valor: formatCurrency(valorTotal),
            sub: `${convertidos.length} contratos`, variacao: '+18%', positivo: true,
            icone: <DollarSign className="w-5 h-5" style={{ color: '#00b37e' }} />, cor: 'rgba(0,179,126,0.18)'
          },
          {
            titulo: 'Investimento Ads', valor: formatCurrency(mockKPIs.totalSpent),
            sub: 'Google + Meta', variacao: '+8%', positivo: false,
            icone: <Megaphone className="w-5 h-5" style={{ color: '#a78bfa' }} />, cor: 'rgba(167,139,250,0.18)'
          },
          {
            titulo: 'ROAS Médio', valor: `${mockKPIs.roas}x`,
            sub: 'Retorno sobre invest.', variacao: '+0.6x', positivo: true,
            icone: <TrendingUp className="w-5 h-5" style={{ color: '#D4A017' }} />, cor: 'rgba(212,160,23,0.18)'
          },
        ].map(k => (
          <div key={k.titulo} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium" style={{color:"#6B7280"}}>{k.titulo}</p>
                <p className="text-2xl font-bold mt-1" style={{color:"#111827"}}>{k.valor}</p>
                <p className="text-xs mt-0.5" style={{color:"#9CA3AF"}}>{k.sub}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: k.cor }}>{k.icone}</div>
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
            label: 'Tráfego', icone: '📊', cor: 'from-[#0f2044] to-[#07182e]',
            stats: `${mockCampaigns.filter(c => c.status === 'active').length} camp. ativas`,
            link: '/campanhas', status: '✅ Operacional'
          },
          {
            label: 'Marketing IA', icone: '✍️', cor: 'from-[#6d28d9] to-[#4c1d95]',
            stats: `${mockKPIs.contentPublished} conteúdos publicados`,
            link: '/conteudo', status: '✅ Operacional'
          },
          {
            label: 'CRM', icone: '👥', cor: 'from-[#00b37e] to-[#007a56]',
            stats: `${crmLeadsMock.length} leads ativos`,
            link: '/crm', status: aguardando.length > 0 ? `⚠️ ${aguardando.length} aguardando` : '✅ Operacional'
          },
          {
            label: 'Dr. Ben IA', icone: '🤖', cor: 'from-[#D4A017] to-[#C8960E]',
            stats: 'WhatsApp + Site ativos',
            link: '/dr-ben', status: '✅ Online'
          },
        ].map(mod => (
          <a key={mod.label} href={mod.link}
            className={`bg-gradient-to-br ${mod.cor} rounded-xl p-4 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer`}>
            <span className="text-3xl block mb-2">{mod.icone}</span>
            <p className="font-bold text-lg">{mod.label}</p>
            <p className="text-xs mt-1" style={{color:"rgba(255,255,255,0.55)"}}>{mod.stats}</p>
            <p className="text-xs mt-2 font-medium" style={{color:"rgba(255,255,255,0.90)"}}>{mod.status}</p>
          </a>
        ))}
      </div>

      {/* Pipeline + Gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mini pipeline CRM */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{color:"#111827"}}>Pipeline Comercial</h2>
            <a href="/crm" style={{color:"#D4A017"}} className="text-xs hover:underline flex items-center gap-1">
              CRM Completo <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Novos Leads', count: crmLeadsMock.filter(l => l.status === 'novo').length, cor: 'bg-[#0f2044]', pct: 30 },
              { label: 'Qualificados', count: crmLeadsMock.filter(l => l.status === 'qualificado').length, cor: 'bg-[#00b37e]', pct: 20 },
              { label: '⏳ Aguard. Humano', count: crmLeadsMock.filter(l => l.status === 'aguardando').length, cor: 'bg-[#D4A017]', pct: 15 },
              { label: 'Em Atendimento', count: crmLeadsMock.filter(l => l.status === 'em_atendimento').length, cor: 'bg-[#7c3aed]', pct: 10 },
              { label: '🏆 Convertidos', count: crmLeadsMock.filter(l => l.status === 'convertido').length, cor: 'bg-[#00b37e]', pct: 25 },
            ].map(etapa => (
              <div key={etapa.label} className="flex items-center gap-3">
                <p className="text-sm w-36 flex-shrink-0" style={{color:"#374151"}}>{etapa.label}</p>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
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
          <h2 className="font-semibold mb-4" style={{color:"#111827"}}>Leads × Investimento (7 dias)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mockDailyMetrics.slice(-7)}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A017" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#D4A017" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, color: '#1F2937', fontFamily: 'Inter', fontSize: 12 }} />
              <Area type="monotone" dataKey="leads" stroke="#D4A017" fill="url(#colorLeads)" strokeWidth={2} name="Leads" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agentes + Últimos leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Agentes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{color:"#111827"}}>Agentes IA</h2>
            <a href="/agentes" style={{color:"#D4A017"}} className="text-xs hover:underline flex items-center gap-1">
              Ver todos <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-2">
            {[
              { nome: 'Lex Conteúdo', icone: '📝', status: 'active', ultima: 'Hoje 07:00', modelo: 'GPT-4o' },
              { nome: 'Lex Campanhas', icone: '🎯', status: 'active', ultima: 'Hoje 08:47', modelo: 'GPT-5' },
              { nome: 'Lex Marketing', icone: '📱', status: 'active', ultima: 'Hoje 07:05', modelo: 'Claude Opus' },
              { nome: 'Lex Monitor', icone: '🔔', status: 'active', ultima: 'Hoje 14:22', modelo: 'GPT-4o Mini' },
            ].map(ag => (
              <div key={ag.nome} className="flex items-center justify-between p-3 rounded-xl" style={{background:"#F9FAFB",border:"1px solid #F3F4F6"}}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{ag.icone}</span>
                  <div>
                    <p className="font-medium text-sm" style={{color:"#111827"}}>{ag.nome}</p>
                    <p className="text-xs" style={{color:"#6B7280"}}>{ag.modelo} · {ag.ultima}</p>
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
            <h2 className="font-semibold" style={{color:"#111827"}}>Últimas Entradas — Dr. Ben</h2>
            <a href="/dr-ben" style={{color:"#D4A017"}} className="text-xs hover:underline flex items-center gap-1">
              Ver integração <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-2">
            {crmLeadsMock.slice(0, 5).map(lead => (
              <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background:"#e8edf7"}}>
                    <span className="font-bold text-xs" style={{color:"#0f2044"}}>{lead.nome[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{color:"#111827"}}>{lead.nome}</p>
                    <p className="text-xs" style={{color:"#6B7280"}}>{lead.area} · {lead.origem}</p>
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
      <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, #07182e, #1e3470)", border: "1px solid rgba(212,160,23,0.25)" }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#D4A017" }}>
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-xl mb-1 text-white">Meta Comercial — Março 2026</h2>
            <p className="text-sm mb-4 font-sans" style={{ color: "rgba(212,160,23,0.80)" }}>Ben Growth Center: tráfego + IA + CRM centralizado — sem sistemas externos</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Leads/mês', atual: 89, meta: 150, cor: 'bg-[#0f2044]' },
                { label: 'Conversões', atual: 17, meta: 30, cor: 'bg-[#D4A017]' },
                { label: 'Receita (R$)', atual: 34800, meta: 60000, cor: 'bg-[#00b37e]' },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex justify-between text-xs mb-1" style={{color:"rgba(255,255,255,0.65)"}}>
                    <span>{m.label}</span>
                    <span>{typeof m.atual === 'number' && m.atual > 999 ? formatCurrency(m.atual) : m.atual}/{typeof m.meta === 'number' && m.meta > 999 ? formatCurrency(m.meta) : m.meta}</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.10)" }}>
                    <div className={`h-full ${m.cor} rounded-full`} style={{ width: `${Math.min((m.atual / m.meta) * 100, 100)}%` }} />
                  </div>
                  <p className="text-xs mt-1" style={{color:"rgba(255,255,255,0.55)"}}>{Math.round((m.atual / m.meta) * 100)}% da meta</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
