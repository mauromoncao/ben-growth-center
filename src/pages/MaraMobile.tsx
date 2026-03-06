// ============================================================
// MARA IA — APP MOBILE
// Interface ultra-simplificada para celular do Dr. Mauro
// Acesso via PIN (sem login completo)
// URL: /mara-app
// ============================================================
import React, { useState, useEffect, useCallback } from 'react'

// ─── PIN de acesso rápido ────────────────────────────────────
const PIN_CORRETO = import.meta.env.VITE_MARA_PIN || '1234'
const PIN_STORAGE = 'mara_mobile_pin_ok'

// ─── Voice IDs ElevenLabs ────────────────────────────────────
const VOICE_MARA = 'EST9Ui6982FZPSi7gCHi'
const MARA_AVATAR = 'https://www.genspark.ai/api/files/s/qiD4oS1k?cache_control=3600'

interface Lead {
  id?: string
  nome?: string
  telefone?: string
  numero?: string
  area?: string
  urgencia?: string
  createdAt?: string
  created_at?: string
  resumo?: string
}

interface ModoAusenteState {
  ativo: boolean
  motivo: string | null
  retorno: string | null
}

const MOTIVOS = [
  { key: 'ferias',       emoji: '🏖️', label: 'Férias',         cor: 'from-blue-400 to-cyan-500' },
  { key: 'doente',       emoji: '🤒', label: 'Indisposto',     cor: 'from-rose-400 to-pink-500' },
  { key: 'audiencia',    emoji: '⚖️', label: 'Audiência',      cor: 'from-purple-400 to-violet-500' },
  { key: 'viagem',       emoji: '✈️', label: 'Viagem',         cor: 'from-sky-400 to-blue-500' },
  { key: 'reuniao',      emoji: '🤝', label: 'Reunião',        cor: 'from-amber-400 to-orange-500' },
  { key: 'fora_horario', emoji: '😴', label: 'Fora do Horário', cor: 'from-gray-400 to-slate-500' },
]

const URGENCIA_COR: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#22c55e',
}

const URGENCIA_LABEL: Record<string, string> = {
  critical: '🚨 CRÍTICO',
  high:     '🔴 ALTO',
  medium:   '🟡 MÉDIO',
  low:      '🟢 BAIXO',
}

const AREA_LABEL: Record<string, string> = {
  tributario:     '🧾 Tributário',
  previdenciario: '👴 Previdenciário',
  bancario:       '🏦 Bancário',
  trabalhista:    '👷 Trabalhista',
  imobiliario:    '🏠 Imobiliário',
  familia:        '👨‍👩‍👧 Família',
  publico:        '⚖️ Adv. Pública',
  consumidor:     '🛒 Consumidor',
  outros:         '📋 Outros',
}

