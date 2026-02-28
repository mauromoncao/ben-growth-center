import React, { useState } from 'react'
import {
  Bot, Zap, Play, Plus, Settings, ChevronRight,
  MessageCircle, HelpCircle, ClipboardList, GitBranch,
  Users, Calendar, BellRing, Flag, BarChart3,
  CheckCircle2, TrendingUp, DollarSign, Instagram,
  Smartphone, Globe, ArrowRight, Edit3, Trash2, Copy,
  ToggleLeft, ToggleRight, ExternalLink, Info, X
} from 'lucide-react'
import {
  FLUXOS_BIBLIOTECA, COMPARATIVO_MANYCHAT,
  getStepTypeLabel, getStepTypeColor,
  type Flow, type FlowStep, type StepType
} from '../lib/flowEngine'

// ─── Ícone por canal ─────────────────────────────────────────
function CanalIcon({ canal }: { canal: string }) {
  if (canal === 'whatsapp') return <MessageCircle className="w-3.5 h-3.5 text-green-500" />
  if (canal === 'instagram') return <Instagram className="w-3.5 h-3.5 text-pink-500" />
  if (canal === 'site_chat') return <Globe className="w-3.5 h-3.5 text-blue-500" />
  return <Smartphone className="w-3.5 h-3.5 text-slate-400" />
}

