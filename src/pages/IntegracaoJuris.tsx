import React, { useState, useEffect } from 'react'
import {
  Scale, TrendingUp, ArrowRight, ArrowLeft, ArrowLeftRight,
  CheckCircle2, Clock, AlertCircle, RefreshCw, Users,
  DollarSign, FileText, Bell, ExternalLink, Zap, Send
} from 'lucide-react'
import {
  MOCK_CROSS_EVENTS, MOCK_LEADS_PIPELINE, MOCK_SINAIS_JURIS,
  BEN_MODULES, getCorEventType, getLabelEventType,
  calcularTaxaConversaoJuris, getEventosPendentes,
  listarEventosBridge, sincronizarComJuris, enviarLeadParaJuris,
  type CrossModuleEvent
} from '../lib/crossModuleIntegration'

// ─── Card de evento cruzado ─────────────────────────────────
function EventoCard({ evento }: { evento: CrossModuleEvent }) {
  const isGrowthOrigem = evento.origem === 'growth'
  const corClasse = getCorEventType(evento.tipo)
  const label = getLabelEventType(evento.tipo)

  return (
    <div className={`rounded-xl border p-4 ${corClasse} transition-all hover:scale-[1.01]`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold">{label}</span>
            {evento.status === 'pendente' && (
              <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5">
                Pendente
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs opacity-70 mb-2">
            <span className={`font-semibold ${isGrowthOrigem ? 'text-green-400' : 'text-blue-400'}`}>
              {isGrowthOrigem ? '🟢 Growth Center' : '🔵 Juris Center'}
            </span>
            <ArrowRight className="w-3 h-3" />
            <span className={`font-semibold ${!isGrowthOrigem ? 'text-green-400' : 'text-blue-400'}`}>
              {!isGrowthOrigem ? '🟢 Growth Center' : '🔵 Juris Center'}
            </span>
          </div>
          {evento.agenteOrigem && (
            <p className="text-xs opacity-60 mb-2">
              Agente: <span className="font-medium">{evento.agenteOrigem}</span>
            </p>
          )}
          <div className="bg-black/20 rounded-lg p-2 text-xs opacity-80 space-y-0.5">
            {Object.entries(evento.payload).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="opacity-60 capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                <span className="font-medium">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-right text-xs opacity-50 whitespace-nowrap">
          {evento.timestamp}
        </div>
      </div>
    </div>
  )
}

// ─── Componente Principal ────────────────────────────────────
export default function IntegracaoJuris() {
  const [abaAtiva, setAbaAtiva] = useState<'fluxo' | 'leads' | 'processos'>('fluxo')
  const [sincronizando, setSincronizando] = useState(false)
  const [eventos, setEventos] = useState<CrossModuleEvent[]>(MOCK_CROSS_EVENTS)
  const [mensagemStatus, setMensagemStatus] = useState('')
  const [enviandoLead, setEnviandoLead] = useState<string | null>(null)
  const pendentes = eventos.filter(e => e.status === 'pendente')
  const taxaConversao = calcularTaxaConversaoJuris()

  useEffect(() => {
    listarEventosBridge().then(evts => { if (evts?.length) setEventos(evts) })
  }, [])

  const handleSincronizar = async () => {
    setSincronizando(true)
    setMensagemStatus('')
    try {
      const result = await sincronizarComJuris()
      setMensagemStatus(result.mensagem)
      const evts = await listarEventosBridge()
      if (evts?.length) setEventos(evts)
    } catch {
      setMensagemStatus('Erro ao sincronizar')
    } finally {
      setSincronizando(false)
      setTimeout(() => setMensagemStatus(''), 4000)
    }
  }

  const handleEnviarLead = async (lead: typeof MOCK_LEADS_PIPELINE[0]) => {
    setEnviandoLead(lead.id)
    const result = await enviarLeadParaJuris({
      nome: lead.nome, telefone: lead.telefone, email: lead.email,
      area: lead.areaJuridica, score: lead.score,
      valorEstimado: lead.valorEstimado, urgencia: lead.urgencia,
    })
    setMensagemStatus(result.mensagem)
    setEnviandoLead(null)
    setTimeout(() => setMensagemStatus(''), 4000)
  }

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ArrowLeftRight className="w-6 h-6 text-gold" />
            Integração com Ben Juris Center
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Fluxo bidirecional de dados entre Módulo 01 (Comercial) e Módulo 02 (Jurídico)
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendentes.length > 0 && (
            <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 rounded-full px-3 py-1.5">
              <Bell className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400 text-xs font-semibold">{pendentes.length} pendente(s)</span>
            </div>
          )}
          <button
            onClick={handleSincronizar}
            disabled={sincronizando}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: '#D4A017', color: '#0f2044' }}
          >
            <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} />
            {sincronizando ? 'Sincronizando...' : 'Sincronizar Agora'}
          </button>
          <a
            href={BEN_MODULES.JURIS.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir Juris Center
          </a>
        </div>
      </div>

      {/* ── Banner de status ────────────────────────────────── */}
      {mensagemStatus && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-300 text-sm font-medium">{mensagemStatus}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="card border border-green-500/30" style={{ background: 'rgba(0,179,126,0.08)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(0,179,126,0.2)' }}>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Ben Growth Center</p>
              <p className="text-xs text-emerald-400">Módulo 01 — Inteligência Comercial</p>
            </div>
            <div className="ml-auto w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: 'Leads Hoje', value: '7' },
              { label: 'CPL Médio', value: 'R$ 38' },
              { label: 'Campanhas Ativas', value: '4' },
              { label: 'Agentes Dr. Ben', value: '7' },
            ].map(item => (
              <div key={item.label} className="bg-white/5 rounded-lg p-2">
                <p className="text-gray-400">{item.label}</p>
                <p className="font-bold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card border border-blue-500/30" style={{ background: 'rgba(59,130,246,0.08)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(59,130,246,0.2)' }}>
              <Scale className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Ben Juris Center</p>
              <p className="text-xs text-blue-400">Módulo 02 — Gestão Jurídica</p>
            </div>
            <div className="ml-auto w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: 'Processos Ativos', value: '23' },
              { label: 'Clientes', value: '31' },
              { label: 'Prazos esta semana', value: '5' },
              { label: 'Honorários/mês', value: 'R$ 42k' },
            ].map(item => (
              <div key={item.label} className="bg-white/5 rounded-lg p-2">
                <p className="text-gray-400">{item.label}</p>
                <p className="font-bold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPIs de integração ──────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Leads → Juris hoje', value: '3', cor: 'text-emerald-400', bg: 'rgba(0,179,126,0.1)' },
          { icon: CheckCircle2, label: 'Taxa conversão Growth→Juris', value: `${taxaConversao}%`, cor: 'text-blue-400', bg: 'rgba(59,130,246,0.1)' },
          { icon: DollarSign, label: 'Receita Juris gerada pelo Growth', value: 'R$ 39,5k', cor: 'text-amber-400', bg: 'rgba(212,160,23,0.1)' },
          { icon: AlertCircle, label: 'Eventos pendentes', value: String(pendentes.length), cor: 'text-red-400', bg: 'rgba(239,68,68,0.1)' },
        ].map(kpi => (
          <div key={kpi.label} className="card flex items-center gap-3" style={{ background: kpi.bg, border: '1px solid rgba(255,255,255,0.06)' }}>
            <kpi.icon className={`w-8 h-8 flex-shrink-0 ${kpi.cor}`} />
            <div>
              <p className="text-gray-400 text-xs">{kpi.label}</p>
              <p className={`text-xl font-bold ${kpi.cor}`}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Abas ───────────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {([
          { id: 'fluxo', label: '⚡ Fluxo de Eventos', count: MOCK_CROSS_EVENTS.length },
          { id: 'leads', label: '🎯 Pipeline de Leads', count: MOCK_LEADS_PIPELINE.length },
          { id: 'processos', label: '⚖️ Sinais Juris', count: MOCK_SINAIS_JURIS.length },
        ] as const).map(aba => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all -mb-px ${
              abaAtiva === aba.id
                ? 'border-yellow-400 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {aba.label}
            <span className="ml-2 text-xs bg-white/10 rounded-full px-2 py-0.5">{aba.count}</span>
          </button>
        ))}
      </div>

      {/* ── Conteúdo das abas ───────────────────────────────── */}

      {abaAtiva === 'fluxo' && (
        <div className="space-y-3">
          <p className="text-gray-400 text-xs">
            Eventos trocados entre os módulos — Growth Center ↔ Ben Juris Center em tempo real
          </p>
          {eventos.map(evt => (
            <EventoCard key={evt.id} evento={evt} />
          ))}
        </div>
      )}

      {abaAtiva === 'leads' && (
        <div className="space-y-3">
          <p className="text-gray-400 text-xs">
            Leads capturados pelo Dr. Ben Atendimento e seu status no Juris Center
          </p>
          {MOCK_LEADS_PIPELINE.map(lead => (
            <div key={lead.id} className="card border border-gray-100 hover:border-white/15 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-gray-900">{lead.nome}</p>
                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                      lead.urgencia === 'alta' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      lead.urgencia === 'media' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-slate-500/20 text-gray-400 border border-slate-500/30'
                    }`}>
                      {lead.urgencia === 'alta' ? '🔴 Alta' : lead.urgencia === 'media' ? '🟡 Média' : '🟢 Baixa'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                    <span>📞 {lead.telefone}</span>
                    <span>•</span>
                    <span>⚖️ {lead.areaJuridica}</span>
                    <span>•</span>
                    <span>📡 {lead.origem}</span>
                    <span>•</span>
                    <span>🤖 {lead.agenteCaptou}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-20 rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-emerald-400" style={{ width: `${lead.score}%` }} />
                      </div>
                      <span className="text-xs text-emerald-400 font-bold">{lead.score} pts</span>
                    </div>
                    <span className="text-xs text-amber-400 font-semibold">
                      💰 R$ {lead.valorEstimado.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs rounded-full px-2.5 py-1 font-semibold border ${
                    lead.statusJuris === 'cliente_ativo'  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                    lead.statusJuris === 'processo_aberto' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                    lead.statusJuris === 'triagem'         ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                    'bg-slate-500/20 text-gray-400 border-slate-500/30'
                  }`}>
                    {lead.statusJuris === 'cliente_ativo'   ? '✅ Cliente Ativo' :
                     lead.statusJuris === 'processo_aberto' ? '⚖️ Processo Aberto' :
                     lead.statusJuris === 'triagem'         ? '🔍 Em Triagem' : '⏳ Aguardando'}
                  </span>
                  <p className="text-gray-400 text-xs mt-2">{lead.dataCaptura}</p>
                  {lead.statusJuris === 'aguardando' && (
                    <button
                      onClick={() => handleEnviarLead(lead)}
                      disabled={enviandoLead === lead.id}
                      className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 transition-all disabled:opacity-50"
                    >
                      {enviandoLead === lead.id
                        ? <RefreshCw className="w-3 h-3 animate-spin" />
                        : <Send className="w-3 h-3" />}
                      {enviandoLead === lead.id ? 'Enviando...' : 'Enviar ao Juris'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {abaAtiva === 'processos' && (
        <div className="space-y-3">
          <p className="text-gray-400 text-xs">
            Sinais do Juris Center que afetam a estratégia comercial do Growth
          </p>
          {MOCK_SINAIS_JURIS.map(sinal => (
            <div key={sinal.processoNumero} className="card border border-blue-500/20 hover:border-blue-500/40 transition-all"
              style={{ background: 'rgba(59,130,246,0.06)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <p className="font-bold text-white text-sm">{sinal.cliente}</p>
                    <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full px-2 py-0.5">
                      {sinal.area}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mb-2">
                    Processo: {sinal.processoNumero}
                  </p>
                  <p className="text-gray-500 text-xs mb-3">
                    📌 {sinal.fase}
                  </p>
                  {sinal.campanhaRelacionada && (
                    <div className="flex items-center gap-1.5 text-xs text-purple-400">
                      <Zap className="w-3 h-3" />
                      Campanha Growth relacionada:
                      <span className="font-semibold">{sinal.campanhaRelacionada}</span>
                    </div>
                  )}
                </div>
                <div className="text-right space-y-2">
                  <div>
                    <p className="text-gray-400 text-xs">Honorário Total</p>
                    <p className="font-bold text-amber-400">R$ {sinal.honorarioTotal.toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Pago</p>
                    <p className="font-semibold text-emerald-400">
                      R$ {sinal.honorarioPago.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  {sinal.proximoPrazo && (
                    <div className="bg-red-500/15 border border-red-500/30 rounded-lg px-2 py-1">
                      <p className="text-red-400 text-xs font-semibold">
                        ⏰ Prazo: {sinal.proximoPrazo}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Diagrama visual de integração ──────────────────── */}
      <div className="card border border-gray-200">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-gold" />
          Mapa de Integração — Dr. Ben Ecosystem
        </h3>
        <div className="flex items-center justify-between gap-4">
          {/* Growth */}
          <div className="flex-1 rounded-xl border border-green-500/30 p-4 text-center"
            style={{ background: 'rgba(0,179,126,0.06)' }}>
            <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="font-bold text-white text-sm mb-1">Ben Growth Center</p>
            <p className="text-emerald-400 text-xs mb-3">Módulo 01</p>
            <div className="space-y-1 text-xs text-gray-500 text-left">
              {['🤖 Dr. Ben Atendimento', '📢 Dr. Ben Campanhas', '📝 Dr. Ben Conteúdo', '🔔 Dr. Ben Monitor'].map(a => (
                <p key={a}>{a}</p>
              ))}
            </div>
          </div>
          {/* Setas */}
          <div className="flex flex-col items-center gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-1 text-emerald-400">
              <span>Leads qualificados</span>
              <ArrowRight className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-1 text-emerald-400">
              <span>Novos clientes</span>
              <ArrowRight className="w-3 h-3" />
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-1 text-blue-400">
              <ArrowLeft className="w-3 h-3" />
              <span>Contratos assinados</span>
            </div>
            <div className="flex items-center gap-1 text-blue-400">
              <ArrowLeft className="w-3 h-3" />
              <span>Sinais de conteúdo</span>
            </div>
          </div>
          {/* Juris */}
          <div className="flex-1 rounded-xl border border-blue-500/30 p-4 text-center"
            style={{ background: 'rgba(59,130,246,0.06)' }}>
            <Scale className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="font-bold text-white text-sm mb-1">Ben Juris Center</p>
            <p className="text-blue-400 text-xs mb-3">Módulo 02</p>
            <div className="space-y-1 text-xs text-gray-500 text-left">
              {['📝 Dr. Ben Petições', '📋 Dr. Ben Contratos', '⚖️ Dr. Ben Análise', '🔍 Dr. Ben Auditoria'].map(a => (
                <p key={a}>{a}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
