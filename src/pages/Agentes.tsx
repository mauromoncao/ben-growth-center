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
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', badge: 'bg-blue-100 text-blue-700',    custo: 'Gratuito',        forca: 'Velocidade' },
  { value: 'gemini-2.5-pro',   label: 'Gemini 2.5 Pro',   badge: 'bg-indigo-100 text-indigo-700', custo: 'R$ 0,10/1M tok', forca: 'Contexto longo' },
  { value: 'gpt-5',            label: 'GPT-5',             badge: 'bg-green-100 text-green-700',   custo: 'Genspark ✅',      forca: 'Criatividade' },
  { value: 'claude-opus-4',    label: 'Claude Opus 4',     badge: 'bg-orange-100 text-orange-700', custo: 'Genspark ✅',      forca: 'Escrita longa' },
  { value: 'genspark-agent',   label: 'Genspark Agent',    badge: 'bg-amber-100 text-amber-700',   custo: 'Créditos ✅',      forca: 'Deep Research' },
  { value: 'flux-2-pro',       label: 'Flux 2 Pro',        badge: 'bg-pink-100 text-pink-700',     custo: 'Créditos ✅',      forca: 'Imagens ads' },
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
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${agent.ativo ? 'bg-white/6' : 'bg-white/4'}`}>
            {agent.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white">{agent.nome}</h3>
              {!agent.ativo && (
                <span className="text-xs bg-white/6 text-white/50 px-2 py-0.5 rounded-full">Fase 2</span>
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
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
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
            className="w-8 h-8 bg-white/4 hover:bg-white/6 rounded-lg flex items-center justify-center transition-colors"
          >
            {expandido ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
          </button>
        </div>
      </div>

      {/* Descrição */}
      <p className="text-white/60 text-sm mt-2">{agent.descricao}</p>

      {/* Status bar */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/8">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${agent.ativo ? 'bg-green-400 animate-pulse' : 'bg-slate-300'}`} />
          <span className={`text-xs font-medium ${agent.ativo ? 'text-green-600' : 'text-white/50'}`}>
            {agent.ativo ? 'Ativo' : 'Inativo (Fase 2)'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-white/50 text-xs">
          <Clock className="w-3 h-3" />
          {agent.schedule}
        </div>
      </div>

      {/* Execução em andamento */}
      {isRunning && (
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
            <span className="text-blue-700 text-sm font-medium">Executando {agent.nome}...</span>
          </div>
          <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400 rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      )}

      {/* EXPANDIDO — configurações */}
      {expandido && (
        <div className="mt-4 pt-4 border-t border-white/8 space-y-4">

          {/* Seletor de modelo */}
          <div>
            <p className="text-white/80 text-xs font-semibold mb-2 flex items-center gap-1">
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
                      : 'border-white/8 hover:border-white/10'
                  }`}
                >
                  <p className={`text-xs font-semibold ${modeloSelecionado === m.value ? 'text-gold' : 'text-white/90'}`}>
                    {m.label}
                  </p>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-white/50 text-xs">{m.custo}</span>
                    <span className="text-white/50 text-xs">{m.forca}</span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-white/50 text-xs mt-2">
              💡 Fallback: <strong>{getModelLabel(agent.modeloFallback)}</strong> (se modelo principal falhar)
            </p>
          </div>

          {/* Temperatura */}
          <div>
            <p className="text-white/80 text-xs font-semibold mb-2">TEMPERATURA (criatividade)</p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/50">Preciso</span>
              <div className="flex-1 h-2 bg-white/6 rounded-full relative">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                  style={{ width: `${agent.temperatura * 100}%` }}
                />
              </div>
              <span className="text-xs text-white/50">Criativo</span>
              <span className="text-xs font-bold text-white/80 w-8">{agent.temperatura}</span>
            </div>
          </div>

          {/* Prompt preview */}
          <div>
            <p className="text-white/80 text-xs font-semibold mb-2">SYSTEM PROMPT (prévia)</p>
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
      'lex-conteudo': `✅ Artigo gerado: "Como Recuperar Créditos de PIS/COFINS no Piauí em 2026"\n📊 SEO: 1.247 palavras | Keywords: "recuperação PIS COFINS Piauí" (880 vol)\n📅 Publicação agendada: amanhã 08:00 no blog`,
      'lex-campanhas': `✅ Análise concluída:\n• Pausou keyword "advogado gratuito" (CTR 0.2% — abaixo do mínimo 1%)\n• Aumentou lance +15% em "recuperação tributária piauí" (conv. 5.2%)\n• Sugestão: criar campanha Display para Previdenciário (oportunidade baixa concorrência)\n• CPL médio hoje: R$ 38.40 ✅`,
      'lex-marketing': `✅ 3 posts criados e agendados:\n• Instagram Reels (18:00): "3 sinais que sua empresa paga imposto a mais"\n• Facebook (20:00): Artigo sobre recuperação tributária\n• LinkedIn (12:00): "Tributário em 2026: O que mudou para empresas"\n🔍 Filtro OAB: APROVADO ✅`,
      'lex-monitor': `🟢 Sistema saudável:\n• Todos os sites: HTTP 200 ✅\n• Dr. Ben: respondendo < 1s ✅\n• CPL Google: R$ 42 (dentro da meta) ✅\n• Leads hoje: 7 ✅\n• 1 lead aguardando > 15min ⚠️ (José Alves — notificação enviada)`,
      'dr-ben': `✅ Dr. Ben operacional:\n• 12 conversas hoje\n• 4 leads qualificados (score ≥ 70)\n• 2 repassados para plantonista\n• Tempo médio de qualificação: 4.2 min\n• Modelo ativo: Gemini 2.5 Flash ⚡`,
      'lex-relatorio': `📊 Relatório semanal gerado:\n• 89 leads | 17 conversões | R$ 34.800 receita\n• ROAS médio: 4.8x ✅\n• Melhor campanha: Retargeting Meta (ROAS 8.2x)\n• PDF gerado e enviado via WhatsApp ✅`,
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
          <h1 className="text-2xl font-bold text-white">Agentes IA</h1>
          <p className="text-white/60 text-sm mt-1">
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
            { modelo: 'Gemini 2.5 Flash', agentes: ['Dr. Ben', 'Lex Monitor'], cor: 'bg-blue-500/30 border-blue-400/40', desc: 'Velocidade · 24/7' },
            { modelo: 'Gemini 2.5 Pro',   agentes: ['Lex Conteúdo', 'Lex Relatório'], cor: 'bg-indigo-500/30 border-indigo-400/40', desc: 'Contexto longo' },
            { modelo: 'GPT-5',            agentes: ['Lex Campanhas', 'Lex Marketing'], cor: 'bg-green-500/30 border-green-400/40', desc: 'via Genspark ✅' },
            { modelo: 'Claude Opus 4',    agentes: ['Lex Petições', 'Lex Jurídico'], cor: 'bg-orange-500/30 border-orange-400/40', desc: 'via Genspark ✅' },
          ].map(item => (
            <div key={item.modelo} className={`border rounded-xl p-3 ${item.cor}`}>
              <p className="text-white font-semibold text-sm">{item.modelo}</p>
              <p className="text-white/60 text-xs mb-2">{item.desc}</p>
              {item.agentes.map(a => (
                <div key={a} className="flex items-center gap-1 mb-1">
                  <div className="w-1 h-1 rounded-full bg-white/5/60" />
                  <span className="text-white/80 text-xs">{a}</span>
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
          <pre className="text-white/90 text-sm whitespace-pre-wrap bg-white/5 rounded-lg p-3 border border-green-100">
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
              areaFiltro === f.value ? 'bg-navy text-white' : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/4'
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
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/4 transition-colors">
              <div className="mt-0.5 flex-shrink-0">
                {activity.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {activity.status === 'running' && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
                {activity.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                {activity.status === 'scheduled' && <Clock className="w-4 h-4 text-white/50" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-white/90 text-sm">{activity.action}</p>
                  <span className={`text-xs flex-shrink-0 ${getStatusColor(activity.status)}`}>
                    {getStatusLabel(activity.status)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white/50 text-xs flex items-center gap-1">
                    <Zap className="w-3 h-3" />{activity.agent}
                  </span>
                  <span className="text-slate-300 text-xs">·</span>
                  <span className="text-white/50 text-xs">{activity.timestamp}</span>
                </div>
                {activity.details && (
                  <p className="text-white/50 text-xs mt-0.5">{activity.details}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
