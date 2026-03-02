import React, { useState } from 'react'
import { Plus, Eye, Edit2, Calendar, Zap } from 'lucide-react'
import { mockContent } from '../lib/mockData'
import { getStatusColor, getStatusLabel } from '../lib/utils'

const typeIcons: Record<string, string> = {
  blog: '📝',
  social: '📱',
  ad_copy: '🎯',
  video_script: '🎬',
}

export default function Conteudo() {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [generating, setGenerating] = useState(false)
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null)

  const filtered = typeFilter === 'all' ? mockContent : mockContent.filter(c => c.type === typeFilter)

  const handleGenerate = async () => {
    setGenerating(true)
    await new Promise(r => setTimeout(r, 2000))
    setGeneratedPreview(`# Como a Defesa Administrativa Pode Salvar Sua Empresa do Fisco

**Área:** Direito Tributário | **Gerado por:** Lex Conteúdo (Gemini 2.5 Pro)

Muitos empresários desconhecem que, antes de recorrer ao Judiciário, existe uma fase administrativa extremamente eficaz para questionar autuações fiscais.

## O que é a Defesa Administrativa?
A impugnação administrativa é o primeiro recurso disponível ao contribuinte quando notificado de um lançamento fiscal indevido...

*[Artigo completo: ~1.200 palavras — Pronto para publicação]*

✅ Verificado pelo filtro OAB — Provimento 205/2021 | ✅ SEO otimizado`)
    setGenerating(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conteúdo IA</h1>
          <p className="text-gray-500 text-sm mt-1">Blog, redes sociais e copies gerados pelos agentes Lex</p>
        </div>
        <button onClick={handleGenerate} disabled={generating}
          className="btn-primary flex items-center gap-2 text-sm disabled:opacity-60">
          <Zap className="w-4 h-4" />
          {generating ? 'Gerando...' : 'Gerar Conteúdo'}
        </button>
      </div>

      {/* Preview de conteúdo gerado */}
      {generatedPreview && (
        <div className="card border-l-4 border-green-400 bg-green-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-green-700 font-medium text-sm flex items-center gap-2">
              <Zap className="w-4 h-4" /> Conteúdo Gerado com Sucesso!
            </span>
            <button onClick={() => setGeneratedPreview(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕ Fechar</button>
          </div>
          <pre className="text-gray-700 text-sm whitespace-pre-wrap bg-white/5 rounded-lg p-4 border border-green-200">{generatedPreview}</pre>
          <div className="flex gap-2 mt-3">
            <button className="btn-primary text-sm">Publicar no Blog</button>
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-white/8">Editar</button>
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-white/8">Agendar</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'all', label: 'Todos' },
          { value: 'blog', label: '📝 Blog' },
          { value: 'social', label: '📱 Redes Sociais' },
          { value: 'ad_copy', label: '🎯 Copy Anúncio' },
          { value: 'video_script', label: '🎬 Script Vídeo' },
        ].map(f => (
          <button key={f.value} onClick={() => setTypeFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === f.value ? 'bg-navy text-white' : 'bg-white/5 border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Publicados', value: mockContent.filter(c => c.status === 'published').length, color: 'text-green-600' },
          { label: 'Agendados', value: mockContent.filter(c => c.status === 'scheduled').length, color: 'text-blue-600' },
          { label: 'Rascunhos', value: mockContent.filter(c => c.status === 'draft').length, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-gray-500 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Content list */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div key={item.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="text-2xl flex-shrink-0">{typeIcons[item.type]}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white text-sm">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="badge-blue">{item.area}</span>
                    <span className={getStatusColor(item.status)}>{getStatusLabel(item.status)}</span>
                    {item.platform && <span className="text-gray-400 text-xs">{item.platform}</span>}
                    <span className="text-gray-400 text-xs flex items-center gap-1">
                      <Zap className="w-3 h-3" />{item.aiAgent}
                    </span>
                  </div>
                  {item.performance && (
                    <div className="flex gap-4 mt-2">
                      <span className="text-xs text-gray-500">👁️ {item.performance.views.toLocaleString('pt-BR')} visualizações</span>
                      <span className="text-xs text-gray-500">🖱️ {item.performance.clicks} cliques</span>
                      <span className="text-xs text-gray-500">🎯 {item.performance.leads} leads</span>
                    </div>
                  )}
                  {item.scheduledAt && (
                    <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Publicação: {item.scheduledAt}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"><Eye className="w-4 h-4" /></button>
                <button className="p-1.5 text-gray-400 hover:text-gold hover:bg-navy-50 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Planejamento automático */}
      <div className="card bg-gradient-to-r from-primary-900 to-primary-700 text-white">
        <h2 className="font-semibold mb-2 flex items-center gap-2">
          📅 Plano Semanal Automático (Lex Conteúdo)
        </h2>
        <p className="text-gray-500 text-sm mb-4">O agente produz automaticamente todo dia às 07:00:</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { day: 'Seg', content: '📝 1 Artigo Blog (Tributário)' },
            { day: 'Ter', content: '📱 3 Posts Instagram' },
            { day: 'Qua', content: '📝 1 Artigo Blog (Previdenciário)' },
            { day: 'Qui', content: '🎯 2 Copies para Ads' },
          ].map(item => (
            <div key={item.day} className="bg-white/5/10 rounded-lg p-3">
              <p className="text-gold font-bold text-sm">{item.day}</p>
              <p className="text-gold-100 text-xs mt-1">{item.content}</p>
            </div>
          ))}
        </div>
        <button className="mt-4 bg-gold text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gold-600 transition-colors">
          Ativar Plano Automático
        </button>
      </div>
    </div>
  )
}
