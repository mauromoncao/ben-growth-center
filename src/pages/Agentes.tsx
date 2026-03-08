import React, { useState } from 'react'
import {
  Play, Square, RefreshCw, Settings, ChevronDown,
  ChevronUp, Zap, CheckCircle2, AlertCircle, Clock,
  Brain, ToggleLeft, ToggleRight, Info
} from 'lucide-react'
import {
  AGENTS, getActiveAgents, getModelLabel, getModelColor,
  MODEL_COST_INFO, type AgentConfig, type AgentID
} from '../lib/aiRouter'
import { mockAgentActivities } from '../lib/mockData'
import { getStatusColor, getStatusLabel } from '../lib/utils'

// ─── Modelos disponíveis para seleção ────────────────────────
const MODELOS_DISPONIVEIS = [
  { value: 'gpt-4o-mini',      label: 'GPT-4o Mini',      badge: 'bg-emerald-100 text-emerald-700', custo: 'R$ 0,15/1M tok', forca: 'Velocidade' },
  { value: 'gpt-4o',          label: 'GPT-4o',            badge: 'bg-green-100 text-green-700',    custo: 'R$ 2,50/1M tok', forca: 'Copywriting' },
  { value: 'claude-haiku-4-5',label: 'Claude Haiku 4.5',  badge: 'bg-orange-100 text-orange-700',  custo: 'R$ 0,80/1M tok', forca: 'Jurídico' },
  { value: 'claude-sonnet',   label: 'Claude Sonnet 4.5', badge: 'bg-yellow-100 text-yellow-700',  custo: 'R$ 3,00/1M tok', forca: 'Complexo' },
  { value: 'dall-e-3',        label: 'DALL-E 3',          badge: 'bg-pink-100 text-pink-700',      custo: 'R$ 0,10/img',    forca: 'Imagens ads' },
]

