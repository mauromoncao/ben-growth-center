import React, { useState } from 'react'
import { TrendingUp, TrendingDown, Search } from 'lucide-react'
import { mockKeywords } from '../lib/mockData'
import { formatCurrency, formatNumber } from '../lib/utils'

const competitionColors = {
  low: 'badge-green',
  medium: 'badge-yellow',
  high: 'badge-red',
}
const competitionLabels = { low: 'Baixa', medium: 'Média', high: 'Alta' }

export default function PalavrasChave() {
  const [search, setSearch] = useState('')
  const [area, setArea] = useState('all')
  const [researching, setResearching] = useState(false)
  const [newKeywords, setNewKeywords] = useState<string[]>([])

  const filtered = mockKeywords.filter(k => {
    if (search && !k.keyword.toLowerCase().includes(search.toLowerCase())) return false
    if (area !== 'all' && k.area !== area) return false
    return true
  })

  const handleResearch = async () => {
    setResearching(true)
    setNewKeywords([])
    await new Promise(r => setTimeout(r, 2500))
    setNewKeywords([
      'consulta tributária grátis teresina (vol: 320, CPC: R$ 1,90)',
      'advogado para recuperar imposto pago (vol: 480, CPC: R$ 2,40)',
      'contestar multa receita federal pi (vol: 210, CPC: R$ 3,10)',
      'parcelamento débito tributário piauí (vol: 290, CPC: R$ 2,20)',
      'ação revisional benefício inss 2026 (vol: 1.200, CPC: R$ 1,60)',
    ])
    setResearching(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Palavras-chave</h1>
          <p className="text-gray-500 text-sm mt-1">Monitore e descubra termos de busca para suas campanhas</p>
        </div>
        <button onClick={handleResearch} disabled={researching}
          className="btn-primary flex items-center gap-2 text-sm disabled:opacity-60">
          <Search className="w-4 h-4" />
          {researching ? 'Pesquisando...' : 'Lex Keyword Research'}
        </button>
      </div>

      {/* Novas keywords sugeridas */}
      {newKeywords.length > 0 && (
        <div className="card border-l-4 border-green-400 bg-green-50">
          <h3 className="font-medium text-green-700 mb-3">✅ Lex Campanhas encontrou {newKeywords.length} novas oportunidades:</h3>
          <div className="space-y-2">
            {newKeywords.map((kw, i) => (
              <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-green-100">
                <p className="text-gray-700 text-sm">{kw}</p>
                <button className="text-xs bg-navy text-white px-3 py-1 rounded-full hover:bg-navy-700">Adicionar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Buscar palavra-chave..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-white/55" />
        </div>
        <select value={area} onChange={e => setArea(e.target.value)}
          className="bg-gray-100 border border-gray-200 rounded-lg text-sm px-3 py-2">
          <option value="all">Todas as áreas</option>
          <option value="Tributário">Tributário</option>
          <option value="Previdenciário">Previdenciário</option>
          <option value="Bancário">Bancário</option>
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Volume Total', value: formatNumber(filtered.reduce((a, k) => a + k.volume, 0)) },
          { label: 'CPC Médio', value: formatCurrency(filtered.reduce((a, k) => a + k.cpc, 0) / (filtered.length || 1)) },
          { label: 'Posição Média', value: (filtered.filter(k => k.position).reduce((a, k) => a + (k.position || 0), 0) / (filtered.filter(k => k.position).length || 1)).toFixed(1) },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className="text-2xl font-bold text-gold">{s.value}</p>
            <p className="text-gray-500 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Keywords Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Palavra-chave</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Área</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Volume</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">CPC</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Concorrência</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Posição</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Cliques</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Impressões</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((kw, i) => (
                <tr key={kw.keyword} className={`border-b border-slate-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                  <td className="px-4 py-3 font-medium text-white">{kw.keyword}</td>
                  <td className="px-4 py-3"><span className="badge-blue">{kw.area}</span></td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatNumber(kw.volume)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(kw.cpc)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={competitionColors[kw.competition]}>{competitionLabels[kw.competition]}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {kw.position ? (
                      <span className={`font-bold ${kw.position <= 3 ? 'text-green-600' : kw.position <= 5 ? 'text-amber-600' : 'text-red-500'}`}>
                        #{kw.position}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{kw.clicks ? formatNumber(kw.clicks) : '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{kw.impressions ? formatNumber(kw.impressions) : '—'}</td>
                  <td className="px-4 py-3">
                    <button className="text-xs bg-navy-50 text-gold px-2 py-1 rounded hover:bg-navy-100 transition-colors">
                      + Campanha
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="card border-l-4 border-gold">
        <h3 className="font-semibold text-white mb-3">🤖 Análise da IA — Oportunidades</h3>
        <div className="space-y-2">
          {[
            { icon: '🏆', text: '"advogado previdenciário piauí" tem CPC baixo e posição #1. Recomendo aumentar o orçamento dessa campanha em 30%.' },
            { icon: '📈', text: '"recuperação tributária piauí" converte 3.2x acima da média. Candidate para expandir para campanhas Display.' },
            { icon: '⚠️', text: '"juros abusivos banco" tem alta concorrência nacional. Sugerindo variante local: "juros abusivos banco teresina".' },
          ].map((insight, i) => (
            <div key={i} className="flex gap-3 p-3 bg-amber-50 rounded-lg">
              <span>{insight.icon}</span>
              <p className="text-gray-700 text-sm">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