// ══════════════════════════════════════════════════════════════
// TELA DE PIN
// ══════════════════════════════════════════════════════════════
function PinScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState(false)
  const [shake, setShake] = useState(false)

  const digitar = (d: string) => {
    if (pin.length >= 4) return
    const novo = pin + d
    setPin(novo)
    if (novo.length === 4) {
      if (novo === PIN_CORRETO) {
        sessionStorage.setItem(PIN_STORAGE, '1')
        setTimeout(onSuccess, 300)
      } else {
        setErro(true)
        setShake(true)
        setTimeout(() => { setPin(''); setErro(false); setShake(false) }, 900)
      }
    }
  }

  const apagar = () => setPin(p => p.slice(0, -1))

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2044] via-[#1a3a6e] to-[#0f2044] flex flex-col items-center justify-center px-6">
      {/* Avatar MARA */}
      <div className="mb-8 text-center">
        <div className="relative inline-block">
          <img
            src={MARA_AVATAR}
            alt="MARA IA"
            className="w-24 h-24 rounded-3xl border-4 border-[#D4A017] shadow-2xl object-cover mx-auto"
            onError={e => {
              (e.target as HTMLImageElement).src =
                'https://ui-avatars.com/api/?name=MARA&background=D4A017&color=0f2044&size=256&bold=true'
            }}
          />
          <span className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold border-2 border-white animate-pulse">
            ON
          </span>
        </div>
        <h1 className="text-white text-2xl font-bold mt-4">MARA IA</h1>
        <p className="text-[#D4A017] text-sm">Secretária Executiva · Dr. Mauro Monção</p>
      </div>

      {/* Dots do PIN */}
      <div className={`flex gap-4 mb-8 ${shake ? 'animate-bounce' : ''}`}>
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
              i < pin.length
                ? erro ? 'bg-red-400 border-red-400' : 'bg-[#D4A017] border-[#D4A017]'
                : 'border-white/40 bg-transparent'
            }`}
          />
        ))}
      </div>

      <p className="text-white/60 text-sm mb-6">
        {erro ? '❌ PIN incorreto. Tente novamente.' : 'Digite seu PIN de acesso'}
      </p>

      {/* Teclado numérico */}
      <div className="grid grid-cols-3 gap-3 w-64">
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
          <button
            key={i}
            onClick={() => d === '⌫' ? apagar() : d !== '' ? digitar(d) : null}
            disabled={d === ''}
            className={`h-16 rounded-2xl text-white text-2xl font-bold transition-all active:scale-95 ${
              d === ''
                ? 'invisible'
                : d === '⌫'
                ? 'bg-white/10 hover:bg-white/20 border border-white/20'
                : 'bg-white/10 hover:bg-[#D4A017]/50 border border-white/20 backdrop-blur-sm'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <p className="text-white/30 text-xs mt-8">
        Ben Growth Center · mauromonção.adv.br
      </p>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════════════
type Tab = 'home' | 'ausente' | 'leads' | 'comandos'

export default function MaraMobile() {
  const [autenticado, setAutenticado] = useState(false)
  const [aba, setAba] = useState<Tab>('home')
  const [modoAusente, setModoAusente] = useState<ModoAusenteState>({ ativo: false, motivo: null, retorno: null })
  const [carregando, setCarregando] = useState(true)
  const [ativando, setAtivando] = useState(false)
  const [motivoSelecionado, setMotivoSelecionado] = useState('ferias')
  const [retornoInput, setRetornoInput] = useState('')
  const [leads, setLeads] = useState<Lead[]>([])
  const [leadsCarregando, setLeadsCarregando] = useState(false)
  const [hora, setHora] = useState('')
  const [comandoResposta, setComandoResposta] = useState('')
  const [comandoCarregando, setComandoCarregando] = useState(false)
  const [feedback, setFeedback] = useState('')

  // Verificar PIN
  useEffect(() => {
    if (sessionStorage.getItem(PIN_STORAGE) === '1') setAutenticado(true)
  }, [])

  // Hora atual
  useEffect(() => {
    const atualizar = () => {
      setHora(new Date().toLocaleTimeString('pt-BR', {
        timeZone: 'America/Fortaleza',
        hour: '2-digit', minute: '2-digit',
      }))
    }
    atualizar()
    const id = setInterval(atualizar, 10000)
    return () => clearInterval(id)
  }, [])

  // Carregar status inicial
  const carregarStatus = useCallback(async () => {
    setCarregando(true)
    try {
      const d = await fetch('/api/whatsapp-zapi?action=modo-ausente').then(r => r.json())
      setModoAusente({ ativo: d.ativo, motivo: d.motivo, retorno: d.retorno })
    } catch {}
    setCarregando(false)
  }, [])

  useEffect(() => {
    if (autenticado) {
      carregarStatus()
      const id = setInterval(carregarStatus, 30000)
      return () => clearInterval(id)
    }
  }, [autenticado, carregarStatus])

  // Carregar leads
  const carregarLeads = useCallback(async () => {
    setLeadsCarregando(true)
    try {
      const d = await fetch('/api/leads').then(r => r.json())
      const lista: Lead[] = d?.leads || d || []
      // Ordenar por data (mais recente primeiro)
      lista.sort((a, b) => {
        const da = new Date(a.createdAt || a.created_at || 0).getTime()
        const db = new Date(b.createdAt || b.created_at || 0).getTime()
        return db - da
      })
      setLeads(lista.slice(0, 20))
    } catch {
      setLeads([])
    }
    setLeadsCarregando(false)
  }, [])

  useEffect(() => {
    if (aba === 'leads') carregarLeads()
  }, [aba, carregarLeads])

  // Ativar modo ausente
  const ativarAusente = async () => {
    setAtivando(true)
    try {
      const params = new URLSearchParams({ action: 'ativar-ausente', motivo: motivoSelecionado })
      if (retornoInput.trim()) params.set('retorno', retornoInput.trim())
      const d = await fetch(`/api/whatsapp-zapi?${params}`).then(r => r.json())
      if (d.ok) {
        setModoAusente({ ativo: true, motivo: motivoSelecionado, retorno: retornoInput || null })
        mostrarFeedback('🛡️ Modo Ausente ativado!')
        setAba('home')
      }
    } catch {}
    setAtivando(false)
  }

  // Desativar modo ausente
  const desativarAusente = async () => {
    setAtivando(true)
    try {
      const d = await fetch('/api/whatsapp-zapi?action=desativar-ausente').then(r => r.json())
      if (d.ok) {
        setModoAusente({ ativo: false, motivo: null, retorno: null })
        mostrarFeedback('✅ Você está de volta!')
      }
    } catch {}
    setAtivando(false)
  }

  // Executar comando
  const executarComando = async (cmd: string) => {
    setComandoCarregando(true)
    setComandoResposta('')
    try {
      // Consulta o status relevante
      if (cmd === '/leads') {
        const d = await fetch('/api/leads').then(r => r.json())
        const lista: Lead[] = d?.leads || d || []
        const hoje = new Date().toISOString().split('T')[0]
        const leadsHoje = lista.filter(l => (l.createdAt || l.created_at || '').startsWith(hoje))
        if (!leadsHoje.length) {
          setComandoResposta('📋 Nenhum lead hoje ainda. Dr. Ben está de plantão! 💪')
        } else {
          const linhas = leadsHoje.slice(0, 5).map((l, i) => {
            const urg = URGENCIA_LABEL[l.urgencia || 'medium'] || '🟡 MÉDIO'
            return `${i + 1}. ${l.nome || 'Sem nome'} • ${AREA_LABEL[l.area || 'outros'] || '📋'}\n   ${urg} • ${l.telefone || l.numero || '—'}`
          })
          setComandoResposta(`📋 Leads hoje (${leadsHoje.length}):\n\n${linhas.join('\n\n')}`)
        }
      } else if (cmd === '/urgentes') {
        const d = await fetch('/api/leads').then(r => r.json())
        const lista: Lead[] = d?.leads || d || []
        const urgentes = lista.filter(l => l.urgencia === 'high' || l.urgencia === 'critical')
        if (!urgentes.length) {
          setComandoResposta('🟢 Nenhum caso urgente no momento!')
        } else {
          const linhas = urgentes.slice(0, 5).map((l, i) =>
            `${i + 1}. 🚨 ${l.nome || 'Sem nome'}\n   📞 ${l.telefone || l.numero || '—'}\n   ⚖️ ${AREA_LABEL[l.area || 'outros']}`
          )
          setComandoResposta(`🚨 Urgentes (${urgentes.length}):\n\n${linhas.join('\n\n')}`)
        }
      } else if (cmd === '/status') {
        const d = await fetch('/api/whatsapp-zapi').then(r => r.json())
        const ausente = modoAusente.ativo
          ? `🔴 Ausente (${modoAusente.motivo})`
          : '🟢 Presente'
        setComandoResposta(
          `⚙️ Status do Sistema:\n\n` +
          `🤖 Dr. Ben: ${d.zapi?.includes('✅') ? '✅ Online' : '⚠️ Verificar'}\n` +
          `🎙️ TTS: ${d.elevenlabs || '—'}\n` +
          `🛡️ MARA: ${ausente}\n` +
          `📅 Hora: ${hora} (Fortaleza)`
        )
      } else if (cmd === '/resumo') {
        const d = await fetch('/api/leads').then(r => r.json())
        const lista: Lead[] = d?.leads || d || []
        const hoje = new Date().toISOString().split('T')[0]
        const leadsHoje = lista.filter(l => (l.createdAt || l.created_at || '').startsWith(hoje))
        const urgentes = lista.filter(l => l.urgencia === 'high' || l.urgencia === 'critical')
        setComandoResposta(
          `📊 Resumo do Dia — ${hora}\n\n` +
          `👥 Leads hoje: ${leadsHoje.length}\n` +
          `🚨 Urgentes: ${urgentes.length}\n` +
          `📦 Total CRM: ${lista.length}\n` +
          `🛡️ Status: ${modoAusente.ativo ? `Ausente (${modoAusente.motivo})` : 'Presente'}\n` +
          `🤖 Dr. Ben: Operacional`
        )
      }
    } catch {
      setComandoResposta('⚠️ Erro ao buscar dados. Tente novamente.')
    }
    setComandoCarregando(false)
  }

  const mostrarFeedback = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(''), 2500)
  }

  // Logout
  const sair = () => {
    sessionStorage.removeItem(PIN_STORAGE)
    setAutenticado(false)
  }

  if (!autenticado) {
    return <PinScreen onSuccess={() => setAutenticado(true)} />
  }

  const motivoAtual = MOTIVOS.find(m => m.key === modoAusente.motivo)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">

      {/* ─── Feedback Toast ──────────────────────────────────── */}
      {feedback && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0f2044] text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold animate-bounce">
          {feedback}
        </div>
      )}

      {/* ─── Header fixo ─────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#0f2044] to-[#1a3a6e] px-5 pt-12 pb-5 sticky top-0 z-40 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={MARA_AVATAR}
                alt="MARA"
                className="w-11 h-11 rounded-xl border-2 border-[#D4A017] object-cover"
                onError={e => {
                  (e.target as HTMLImageElement).src =
                    'https://ui-avatars.com/api/?name=MARA&background=D4A017&color=0f2044&size=128&bold=true'
                }}
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f2044]" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">MARA IA</p>
              <p className="text-[#D4A017] text-xs">Secretária do Dr. Mauro · {hora}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {modoAusente.ativo && (
              <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                AUSENTE
              </span>
            )}
            <button onClick={sair} className="text-white/40 hover:text-white/70 p-2">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Conteúdo ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-24">

        {/* ══ ABA HOME ══════════════════════════════════════════ */}
        {aba === 'home' && (
          <div className="px-4 pt-5 space-y-4">

            {/* Status card principal */}
            <div className={`rounded-3xl p-6 shadow-xl text-white relative overflow-hidden ${
              modoAusente.ativo
                ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                : 'bg-gradient-to-br from-green-500 to-emerald-600'
            }`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
              <p className="text-4xl mb-3">
                {modoAusente.ativo ? motivoAtual?.emoji || '🛡️' : '✅'}
              </p>
              <h2 className="text-2xl font-bold">
                {modoAusente.ativo
                  ? (motivoAtual?.label || 'Ausente')
                  : 'Presente'
                }
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {modoAusente.ativo
                  ? `MARA está respondendo por você${modoAusente.retorno ? ` · Retorno: ${modoAusente.retorno}` : ''}`
                  : 'Você está disponível · MARA apenas notifica'
                }
              </p>

              {/* Botão de ação rápida */}
              {modoAusente.ativo ? (
                <button
                  onClick={desativarAusente}
                  disabled={ativando}
                  className="mt-4 w-full bg-white text-orange-600 font-bold py-3.5 rounded-2xl text-sm active:scale-95 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {ativando ? (
                    <span className="animate-spin text-lg">⏳</span>
                  ) : (
                    <>👋 Estou de Volta — Desativar</>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setAba('ausente')}
                  className="mt-4 w-full bg-white text-green-700 font-bold py-3.5 rounded-2xl text-sm active:scale-95 transition"
                >
                  🛡️ Ativar Modo Ausente
                </button>
              )}
            </div>

            {/* Atalhos rápidos */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { emoji: '📋', label: 'Leads de Hoje',   action: () => setAba('leads'),    cor: 'bg-blue-500' },
                { emoji: '🚨', label: 'Ver Urgentes',    action: () => { setAba('comandos'); setTimeout(() => executarComando('/urgentes'), 200) }, cor: 'bg-red-500' },
                { emoji: '📊', label: 'Resumo do Dia',   action: () => { setAba('comandos'); setTimeout(() => executarComando('/resumo'), 200) },  cor: 'bg-purple-500' },
                { emoji: '⚙️', label: 'Status Sistema',  action: () => { setAba('comandos'); setTimeout(() => executarComando('/status'), 200) },  cor: 'bg-gray-600' },
              ].map(b => (
                <button
                  key={b.label}
                  onClick={b.action}
                  className={`${b.cor} text-white rounded-2xl p-4 text-left active:scale-95 transition shadow-lg`}
                >
                  <p className="text-2xl mb-1">{b.emoji}</p>
                  <p className="text-sm font-bold">{b.label}</p>
                </button>
              ))}
            </div>

            {/* Mini comandos */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-gray-400 mb-3">⚡ COMANDOS RÁPIDOS</p>
              <div className="flex flex-wrap gap-2">
                {['/leads', '/urgentes', '/resumo', '/status'].map(cmd => (
                  <button
                    key={cmd}
                    onClick={() => { setAba('comandos'); setTimeout(() => executarComando(cmd), 200) }}
                    className="bg-[#0f2044] text-white text-xs px-3 py-1.5 rounded-xl font-mono active:scale-95 transition"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>

            {/* Link para dashboard completo */}
            <a
              href="https://ben-growth-center.vercel.app/mara-ia"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-95 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0f2044] rounded-xl flex items-center justify-center text-lg">🖥️</div>
                <div>
                  <p className="text-sm font-bold text-[#0f2044]">Dashboard Completo</p>
                  <p className="text-xs text-gray-400">Ben Growth Center · Web</p>
                </div>
              </div>
              <span className="text-gray-300">›</span>
            </a>
          </div>
        )}

        {/* ══ ABA MODO AUSENTE ══════════════════════════════════ */}
        {aba === 'ausente' && (
          <div className="px-4 pt-5 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[#0f2044]">🛡️ Modo Ausente</h2>
              <p className="text-gray-500 text-sm">MARA responde por você automaticamente</p>
            </div>

            {/* Status atual */}
            {modoAusente.ativo && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-amber-700 font-bold text-sm">
                  {motivoAtual?.emoji} Modo ativo: {motivoAtual?.label || modoAusente.motivo}
                  {modoAusente.retorno && ` · Retorno: ${modoAusente.retorno}`}
                </p>
                <button
                  onClick={desativarAusente}
                  disabled={ativando}
                  className="mt-3 w-full bg-green-500 text-white font-bold py-3 rounded-xl text-sm active:scale-95 transition disabled:opacity-60"
                >
                  {ativando ? '⏳ Desativando...' : '✅ Estou de Volta — Desativar'}
                </button>
              </div>
            )}

            {/* Seleção de motivo */}
            <p className="text-xs font-bold text-gray-400">SELECIONE O MOTIVO:</p>
            <div className="grid grid-cols-2 gap-3">
              {MOTIVOS.map(m => (
                <button
                  key={m.key}
                  onClick={() => setMotivoSelecionado(m.key)}
                  className={`relative p-4 rounded-2xl border-2 text-left transition active:scale-95 ${
                    motivoSelecionado === m.key
                      ? 'border-[#0f2044] bg-[#0f2044]/5'
                      : 'border-gray-100 bg-white'
                  }`}
                >
                  {motivoSelecionado === m.key && (
                    <span className="absolute top-2 right-2 text-[#D4A017] text-lg">✦</span>
                  )}
                  <p className="text-2xl mb-1">{m.emoji}</p>
                  <p className="font-bold text-sm text-[#0f2044]">{m.label}</p>
                </button>
              ))}
            </div>

            {/* Data de retorno */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                📅 Previsão de retorno (opcional)
              </label>
              <input
                type="text"
                value={retornoInput}
                onChange={e => setRetornoInput(e.target.value)}
                placeholder="Ex: 15/03, amanhã, 14h..."
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D4A017]"
              />
            </div>

            {/* Preview */}
            <div className="bg-[#0f2044]/5 border border-[#0f2044]/10 rounded-2xl p-4">
              <p className="text-xs font-bold text-[#0f2044] mb-2">👁️ MARA responderá assim:</p>
              <p className="text-sm text-gray-600 italic">
                {motivoSelecionado === 'ferias'       && `"Olá! O Dr. Mauro está em férias${retornoInput ? ` e retorna dia ${retornoInput}` : ''}. Posso anotar seu recado?"`}
                {motivoSelecionado === 'doente'       && `"Olá! O Dr. Mauro está indisposto${retornoInput ? ` e retorna ${retornoInput}` : ' e retorna em breve'}. Posso ajudar?"`}
                {motivoSelecionado === 'audiencia'    && `"Olá! O Dr. Mauro está em audiência${retornoInput ? ` até ${retornoInput}` : ' e retorna em breve'}. Posso anotar?"`}
                {motivoSelecionado === 'viagem'       && `"Olá! O Dr. Mauro está em viagem${retornoInput ? ` e retorna dia ${retornoInput}` : ''}. Para urgências: (86) 9482-0054."`}
                {motivoSelecionado === 'reuniao'      && `"Olá! O Dr. Mauro está em reunião${retornoInput ? ` até ${retornoInput}` : ''}. Posso anotar seu recado?"`}
                {motivoSelecionado === 'fora_horario' && `"Olá! Nosso atendimento é seg-sex 8h-18h. Deixe sua mensagem e retornaremos no próximo dia útil."`}
              </p>
            </div>

            {/* Botão ativar */}
            <button
              onClick={ativarAusente}
              disabled={ativando}
              className={`w-full py-4 rounded-2xl font-bold text-white text-base shadow-xl active:scale-95 transition disabled:opacity-60 bg-gradient-to-r ${
                MOTIVOS.find(m => m.key === motivoSelecionado)?.cor || 'from-amber-400 to-orange-500'
              }`}
            >
              {ativando
                ? '⏳ Ativando...'
                : `🛡️ Ativar — ${MOTIVOS.find(m => m.key === motivoSelecionado)?.label}`
              }
            </button>
          </div>
        )}

        {/* ══ ABA LEADS ═════════════════════════════════════════ */}
        {aba === 'leads' && (
          <div className="px-4 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0f2044]">📋 Leads</h2>
                <p className="text-gray-500 text-sm">{leads.length} no CRM</p>
              </div>
              <button
                onClick={carregarLeads}
                className="bg-[#0f2044] text-white text-xs px-3 py-2 rounded-xl active:scale-95 transition"
              >
                🔄 Atualizar
              </button>
            </div>

            {leadsCarregando ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="text-4xl animate-spin mb-3">⏳</div>
                  <p className="text-gray-400 text-sm">Carregando leads...</p>
                </div>
              </div>
            ) : leads.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-gray-400 text-sm">Nenhum lead ainda</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {leads.map((lead, i) => {
                  const urgCor = URGENCIA_COR[lead.urgencia || 'medium'] || '#eab308'
                  const hoje = new Date().toISOString().split('T')[0]
                  const isHoje = (lead.createdAt || lead.created_at || '').startsWith(hoje)
                  const numLimpo = (lead.numero || lead.telefone || '').replace(/\D/g, '')
                  return (
                    <div
                      key={i}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                      style={{ borderLeftWidth: 4, borderLeftColor: urgCor }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#0f2044] truncate">{lead.nome || 'Sem nome'}</p>
                          <p className="text-xs text-gray-400">{AREA_LABEL[lead.area || 'outros']}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                          <span className="text-xs font-bold" style={{ color: urgCor }}>
                            {URGENCIA_LABEL[lead.urgencia || 'medium']}
                          </span>
                          {isHoje && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Hoje</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500 flex-1 truncate">
                          📞 {lead.telefone || lead.numero || '—'}
                        </p>
                        {numLimpo && (
                          <a
                            href={`https://wa.me/${numLimpo}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-xl font-bold shrink-0 active:scale-95 transition"
                          >
                            💬 WhatsApp
                          </a>
                        )}
                      </div>

                      {lead.resumo && (
                        <p className="text-xs text-gray-400 mt-2 line-clamp-2">{lead.resumo}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ ABA COMANDOS ══════════════════════════════════════ */}
        {aba === 'comandos' && (
          <div className="px-4 pt-5 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[#0f2044]">⚡ Comandos MARA</h2>
              <p className="text-gray-500 text-sm">Consultas rápidas ao sistema</p>
            </div>

            {/* Botões de comandos */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { cmd: '/leads',    emoji: '📋', label: 'Leads Hoje',    cor: 'bg-blue-500' },
                { cmd: '/urgentes', emoji: '🚨', label: 'Urgentes',      cor: 'bg-red-500' },
                { cmd: '/resumo',   emoji: '📊', label: 'Resumo do Dia', cor: 'bg-purple-500' },
                { cmd: '/status',   emoji: '⚙️', label: 'Status',        cor: 'bg-gray-600' },
              ].map(c => (
                <button
                  key={c.cmd}
                  onClick={() => executarComando(c.cmd)}
                  disabled={comandoCarregando}
                  className={`${c.cor} text-white rounded-2xl p-4 text-left active:scale-95 transition disabled:opacity-60 shadow-lg`}
                >
                  <p className="text-2xl mb-1">{c.emoji}</p>
                  <p className="text-sm font-bold">{c.label}</p>
                  <p className="text-white/60 text-xs font-mono">{c.cmd}</p>
                </button>
              ))}
            </div>

            {/* Resposta */}
            {comandoCarregando && (
              <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                <div className="text-3xl animate-spin mb-2">⏳</div>
                <p className="text-gray-400 text-sm">Consultando MARA...</p>
              </div>
            )}

            {comandoResposta && !comandoCarregando && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <img
                    src={MARA_AVATAR}
                    alt="MARA"
                    className="w-8 h-8 rounded-xl border border-[#D4A017] object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=MARA&background=D4A017&color=0f2044&size=64&bold=true' }}
                  />
                  <p className="text-xs font-bold text-[#D4A017]">MARA IA respondeu:</p>
                </div>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {comandoResposta}
                </pre>
              </div>
            )}

            {/* Info sobre modo ausente via WA */}
            <div className="bg-[#0f2044]/5 rounded-2xl p-4 border border-[#0f2044]/10">
              <p className="text-xs font-bold text-[#0f2044] mb-2">📱 Também via WhatsApp:</p>
              <div className="space-y-1">
                {[
                  { cmd: '/ausente ferias 15/03', desc: 'Férias até 15/03' },
                  { cmd: '/ausente doente',        desc: 'Indisposto' },
                  { cmd: '/presente',              desc: 'Desativar modo ausente' },
                ].map(c => (
                  <div key={c.cmd} className="flex items-center gap-2">
                    <code className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-lg text-[#0f2044]">
                      {c.cmd}
                    </code>
                    <span className="text-xs text-gray-400">{c.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Bottom Navigation ────────────────────────────────── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-2 pb-2 pt-2 z-40 shadow-xl">
        <div className="grid grid-cols-4 gap-1">
          {([
            { tab: 'home',     emoji: '🏠', label: 'Início' },
            { tab: 'ausente',  emoji: '🛡️', label: 'Ausente' },
            { tab: 'leads',    emoji: '📋', label: 'Leads' },
            { tab: 'comandos', emoji: '⚡', label: 'MARA' },
          ] as { tab: Tab; emoji: string; label: string }[]).map(t => (
            <button
              key={t.tab}
              onClick={() => setAba(t.tab)}
              className={`flex flex-col items-center justify-center py-2 rounded-xl transition active:scale-95 ${
                aba === t.tab
                  ? 'bg-[#0f2044] text-white'
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg leading-none">{t.emoji}</span>
              <span className="text-[10px] font-semibold mt-0.5">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
