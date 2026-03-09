import React, { useState } from 'react'
import { Search, Phone, Mail, ExternalLink } from 'lucide-react'
import { mockLeads } from '../lib/mockData'
import { formatCurrency, getStatusColor, getStatusLabel } from '../lib/utils'

const sourceIcons: Record<string, string> = {
  google_ads: '🔵',
  meta_ads: '🟣',
  organic: '🟢',
  whatsapp: '💬',
  direct: '🔗',
}

export default function Leads() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [areaFilter, setAreaFilter] = useState('all')

  const filtered = mockLeads.filter(lead => {
    if (search && !lead.name.toLowerCase().includes(search.toLowerCase()) && !lead.area.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'all' && lead.status !== statusFilter) return false
    if (areaFilter !== 'all' && lead.area !== areaFilter) return false
    return true
  })

  const totalValue = filtered.filter(l => l.value).reduce((a, l) => a + (l.value || 0), 0)
  const converted = filtered.filter(l => l.status === 'converted').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} leads encontrados · Valor potencial: {formatCurrency(totalValue)}</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-gray-100 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
            📥 Exportar CSV
          </button>
          <button className="btn-primary text-sm">
            + Novo Lead
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: mockLeads.length, color: 'text-white' },
          { label: 'Novos', value: mockLeads.filter(l => l.status === 'new').length, color: 'text-[#19385C]' },
          { label: 'Qualificados', value: mockLeads.filter(l => l.status === 'qualified').length, color: 'text-green-600' },
          { label: 'Convertidos', value: mockLeads.filter(l => l.status === 'converted').length, color: 'text-purple-600' },
          { label: 'Perdidos', value: mockLeads.filter(l => l.status === 'lost').length, color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="card text-center py-3">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-gray-500 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar lead..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-white/55"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-gray-100 border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/55">
          <option value="all">Todos os status</option>
          <option value="new">Novo</option>
          <option value="contacted">Contatado</option>
          <option value="qualified">Qualificado</option>
          <option value="converted">Convertido</option>
          <option value="lost">Perdido</option>
        </select>
        <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)}
          className="bg-gray-100 border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/55">
          <option value="all">Todas as áreas</option>
          <option value="Tributário">Tributário</option>
          <option value="Previdenciário">Previdenciário</option>
          <option value="Bancário">Bancário</option>
        </select>
      </div>

      {/* Lead table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Lead</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Área</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Origem</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Valor Est.</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Data</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, i) => (
                <tr key={lead.id} className={`border-b border-slate-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? 'bg-white/5' : 'bg-gray-50/30'}`}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-white">{lead.name}</p>
                      <p className="text-gray-400 text-xs">{lead.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge-blue">{lead.area}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-gray-600">
                      <span>{sourceIcons[lead.source]}</span>
                      <span>{getStatusLabel(lead.source)}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={getStatusColor(lead.status)}>{getStatusLabel(lead.status)}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-white">
                    {lead.value ? formatCurrency(lead.value) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{lead.createdAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <a href={`tel:${lead.phone}`} className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded transition-colors">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <a href={`mailto:${lead.email}`} className="p-1.5 text-gray-400 hover:text-[#19385C] hover:bg-[#f0f3fa] rounded transition-colors">
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                      <button className="p-1.5 text-gray-400 hover:text-gold hover:bg-navy-50 rounded transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pipeline Kanban summary */}
      <div className="card bg-gradient-to-r from-primary-900 to-primary-700 text-white">
        <h2 className="font-semibold mb-3">Pipeline de Conversão</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { label: 'Novos', count: mockLeads.filter(l => l.status === 'new').length, color: 'bg-[#2d4a8a]' },
            { label: '→ Contatados', count: mockLeads.filter(l => l.status === 'contacted').length, color: 'bg-yellow-400' },
            { label: '→ Qualificados', count: mockLeads.filter(l => l.status === 'qualified').length, color: 'bg-green-400' },
            { label: '→ Convertidos', count: mockLeads.filter(l => l.status === 'converted').length, color: 'bg-purple-400' },
          ].map((stage, i) => (
            <React.Fragment key={stage.label}>
              <div className="text-center flex-shrink-0">
                <div className={`w-12 h-12 ${stage.color} rounded-xl flex items-center justify-center mx-auto`}>
                  <span className="text-white font-bold">{stage.count}</span>
                </div>
                <p className="text-gray-500 text-xs mt-1 whitespace-nowrap">{stage.label}</p>
              </div>
              {i < 3 && <div className="w-8 h-0.5 bg-white/5/20 flex-shrink-0 mt-[-16px]" />}
            </React.Fragment>
          ))}
          <div className="ml-auto text-right flex-shrink-0">
            <p className="text-2xl font-bold text-gold">{Math.round((converted / mockLeads.length) * 100)}%</p>
            <p className="text-gray-500 text-xs">Taxa de Conversão</p>
          </div>
        </div>
      </div>
    </div>
  )
}