// ─── Card de Agente ──────────────────────────────────────────
function AgentCard({ agent, onExecute, executing }: {
  agent: AgentConfig
  onExecute: (id: AgentID) => void
  executing: AgentID | null
}) {
  const [expandido, setExpandido] = useState(false)
  const [modeloSelecionado, setModeloSelecionado] = useState(agent.modelo)
  const isRunning = executing === agent.id

  const areaColors: Record<string, string> = {
    crm:      'border-l-blue-500',
    marketing:'border-l-purple-500',
    juridico: 'border-l-amber-500',
    sistema:  'border-l-slate-400',
  }

  return (
    <div className={`card border-l-4 ${areaColors[agent.area]} ${!agent.ativo ? 'opacity-60' : ''} transition-all`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${agent.ativo ? 'bg-gray-100' : 'bg-gray-50'}`}>
            {agent.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900">{agent.nome}</h3>
              {!agent.ativo && (
                <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Fase 2</span>
              )}
            </div>
            {/* Modelo badge */}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getModelColor(modeloSelecionado)}`}>
              🧠 {getModelLabel(modeloSelecionado)}
            </span>
          </div>
        </div>

        {/* Controles */}
        <div className="flex gap-1.5 items-center">
          {agent.ativo && (
            isRunning ? (
              <div className="w-8 h-8 bg-[#f0f3fa] rounded-lg flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-[#0f2044] animate-spin" />
              </div>
            ) : (
              <button
                onClick={() => onExecute(agent.id)}
                className="w-8 h-8 bg-green-50 hover:bg-green-100 rounded-lg flex items-center justify-center transition-colors"
                title="Executar agora"
              >
                <Play className="w-4 h-4 text-green-600" />
              </button>
            )
          )}
          <button
            onClick={() => setExpandido(!expandido)}
            className="w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors"
          >
            {expandido ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>
        </div>
      </div>

      {/* Descrição */}
      <p className="text-gray-500 text-sm mt-2">{agent.descricao}</p>

      {/* Status bar */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${agent.ativo ? 'bg-green-400 animate-pulse' : 'bg-slate-300'}`} />
          <span className={`text-xs font-medium ${agent.ativo ? 'text-green-600' : 'text-gray-400'}`}>
            {agent.ativo ? 'Ativo' : 'Inativo (Fase 2)'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-gray-400 text-xs">
          <Clock className="w-3 h-3" />
          {agent.schedule}
        </div>
      </div>

      {/* Execução em andamento */}
      {isRunning && (
        <div className="mt-3 bg-[#f0f3fa] border border-[#c5d0e8] rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="w-4 h-4 text-[#0f2044] animate-spin" />
            <span className="text-[#0f2044] text-sm font-medium">Executando {agent.nome}...</span>
          </div>
          <div className="h-1.5 bg-[#e8edf7] rounded-full overflow-hidden">
            <div className="h-full bg-[#2d4a8a] rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      )}

      {/* EXPANDIDO — configurações */}
      {expandido && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">

          {/* Seletor de modelo */}
          <div>
            <p className="text-gray-600 text-xs font-semibold mb-2 flex items-center gap-1">
              <Brain className="w-3.5 h-3.5" /> MODELO IA
            </p>
            <div className="grid grid-cols-2 gap-2">
              {MODELOS_DISPONIVEIS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setModeloSelecionado(m.value as any)}
                  className={`text-left p-2.5 rounded-xl border-2 transition-all ${
                    modeloSelecionado === m.value
                      ? 'border-primary bg-navy-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <p className={`text-xs font-semibold ${modeloSelecionado === m.value ? 'text-gold' : 'text-gray-700'}`}>
                    {m.label}
                  </p>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-gray-400 text-xs">{m.custo}</span>
                    <span className="text-gray-400 text-xs">{m.forca}</span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-gray-400 text-xs mt-2">
              💡 Fallback: <strong>{getModelLabel(agent.modeloFallback)}</strong> (se modelo principal falhar)
            </p>
          </div>

          {/* Temperatura */}
          <div>
            <p className="text-gray-600 text-xs font-semibold mb-2">TEMPERATURA (criatividade)</p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">Preciso</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full relative">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                  style={{ width: `${agent.temperatura * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">Criativo</span>
              <span className="text-xs font-bold text-gray-600 w-8">{agent.temperatura}</span>
            </div>
          </div>

          {/* Prompt preview */}
          <div>
            <p className="text-gray-600 text-xs font-semibold mb-2">SYSTEM PROMPT (prévia)</p>
            <div className="bg-slate-900 rounded-xl p-3 max-h-32 overflow-y-auto">
              <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">
                {agent.systemPrompt.substring(0, 300)}...
              </pre>
            </div>
          </div>

          {/* Custo estimado */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-amber-700 text-xs font-semibold mb-1">💰 CUSTO ESTIMADO</p>
            <p className="text-amber-600 text-xs">{MODEL_COST_INFO[modeloSelecionado]}</p>
          </div>

          {/* Botão salvar */}
          <button className="w-full btn-primary text-sm py-2.5">
            ✅ Salvar Configuração do Agente
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Componente Principal ────────────────────────────────────
export default function Agentes() {
  const [executing, setExecuting] = useState<AgentID | null>(null)
  const [resultado, setResultado] = useState<{ agente: string; output: string } | null>(null)
  const [areaFiltro, setAreaFiltro] = useState<string>('all')

  const agentesVisiveis = Object.values(AGENTS).filter(a =>
    areaFiltro === 'all' || a.area === areaFiltro
  )

  const handleExecute = async (id: AgentID) => {
    setExecuting(id)
    setResultado(null)
    await new Promise(r => setTimeout(r, 3000))

    const outputs: Partial<Record<AgentID, string>> = {
      'ben-conteudista': `✅ Artigo gerado: "Como Recuperar Créditos de PIS/COFINS no Piauí em 2026"\n📊 SEO: 1.247 palavras | Keywords: "recuperação PIS COFINS Piauí" (880 vol)\n📅 Publicação agendada: amanhã 08:00 no blog`,
      'ben-estrategista-campanhas': `✅ Análise concluída:\n• Pausou keyword "advogado gratuito" (CTR 0.2% — abaixo do mínimo 1%)\n• Aumentou lance +15% em "recuperação tributária piauí" (conv. 5.2%)\n• Sugestão: criar campanha Display para Previdenciário (oportunidade baixa concorrência)\n• CPL médio hoje: R$ 38.40 ✅`,
      'ben-estrategista-marketing': `✅ 3 posts criados e agendados:\n• Instagram Reels (18:00): "3 sinais que sua empresa paga imposto a mais"\n• Facebook (20:00): Artigo sobre recuperação tributária\n• LinkedIn (12:00): "Tributário em 2026: O que mudou para empresas"\n🔍 Filtro OAB: APROVADO ✅`,
      'ben-analista-monitoramento': `🟢 Sistema saudável:\n• Todos os sites: HTTP 200 ✅\n• Dr. Ben: respondendo < 1s ✅\n• CPL Google: R$ 42 (dentro da meta) ✅\n• Leads hoje: 7 ✅\n• 1 lead aguardando > 15min ⚠️ (José Alves — notificação enviada)`,
      'ben-atendente': `✅ BEN Atendente operacional:\n• 12 conversas hoje\n• 4 leads qualificados (score ≥ 70)\n• 2 repassados para plantonista\n• Tempo médio de qualificação: 4.2 min\n• Modelo ativo: GPT-4o Mini ⚡`,
      'ben-analista-relatorios': `📊 Relatório semanal gerado:\n• 89 leads | 17 conversões | R$ 34.800 receita\n• ROAS médio: 4.8x ✅\n• Melhor campanha: Retargeting Meta (ROAS 8.2x)\n• PDF gerado e enviado via WhatsApp ✅`,
    }

    const agent = AGENTS[id]
    setResultado({
      agente: agent.nome,
      output: outputs[id] || `✅ ${agent.nome} executado com sucesso via ${getModelLabel(agent.modelo)}.`,
    })
    setExecuting(null)
  }

  const ativos = getActiveAgents().length
  const totalAgentes = Object.values(AGENTS).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agentes IA</h1>
          <p className="text-gray-500 text-sm mt-1">
            {ativos} ativos · {totalAgentes - ativos} fase 2 · Roteamento multi-modelo automático
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-700 text-sm font-medium">{ativos} Agentes Online</span>
        </div>
      </div>

      {/* Mapa de modelos */}
      <div className="card bg-gradient-to-r from-primary-900 to-primary-700 text-white">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Brain className="w-5 h-5 text-gold" /> Roteamento Multi-Modelo — Configuração Atual
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { modelo: 'GPT-4o Mini',   agentes: ['BEN Atendente', 'BEN Monitor'],    cor: 'bg-emerald-500/30 border-emerald-400/40', desc: 'Velocidade · 24/7' },
            { modelo: 'GPT-4o',       agentes: ['BEN Campanhas', 'BEN Marketing'],  cor: 'bg-green-500/30 border-green-400/40',   desc: 'Copywriting · Ads' },
            { modelo: 'GPT-5',            agentes: ['Lex Campanhas', 'Lex Marketing'], cor: 'bg-green-500/30 border-green-400/40', desc: 'via Genspark ✅' },
            { modelo: 'Claude Opus 4',    agentes: ['Lex Petições', 'Lex Jurídico'], cor: 'bg-orange-500/30 border-orange-400/40', desc: 'via Genspark ✅' },
          ].map(item => (
            <div key={item.modelo} className={`border rounded-xl p-3 ${item.cor}`}>
              <p className="text-white font-semibold text-sm">{item.modelo}</p>
              <p className="text-gray-500 text-xs mb-2">{item.desc}</p>
              {item.agentes.map(a => (
                <div key={a} className="flex items-center gap-1 mb-1">
                  <div className="w-1 h-1 rounded-full bg-white/5/60" />
                  <span className="text-gray-600 text-xs">{a}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Resultado da execução */}
      {resultado && (
        <div className="card border-l-4 border-green-400 bg-green-50">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="font-semibold text-green-700">{resultado.agente} — Executado com Sucesso</p>
          </div>
          <pre className="text-gray-700 text-sm whitespace-pre-wrap bg-white/5 rounded-lg p-3 border border-green-100">
            {resultado.output}
          </pre>
        </div>
      )}

      {/* Filtros por área */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'all',       label: '🔍 Todos' },
          { value: 'crm',       label: '👥 CRM' },
          { value: 'marketing', label: '📢 Marketing' },
          { value: 'juridico',  label: '⚖️ Jurídico (Fase 2)' },
          { value: 'sistema',   label: '⚙️ Sistema' },
        ].map(f => (
          <button key={f.value} onClick={() => setAreaFiltro(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              areaFiltro === f.value ? 'bg-navy text-white' : 'bg-white/5 border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid de agentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {agentesVisiveis.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onExecute={handleExecute}
            executing={executing}
          />
        ))}
      </div>

      {/* Log de atividades */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" /> Log de Atividades Recentes
        </h2>
        <div className="space-y-2">
          {mockAgentActivities.map(activity => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="mt-0.5 flex-shrink-0">
                {activity.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {activity.status === 'running' && <RefreshCw className="w-4 h-4 text-[#0f2044] animate-spin" />}
                {activity.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                {activity.status === 'scheduled' && <Clock className="w-4 h-4 text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-gray-700 text-sm">{activity.action}</p>
                  <span className={`text-xs flex-shrink-0 ${getStatusColor(activity.status)}`}>
                    {getStatusLabel(activity.status)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-400 text-xs flex items-center gap-1">
                    <Zap className="w-3 h-3" />{activity.agent}
                  </span>
                  <span className="text-gray-500 text-xs">·</span>
                  <span className="text-gray-400 text-xs">{activity.timestamp}</span>
                </div>
                {activity.details && (
                  <p className="text-gray-400 text-xs mt-0.5">{activity.details}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