// ─── Card de Fluxo ────────────────────────────────────────────
function FluxoCard({ flow, onSelect }: { flow: Flow; onSelect: () => void }) {
  const [ativo, setAtivo] = useState(flow.ativo)

  const taxaConv = flow.stats?.taxaConversao.toFixed(1) || '0'
  const totalSteps = Object.keys(flow.steps).length

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-slate-800 text-sm">{flow.nome}</h3>
              <button
                onClick={() => setAtivo(!ativo)}
                className="flex-shrink-0"
                title={ativo ? 'Pausar fluxo' : 'Ativar fluxo'}
              >
                {ativo
                  ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                  : <ToggleLeft className="w-5 h-5 text-slate-300" />
                }
              </button>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">{flow.descricao}</p>
          </div>
        </div>

        {/* Canais */}
        <div className="flex items-center gap-2 mb-3">
          {flow.canal.map(c => (
            <span key={c} className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-0.5 text-xs text-slate-600">
              <CanalIcon canal={c} />
              {c === 'whatsapp' ? 'WhatsApp' : c === 'instagram' ? 'Instagram' : c === 'site_chat' ? 'Chat Site' : c}
            </span>
          ))}
          <span className="text-xs text-slate-400">{totalSteps} etapas</span>
        </div>

        {/* Stats */}
        {flow.stats && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: 'Disparos', value: flow.stats.disparos, cor: 'text-slate-700' },
              { label: 'Leads', value: flow.stats.leadsGerados, cor: 'text-primary' },
              { label: 'Concluídos', value: flow.stats.conclusoes, cor: 'text-blue-600' },
              { label: 'Conversão', value: `${taxaConv}%`, cor: 'text-emerald-600' },
            ].map(s => (
              <div key={s.label} className="text-center bg-slate-50 rounded-lg py-1.5">
                <p className={`font-bold text-sm ${s.cor}`}>{s.value}</p>
                <p className="text-slate-400 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Gatilho */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Gatilho: <strong className="text-slate-700">{flow.gatilho}</strong></span>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <button
            onClick={onSelect}
            className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" /> Editar Fluxo
          </button>
          <button className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors" title="Duplicar">
            <Copy className="w-4 h-4" />
          </button>
          <button className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors" title="Excluir">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Visualizador de etapas do fluxo ─────────────────────────
function FluxoViewer({ flow, onClose }: { flow: Flow; onClose: () => void }) {
  const steps = Object.values(flow.steps)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">{flow.nome}</h2>
            <p className="text-slate-400 text-sm">{flow.descricao}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Fluxo linear */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="relative">
            {steps.map((step, i) => {
              const typeColor = getStepTypeColor(step.type)
              const typeLabel = getStepTypeLabel(step.type)

              return (
                <div key={step.id} className="flex gap-4 mb-4">
                  {/* Linha vertical */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 ${typeColor}`}>
                      {i + 1}
                    </div>
                    {i < steps.length - 1 && (
                      <div className="w-0.5 h-full bg-slate-200 mt-1 flex-1 min-h-4" />
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${typeColor}`}>
                        {typeLabel}
                      </span>
                      <span className="text-xs text-slate-400">{step.label || step.id}</span>
                    </div>

                    {step.message && (
                      <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700 border border-slate-200 whitespace-pre-line">
                        {step.message}
                      </div>
                    )}

                    {/* Botões da pergunta */}
                    {step.buttons && step.buttons.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {step.buttons.map(btn => (
                          <span key={btn.id} className="bg-primary-50 text-primary border border-primary-200 text-xs px-3 py-1 rounded-full">
                            {btn.label}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Collect info */}
                    {step.collectKey && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <ClipboardList className="w-3 h-3" />
                        Coleta: <strong>{step.collectKey}</strong>
                      </p>
                    )}

                    {/* AI qualify */}
                    {step.type === 'ai_qualify' && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="bg-emerald-50 rounded-lg p-2 text-xs border border-emerald-200">
                          <p className="text-emerald-600 font-medium">Score ≥ 70</p>
                          <p className="text-emerald-500">→ {step.aiNextStepHighScore}</p>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-2 text-xs border border-amber-200">
                          <p className="text-amber-600 font-medium">Score &lt; 70</p>
                          <p className="text-amber-500">→ {step.aiNextStepLowScore}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex gap-3">
          <button className="flex-1 btn-primary text-sm flex items-center justify-center gap-2">
            <Play className="w-4 h-4" /> Testar Fluxo
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Comparativo ManyChat vs Dr. Ben Flow ─────────────────────
function ComparativoCard() {
  const { manychat, drBenFlow } = COMPARATIVO_MANYCHAT

  return (
    <div className="bg-gradient-to-r from-primary to-primary-700 rounded-xl p-5 text-white">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-growth" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Economia com Dr. Ben Flow</h3>
          <p className="text-primary-200 text-sm">Substituto nativo do ManyChat — custo zero</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-3xl font-black text-growth">R$ {drBenFlow.economiaAnual.toLocaleString('pt-BR')}</p>
          <p className="text-primary-200 text-sm">economizados por ano</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* ManyChat */}
        <div className="bg-white/10 rounded-xl p-4">
          <p className="font-bold text-red-300 mb-3 flex items-center gap-2">
            <X className="w-4 h-4" /> ManyChat Pro
          </p>
          <div className="space-y-2 text-sm">
            <p className="flex items-center justify-between">
              <span className="text-primary-200">Custo mensal</span>
              <span className="font-bold text-red-300">R$ {manychat.custoMensal}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-primary-200">Custo anual</span>
              <span className="font-bold text-red-300">R$ {manychat.custoAnual.toLocaleString('pt-BR')}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-primary-200">Limite de leads</span>
              <span className="text-white">{manychat.limitesLeads}/mês</span>
            </p>
            <div className="border-t border-white/10 pt-2 space-y-1">
              {[
                { label: 'Qualificação com IA', ok: false },
                { label: 'Integrado ao CRM', ok: false },
                { label: 'Score automático', ok: false },
                { label: 'Customizável', ok: false },
              ].map(f => (
                <p key={f.label} className="flex items-center gap-2 text-xs">
                  <X className="w-3 h-3 text-red-400 flex-shrink-0" />
                  <span className="text-primary-200">{f.label}</span>
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Dr. Ben Flow */}
        <div className="bg-white/10 rounded-xl p-4 border border-growth/40">
          <p className="font-bold text-growth mb-3 flex items-center gap-2">
            <Bot className="w-4 h-4" /> Dr. Ben Flow
          </p>
          <div className="space-y-2 text-sm">
            <p className="flex items-center justify-between">
              <span className="text-primary-200">Custo mensal</span>
              <span className="font-bold text-growth">R$ 0</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-primary-200">Custo anual</span>
              <span className="font-bold text-growth">R$ 0</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-primary-200">Limite de leads</span>
              <span className="text-white font-bold">Ilimitado</span>
            </p>
            <div className="border-t border-white/10 pt-2 space-y-1">
              {[
                'Qualificação com IA (Dr. Ben)',
                'Integrado ao CRM nativo',
                'Score automático 0–100',
                '100% customizável',
              ].map(f => (
                <p key={f} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-3 h-3 text-growth flex-shrink-0" />
                  <span className="text-white">{f}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Simulador de conversa ────────────────────────────────────
function SimuladorChat({ flow }: { flow: Flow }) {
  const [msgs, setMsgs] = useState<Array<{ role: 'bot' | 'user'; texto: string }>>([])
  const [input, setInput] = useState('')
  const [sessao, setSessao] = useState<any>(null)
  const [iniciado, setIniciado] = useState(false)

  const interpolar = (texto: string, dados: Record<string, string>) =>
    texto.replace(/\{\{(\w+)\}\}/g, (_, k) => dados[k] || `[${k}]`)

  const iniciar = () => {
    const firstStep = flow.steps[flow.firstStepId]
    const dadosIniciais = {}
    const novaSessao = {
      currentStepId: firstStep.nextStepId || flow.firstStepId,
      dados: dadosIniciais,
      status: 'ativo',
    }
    setSessao(novaSessao)
    setMsgs([{ role: 'bot', texto: interpolar(firstStep.message || '', dadosIniciais) }])
    // Envia segundo passo logo depois
    if (firstStep.nextStepId) {
      const nextStep = flow.steps[firstStep.nextStepId]
      if (nextStep?.message) {
        setTimeout(() => {
          setMsgs(prev => [...prev, { role: 'bot', texto: interpolar(nextStep.message || '', dadosIniciais) }])
        }, 800)
      }
    }
    setIniciado(true)
  }

  const enviar = () => {
    if (!input.trim() || !sessao) return
    const texto = input.trim()
    setInput('')
    setMsgs(prev => [...prev, { role: 'user', texto }])

    const currentStep = flow.steps[sessao.currentStepId]
    if (!currentStep) return

    setTimeout(() => {
      let proximoId = ''
      const novosDados = { ...sessao.dados }

      if (currentStep.type === 'collect') {
        novosDados[currentStep.collectKey || 'dado'] = texto
        proximoId = currentStep.collectNextStepId || ''
      } else if (currentStep.type === 'question') {
        const btn = currentStep.buttons?.find(b => texto.toLowerCase().includes(b.label.toLowerCase().replace(/[^\w\s]/g, '').trim())) || currentStep.buttons?.[0]
        if (btn) { novosDados['area'] = btn.payload || ''; proximoId = btn.nextStepId }
      } else {
        proximoId = currentStep.nextStepId || ''
      }

      if (proximoId) {
        const proximo = flow.steps[proximoId]
        if (proximo) {
          const novoSessao = { ...sessao, currentStepId: proximoId, dados: novosDados }
          setSessao(novoSessao)

          if (proximo.type === 'ai_qualify') {
            setMsgs(prev => [...prev, { role: 'bot', texto: interpolar(proximo.message || '', novosDados) }])
            setTimeout(() => {
              const scoreSimulado = Math.random() > 0.4 ? 85 : 55
              const destino = scoreSimulado >= 70 ? proximo.aiNextStepHighScore : proximo.aiNextStepLowScore
              if (destino) {
                const final = flow.steps[destino]
                if (final?.message) {
                  setSessao({ ...novoSessao, currentStepId: destino })
                  setMsgs(prev => [...prev, { role: 'bot', texto: interpolar(final.message, novosDados) }])
                }
              }
            }, 1500)
          } else if (proximo.message) {
            setMsgs(prev => [...prev, { role: 'bot', texto: interpolar(proximo.message, novosDados) }])
          }
        }
      }
    }, 600)
  }

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
      {/* Barra de status */}
      <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-green-400 text-xs font-medium">Dr. Ben Flow — Simulador</span>
        <span className="text-slate-500 text-xs ml-auto">{flow.nome}</span>
      </div>

      {/* Chat */}
      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {!iniciado ? (
          <div className="flex items-center justify-center h-full">
            <button onClick={iniciar} className="bg-growth text-primary px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-growth-400 transition-colors">
              <Play className="w-4 h-4" /> Iniciar Simulação
            </button>
          </div>
        ) : (
          msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${
                m.role === 'bot' ? 'bg-slate-700 text-slate-100' : 'bg-growth text-primary'
              }`}>
                {m.role === 'bot' && <p className="text-growth text-xs font-medium mb-1">🤖 Dr. Ben</p>}
                {m.texto}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      {iniciado && (
        <div className="border-t border-slate-700 p-3 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && enviar()}
            placeholder="Digite sua resposta..."
            className="flex-1 bg-slate-800 text-slate-100 rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-growth"
          />
          <button onClick={enviar} className="bg-growth text-primary px-4 rounded-lg font-medium text-sm hover:bg-growth-400 transition-colors">
            Enviar
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────
export default function FlowBuilder() {
  const [fluxoSelecionado, setFluxoSelecionado] = useState<Flow | null>(null)
  const [abaAtiva, setAbaAtiva] = useState<'fluxos' | 'simulador' | 'config' | 'economia'>('fluxos')
  const [fluxoSimulador, setFluxoSimulador] = useState(FLUXOS_BIBLIOTECA[0])

  const totalLeads = FLUXOS_BIBLIOTECA.reduce((a, f) => a + (f.stats?.leadsGerados || 0), 0)
  const totalDisparos = FLUXOS_BIBLIOTECA.reduce((a, f) => a + (f.stats?.disparos || 0), 0)
  const mediaConversao = FLUXOS_BIBLIOTECA.reduce((a, f, _, arr) =>
    a + (f.stats?.taxaConversao || 0) / arr.length, 0).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dr. Ben Flow</h1>
          <p className="text-slate-500 text-sm mt-1">
            Motor de fluxos conversacionais nativo — substitui ManyChat com custo zero
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-growth-50 border border-growth-200 rounded-full px-4 py-2">
            <DollarSign className="w-4 h-4 text-growth-600" />
            <span className="text-growth-700 text-sm font-bold">Economia: R$ 5.760/ano</span>
          </div>
          <button className="btn-primary text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo Fluxo
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Fluxos Ativos', value: FLUXOS_BIBLIOTECA.filter(f => f.ativo).length, cor: 'text-emerald-600', icon: '⚡' },
          { label: 'Total Disparos', value: totalDisparos, cor: 'text-blue-600', icon: '📨' },
          { label: 'Leads Gerados', value: totalLeads, cor: 'text-primary', icon: '🎯' },
          { label: 'Taxa Conversão', value: `${mediaConversao}%`, cor: 'text-emerald-600', icon: '📈' },
        ].map(k => (
          <div key={k.label} className="card text-center py-4">
            <p className="text-2xl mb-1">{k.icon}</p>
            <p className={`text-2xl font-bold ${k.cor}`}>{k.value}</p>
            <p className="text-slate-500 text-xs">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        {[
          { id: 'fluxos', label: '⚡ Fluxos' },
          { id: 'simulador', label: '🎮 Simulador' },
          { id: 'config', label: '🔧 Configuração' },
          { id: 'economia', label: '💰 Economia' },
        ].map(aba => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${abaAtiva === aba.id ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {/* ── ABA: Fluxos ── */}
      {abaAtiva === 'fluxos' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FLUXOS_BIBLIOTECA.map(flow => (
              <FluxoCard key={flow.id} flow={flow} onSelect={() => setFluxoSelecionado(flow)} />
            ))}

            {/* Card de criar novo */}
            <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-6 flex flex-col items-center justify-center gap-3 hover:border-primary-300 hover:bg-primary-50/30 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-slate-100 group-hover:bg-primary-100 rounded-full flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center">
                <p className="font-medium text-slate-600 text-sm">Criar novo fluxo</p>
                <p className="text-slate-400 text-xs mt-0.5">WhatsApp · Instagram · Chat</p>
              </div>
            </div>
          </div>

          {/* Info canais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                canal: 'WhatsApp Business API',
                icone: '💬',
                cor: 'bg-green-50 border-green-200',
                status: 'Ativo — webhook configurado',
                statusCor: 'text-emerald-600',
                webhook: '/api/flow/whatsapp',
                desc: 'Recebe mensagens direto da API oficial do WhatsApp. Nenhum custo adicional além do WhatsApp Business.',
              },
              {
                canal: 'Instagram Graph API',
                icone: '📸',
                cor: 'bg-pink-50 border-pink-200',
                status: 'Pendente — Fase C',
                statusCor: 'text-amber-600',
                webhook: '/api/flow/instagram',
                desc: 'Responde automaticamente a DMs e comentários do Instagram. Requer conta Business conectada.',
              },
              {
                canal: 'Chat do Site',
                icone: '🌐',
                cor: 'bg-blue-50 border-blue-200',
                status: 'Widget disponível',
                statusCor: 'text-blue-600',
                webhook: '/api/flow/site-chat',
                desc: 'Widget JavaScript para embutir no mauromoncao.adv.br. Funciona sem dependência externa.',
              },
            ].map(c => (
              <div key={c.canal} className={`rounded-xl border p-4 ${c.cor}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{c.icone}</span>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{c.canal}</p>
                    <p className={`text-xs font-medium ${c.statusCor}`}>{c.status}</p>
                  </div>
                </div>
                <p className="text-slate-600 text-xs mb-2">{c.desc}</p>
                <code className="text-xs bg-white/60 text-slate-600 px-2 py-1 rounded block font-mono">{c.webhook}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ABA: Simulador ── */}
      {abaAtiva === 'simulador' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Fluxo para testar:</label>
            <select
              value={fluxoSimulador.id}
              onChange={e => setFluxoSimulador(FLUXOS_BIBLIOTECA.find(f => f.id === e.target.value) || FLUXOS_BIBLIOTECA[0])}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              {FLUXOS_BIBLIOTECA.map(f => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SimuladorChat key={fluxoSimulador.id} flow={fluxoSimulador} />

            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">Etapas do Fluxo</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.values(fluxoSimulador.steps).map((step, i) => (
                  <div key={step.id} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStepTypeColor(step.type)}`}>
                        {getStepTypeLabel(step.type)}
                      </span>
                      {step.message && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{step.message}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ABA: Configuração ── */}
      {abaAtiva === 'config' && (
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-500" />
              Configuração WhatsApp Business API
            </h3>
            <div className="space-y-4">
              {[
                { label: 'WHATSAPP_TOKEN', desc: 'Token de acesso permanente — Meta Business', placeholder: 'EAABxx...', tipo: 'password' },
                { label: 'WHATSAPP_PHONE_NUMBER_ID', desc: 'ID do número no Meta', placeholder: '123456789', tipo: 'text' },
                { label: 'WHATSAPP_VERIFY_TOKEN', desc: 'Token de verificação do webhook (você escolhe)', placeholder: 'bengrowthcenter2026', tipo: 'text' },
                { label: 'PLANTONISTA_WHATSAPP', desc: 'Número do Dr. Mauro para alertas urgentes (com DDI)', placeholder: '5586999999999', tipo: 'text' },
              ].map(campo => (
                <div key={campo.label} className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">{campo.label}</label>
                  <p className="text-xs text-slate-400">{campo.desc}</p>
                  <input
                    type={campo.tipo}
                    placeholder={campo.placeholder}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" />
              URL do Webhook para configurar no Meta
            </h3>
            <div className="bg-slate-900 rounded-xl p-4">
              <p className="text-slate-400 text-xs mb-2">Cole esta URL no Meta Business → WhatsApp → Webhooks:</p>
              <code className="text-growth text-sm block">https://seu-dominio.vercel.app/api/flow/whatsapp</code>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { passo: '1', texto: 'Acesse business.facebook.com → App → WhatsApp → Configuration', link: 'https://business.facebook.com' },
                { passo: '2', texto: 'Cole a URL acima em "Callback URL" e o WHATSAPP_VERIFY_TOKEN em "Verify token"', link: null },
                { passo: '3', texto: 'Assine os eventos: messages, message_deliveries, message_reads', link: null },
              ].map(s => (
                <div key={s.passo} className="bg-blue-50 rounded-xl p-3 flex gap-3">
                  <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{s.passo}</span>
                  <div>
                    <p className="text-xs text-slate-700">{s.texto}</p>
                    {s.link && (
                      <a href={s.link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                        Abrir <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ABA: Economia ── */}
      {abaAtiva === 'economia' && (
        <div className="space-y-5">
          <ComparativoCard />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card p-5">
              <h3 className="font-bold text-slate-800 mb-4">💰 Custo Zero — Como é Possível?</h3>
              <div className="space-y-3">
                {[
                  { icone: '🤖', titulo: 'Dr. Ben é o motor', desc: 'A IA já está no projeto. O fluxo usa Gemini Flash (gratuito até 1M req/dia) para qualificar leads.' },
                  { icone: '📡', titulo: 'API oficial do WhatsApp', desc: 'A Meta oferece a API de WhatsApp Business gratuitamente. Você paga apenas por conversas iniciadas pelo negócio (conversas de serviço são grátis).' },
                  { icone: '⚡', titulo: 'Serverless na Vercel', desc: 'A API /api/flow/whatsapp roda como função serverless. No plano gratuito da Vercel: 100k execuções/mês — mais do que suficiente.' },
                  { icone: '🔧', titulo: 'Sem intermediário', desc: 'ManyChat cobra por ser intermediário. Removendo ele, você vai direto: WhatsApp → Ben Growth Center → CRM.' },
                ].map(item => (
                  <div key={item.titulo} className="flex gap-3">
                    <span className="text-2xl flex-shrink-0">{item.icone}</span>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{item.titulo}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-bold text-slate-800 mb-4">📊 O que a Economia Paga</h3>
              <div className="space-y-3">
                {[
                  { item: 'Google Workspace Business Standard', custo: 'R$ 70/mês', status: '✅ já tem' },
                  { item: 'Domínio benhubcenter.com (Cloudflare)', custo: 'R$ 60/ano', status: '⏳ pendente' },
                  { item: 'Vercel Pro (se precisar)', custo: 'R$ 100/mês', status: '⏳ futuro' },
                  { item: 'Sobra de economia por mês', custo: 'R$ 310/mês', status: '💰 livre' },
                ].map(r => (
                  <div key={r.item} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{r.item}</p>
                      <p className="text-slate-400 text-xs">{r.status}</p>
                    </div>
                    <span className="font-bold text-slate-700 text-sm">{r.custo}</span>
                  </div>
                ))}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                  <p className="text-emerald-700 font-bold">💡 Resultado final</p>
                  <p className="text-emerald-600 text-sm mt-1">Sistema mais poderoso que o ManyChat, com custo praticamente zero além do que já paga.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal do fluxo */}
      {fluxoSelecionado && (
        <FluxoViewer flow={fluxoSelecionado} onClose={() => setFluxoSelecionado(null)} />
      )}
    </div>
  )
}
