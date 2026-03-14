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
  const label = getLabelEventType(evento.tipo)

  // Cores sólidas e legíveis conforme tipo do evento
  const tipoStyles: Record<string, { bg: string; border: string; badge: string }> = {
    lead_qualificado:   { bg: '#f0fdf4', border: '#86efac', badge: '#16a34a' },
    contrato_assinado:  { bg: '#eff6ff', border: '#93c5fd', badge: '#2563eb' },
    processo_aberto:    { bg: '#fefce8', border: '#fde047', badge: '#ca8a04' },
    sinal_juris:        { bg: '#fdf4ff', border: '#d8b4fe', badge: '#9333ea' },
    pagamento:          { bg: '#f0fdf4', border: '#86efac', badge: '#16a34a' },
  }
  const s = tipoStyles[evento.tipo] ?? { bg: '#f8fafc', border: '#cbd5e1', badge: '#64748b' }

  return (
    <div
      className="rounded-xl border p-4 transition-all hover:shadow-md"
      style={{ background: s.bg, borderColor: s.border }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold" style={{ color: '#1e293b' }}>{label}</span>
            {evento.status === 'pendente' && (
              <span className="text-xs rounded-full px-2 py-0.5 font-semibold"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                Pendente
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs mb-2">
            <span className="font-semibold" style={{ color: isGrowthOrigem ? '#16a34a' : '#2563eb' }}>
              {isGrowthOrigem ? '🟢 Growth Center' : '🔵 Juris Center'}
            </span>
            <ArrowRight className="w-3 h-3" style={{ color: '#94a3b8' }} />
            <span className="font-semibold" style={{ color: !isGrowthOrigem ? '#16a34a' : '#2563eb' }}>
              {!isGrowthOrigem ? '🟢 Growth Center' : '🔵 Juris Center'}
            </span>
          </div>
          {evento.agenteOrigem && (
            <p className="text-xs mb-2" style={{ color: '#475569' }}>
              Agente: <span className="font-medium" style={{ color: '#1e293b' }}>{evento.agenteOrigem}</span>
            </p>
          )}
          <div className="rounded-lg p-2 text-xs space-y-0.5"
            style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.06)' }}>
            {Object.entries(evento.payload).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span style={{ color: '#64748b' }} className="capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                <span className="font-medium" style={{ color: '#1e293b' }}>{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-right text-xs whitespace-nowrap" style={{ color: '#94a3b8' }}>
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ArrowLeftRight className="w-6 h-6" style={{ color: '#DEC078' }} />
            Integração com Ben Juris Center
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Fluxo bidirecional de dados entre Módulo 01 (Comercial) e Módulo 02 (Jurídico)
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendentes.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ background: '#fef2f2', border: '1px solid #fca5a5' }}>
              <Bell className="w-3.5 h-3.5" style={{ color: '#dc2626' }} />
              <span className="text-xs font-semibold" style={{ color: '#dc2626' }}>{pendentes.length} pendente(s)</span>
            </div>
          )}
          <button
            onClick={handleSincronizar}
            disabled={sincronizando}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: '#DEC078', color: '#19385C' }}
          >
            <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} />
            {sincronizando ? 'Sincronizando...' : 'Sincronizar Agora'}
          </button>
          <a
            href={BEN_MODULES.JURIS.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: '#eff6ff', border: '1px solid #93c5fd', color: '#1d4ed8' }}
          >
            <ExternalLink className="w-4 h-4" />
            Abrir Juris Center
          </a>
        </div>
      </div>

      {/* ── Banner de status ────────────────────────────────── */}
      {mensagemStatus && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#16a34a' }} />
          <p className="text-sm font-medium" style={{ color: '#15803d' }}>{mensagemStatus}</p>
        </div>
      )}

      {/* ── Módulos ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Growth Center */}
        <div className="rounded-xl border p-5" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: '#dcfce7', border: '1px solid #86efac' }}>
              <TrendingUp className="w-5 h-5" style={{ color: '#16a34a' }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#14532d' }}>Ben Growth Center</p>
              <p className="text-xs font-medium" style={{ color: '#16a34a' }}>Módulo 01 — Inteligência Comercial</p>
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
              <div key={item.label} className="rounded-lg p-2.5"
                style={{ background: '#dcfce7', border: '1px solid #bbf7d0' }}>
                <p className="font-medium mb-0.5" style={{ color: '#166534' }}>{item.label}</p>
                <p className="font-bold text-base" style={{ color: '#14532d' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Juris Center */}
        <div className="rounded-xl border p-5" style={{ background: '#eff6ff', border: '1px solid #93c5fd' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: '#dbeafe', border: '1px solid #93c5fd' }}>
              <Scale className="w-5 h-5" style={{ color: '#2563eb' }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#1e3a5f' }}>Ben Juris Center</p>
              <p className="text-xs font-medium" style={{ color: '#2563eb' }}>Módulo 02 — Gestão Jurídica</p>
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
              <div key={item.label} className="rounded-lg p-2.5"
                style={{ background: '#dbeafe', border: '1px solid #bfdbfe' }}>
                <p className="font-medium mb-0.5" style={{ color: '#1e40af' }}>{item.label}</p>
                <p className="font-bold text-base" style={{ color: '#1e3a8a' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPIs de integração ──────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Users,        label: 'Leads → Juris hoje',           value: '3',            bg: '#f0fdf4', border: '#86efac', iconColor: '#16a34a', valColor: '#15803d' },
          { icon: CheckCircle2, label: 'Taxa conversão Growth→Juris',  value: `${taxaConversao}%`, bg: '#eff6ff', border: '#93c5fd', iconColor: '#2563eb', valColor: '#1d4ed8' },
          { icon: DollarSign,   label: 'Receita Juris gerada pelo Growth', value: 'R$ 39,5k', bg: '#fffbeb', border: '#fde68a', iconColor: '#d97706', valColor: '#b45309' },
          { icon: AlertCircle,  label: 'Eventos pendentes',            value: String(pendentes.length), bg: '#fef2f2', border: '#fca5a5', iconColor: '#dc2626', valColor: '#b91c1c' },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl border p-4 flex items-center gap-3"
            style={{ background: kpi.bg, borderColor: kpi.border }}>
            <kpi.icon className="w-8 h-8 flex-shrink-0" style={{ color: kpi.iconColor }} />
            <div>
              <p className="text-xs font-medium" style={{ color: '#64748b' }}>{kpi.label}</p>
              <p className="text-xl font-bold" style={{ color: kpi.valColor }}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Abas ───────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
        {([
          { id: 'fluxo',     label: '⚡ Fluxo de Eventos',   count: MOCK_CROSS_EVENTS.length },
          { id: 'leads',     label: '🎯 Pipeline de Leads',  count: MOCK_LEADS_PIPELINE.length },
          { id: 'processos', label: '🔱 Sinais Juris',       count: MOCK_SINAIS_JURIS.length },
        ] as const).map(aba => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all"
            style={
              abaAtiva === aba.id
                ? { background: '#ffffff', color: '#19385C', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0' }
                : { color: '#64748b', border: '1px solid transparent' }
            }
          >
            {aba.label}
            <span className="text-xs rounded-full px-2 py-0.5"
              style={{ background: abaAtiva === aba.id ? '#19385C' : '#e2e8f0', color: abaAtiva === aba.id ? '#fff' : '#64748b' }}>
              {aba.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Conteúdo das abas ───────────────────────────────── */}

      {abaAtiva === 'fluxo' && (
        <div className="space-y-3">
          <p className="text-gray-500 text-xs">
            Eventos trocados entre os módulos — Growth Center ↔ Ben Juris Center em tempo real
          </p>
          {eventos.map(evt => (
            <EventoCard key={evt.id} evento={evt} />
          ))}
        </div>
      )}

      {abaAtiva === 'leads' && (
        <div className="space-y-3">
          <p className="text-gray-500 text-xs">
            Leads capturados pelo Dr. Ben Atendimento e seu status no Juris Center
          </p>
          {MOCK_LEADS_PIPELINE.map(lead => (
            <div key={lead.id} className="rounded-xl border bg-white p-4 hover:shadow-md transition-all"
              style={{ border: '1px solid #e2e8f0' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-gray-900">{lead.nome}</p>
                    <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${
                      lead.urgencia === 'alta'  ? 'bg-red-100 text-red-700 border border-red-200' :
                      lead.urgencia === 'media' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {lead.urgencia === 'alta' ? '🔴 Alta' : lead.urgencia === 'media' ? '🟡 Média' : '🟢 Baixa'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                    <span>📞 {lead.telefone}</span>
                    <span>•</span>
                    <span>🔱 {lead.areaJuridica}</span>
                    <span>•</span>
                    <span>📡 {lead.origem}</span>
                    <span>•</span>
                    <span>🤖 {lead.agenteCaptou}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-20 rounded-full" style={{ background: '#e2e8f0' }}>
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${lead.score}%` }} />
                      </div>
                      <span className="text-xs font-bold" style={{ color: '#16a34a' }}>{lead.score} pts</span>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: '#d97706' }}>
                      💰 R$ {lead.valorEstimado.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs rounded-full px-2.5 py-1 font-semibold border ${
                    lead.statusJuris === 'cliente_ativo'   ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                    lead.statusJuris === 'processo_aberto' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    lead.statusJuris === 'triagem'         ? 'bg-amber-100 text-amber-700 border-amber-200' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {lead.statusJuris === 'cliente_ativo'   ? '✅ Cliente Ativo' :
                     lead.statusJuris === 'processo_aberto' ? '🔱 Processo Aberto' :
                     lead.statusJuris === 'triagem'         ? '🔍 Em Triagem' : '⏳ Aguardando'}
                  </span>
                  <p className="text-gray-400 text-xs mt-2">{lead.dataCaptura}</p>
                  {lead.statusJuris === 'aguardando' && (
                    <button
                      onClick={() => handleEnviarLead(lead)}
                      disabled={enviandoLead === lead.id}
                      className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                      style={{ background: '#eff6ff', border: '1px solid #93c5fd', color: '#1d4ed8' }}
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
          <p className="text-gray-500 text-xs">
            Sinais do Juris Center que afetam a estratégia comercial do Growth
          </p>
          {MOCK_SINAIS_JURIS.map(sinal => (
            <div key={sinal.processoNumero} className="rounded-xl border p-4 hover:shadow-md transition-all"
              style={{ background: '#eff6ff', border: '1px solid #93c5fd' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 flex-shrink-0" style={{ color: '#2563eb' }} />
                    <p className="font-bold text-sm" style={{ color: '#1e3a5f' }}>{sinal.cliente}</p>
                    <span className="text-xs rounded-full px-2 py-0.5 font-semibold"
                      style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                      {sinal.area}
                    </span>
                  </div>
                  <p className="text-xs mb-1" style={{ color: '#475569' }}>
                    Processo: {sinal.processoNumero}
                  </p>
                  <p className="text-xs mb-3" style={{ color: '#64748b' }}>
                    📌 {sinal.fase}
                  </p>
                  {sinal.campanhaRelacionada && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: '#7c3aed' }}>
                      <Zap className="w-3 h-3" />
                      Campanha Growth relacionada:
                      <span className="font-semibold">{sinal.campanhaRelacionada}</span>
                    </div>
                  )}
                </div>
                <div className="text-right space-y-2">
                  <div>
                    <p className="text-xs" style={{ color: '#64748b' }}>Honorário Total</p>
                    <p className="font-bold" style={{ color: '#d97706' }}>R$ {sinal.honorarioTotal.toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: '#64748b' }}>Pago</p>
                    <p className="font-semibold" style={{ color: '#16a34a' }}>
                      R$ {sinal.honorarioPago.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  {sinal.proximoPrazo && (
                    <div className="rounded-lg px-2 py-1"
                      style={{ background: '#fef2f2', border: '1px solid #fca5a5' }}>
                      <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>
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
      <div className="rounded-xl border bg-white p-5" style={{ border: '1px solid #e2e8f0' }}>
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: '#19385C' }}>
          <ArrowLeftRight className="w-4 h-4" style={{ color: '#DEC078' }} />
          Mapa de Integração — Dr. Ben Ecosystem
        </h3>
        <div className="flex items-center justify-between gap-4">
          {/* Growth */}
          <div className="flex-1 rounded-xl border p-4 text-center"
            style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
            <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{ color: '#16a34a' }} />
            <p className="font-bold text-sm mb-1" style={{ color: '#14532d' }}>Ben Growth Center</p>
            <p className="text-xs mb-3 font-medium" style={{ color: '#16a34a' }}>Módulo 01</p>
            <div className="space-y-1 text-xs text-left">
              {['🤖 Dr. Ben Atendimento', '📢 Dr. Ben Campanhas', '📝 Dr. Ben Conteúdo', '🔔 Dr. Ben Monitor'].map(a => (
                <p key={a} style={{ color: '#374151' }}>{a}</p>
              ))}
            </div>
          </div>
          {/* Setas */}
          <div className="flex flex-col items-center gap-3 text-xs">
            <div className="flex items-center gap-1" style={{ color: '#16a34a' }}>
              <span className="font-medium">Leads qualificados</span>
              <ArrowRight className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-1" style={{ color: '#16a34a' }}>
              <span className="font-medium">Novos clientes</span>
              <ArrowRight className="w-3 h-3" />
            </div>
            <div className="w-px h-4" style={{ background: '#cbd5e1' }} />
            <div className="flex items-center gap-1" style={{ color: '#2563eb' }}>
              <ArrowLeft className="w-3 h-3" />
              <span className="font-medium">Contratos assinados</span>
            </div>
            <div className="flex items-center gap-1" style={{ color: '#2563eb' }}>
              <ArrowLeft className="w-3 h-3" />
              <span className="font-medium">Sinais de conteúdo</span>
            </div>
          </div>
          {/* Juris */}
          <div className="flex-1 rounded-xl border p-4 text-center"
            style={{ background: '#eff6ff', border: '1px solid #93c5fd' }}>
            <Scale className="w-8 h-8 mx-auto mb-2" style={{ color: '#2563eb' }} />
            <p className="font-bold text-sm mb-1" style={{ color: '#1e3a5f' }}>Ben Juris Center</p>
            <p className="text-xs mb-3 font-medium" style={{ color: '#2563eb' }}>Módulo 02</p>
            <div className="space-y-1 text-xs text-left">
              {['📝 Dr. Ben Petições', '📋 Dr. Ben Contratos', '🔱 Dr. Ben Análise', '🔍 Dr. Ben Auditoria'].map(a => (
                <p key={a} style={{ color: '#374151' }}>{a}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
