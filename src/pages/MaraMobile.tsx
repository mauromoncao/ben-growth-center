// ============================================================
// MARA IA — APP MOBILE (PWA)
// Interface ultra-simplificada para celular do Dr. Mauro
// Acesso via PIN · Banner de instalação automático Android
// URL: /mara-app
// ============================================================
import React, { useState, useEffect, useCallback, useRef } from 'react'

// ─── PIN de acesso rápido ────────────────────────────────────
const PIN_CORRETO  = import.meta.env.VITE_MARA_PIN || '1234'
const PIN_STORAGE  = 'mara_mobile_pin_ok'
const INST_STORAGE = 'mara_pwa_installed'

// ─── Avatar ──────────────────────────────────────────────────
// Usa foto real da MARA IA gerada (fallback para ícone gerado)
const MARA_AVATAR = '/mara-avatar-circle.png'
const MARA_AVATAR_HEADER = '/mara-avatar-circle.png'

// ─── Tipos ───────────────────────────────────────────────────
interface Lead {
  id?: string; nome?: string; telefone?: string; numero?: string
  area?: string; urgencia?: string; createdAt?: string
  created_at?: string; resumo?: string
}
interface ModoAusenteState {
  ativo: boolean; motivo: string | null; retorno: string | null
}
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const MOTIVOS = [
  { key: 'ferias',       emoji: '🏖️', label: 'Férias',          cor: 'from-blue-500 to-cyan-500'   },
  { key: 'doente',       emoji: '🤒', label: 'Indisposto',      cor: 'from-rose-500 to-pink-500'   },
  { key: 'audiencia',    emoji: '⚖️', label: 'Audiência',       cor: 'from-purple-500 to-violet-500'},
  { key: 'viagem',       emoji: '✈️', label: 'Viagem',          cor: 'from-sky-500 to-blue-500'    },
  { key: 'reuniao',      emoji: '🤝', label: 'Reunião',         cor: 'from-amber-500 to-orange-500' },
  { key: 'fora_horario', emoji: '😴', label: 'Fora do Horário', cor: 'from-gray-500 to-slate-600'  },
]

const URGENCIA_COR:   Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' }
const URGENCIA_LABEL: Record<string, string> = { critical: '🚨 CRÍTICO', high: '🔴 ALTO', medium: '🟡 MÉDIO', low: '🟢 BAIXO' }
const AREA_LABEL:     Record<string, string> = {
  tributario: '🧾 Tributário', previdenciario: '👴 Previdenciário',
  bancario: '🏦 Bancário',     trabalhista: '👷 Trabalhista',
  imobiliario: '🏠 Imobiliário', familia: '👨‍👩‍👧 Família',
  publico: '⚖️ Adv. Pública',  consumidor: '🛒 Consumidor', outros: '📋 Outros',
}

// ══════════════════════════════════════════════════════════════
// BANNER DE INSTALAÇÃO ANDROID
// ══════════════════════════════════════════════════════════════
function BannerInstalacao({ onInstalar, onFechar, textoBtn = '⬇️ Instalar Agora' }: {
  onInstalar: () => void; onFechar: () => void; textoBtn?: string
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-3 animate-slide-up">
      <div className="bg-gradient-to-r from-[#0f2044] to-[#1a3a6e] rounded-2xl p-4 shadow-2xl border border-[#D4A017]/40 mx-auto max-w-md">
        <div className="flex items-center gap-3 mb-3">
          <img src={MARA_AVATAR} alt="MARA" className="w-14 h-14 rounded-2xl border-2 border-[#D4A017] object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base">📲 Instalar MARA IA</p>
            <p className="text-white/70 text-xs mt-0.5">
              Adicione à sua tela inicial — acesse em 1 toque, sem abrir o navegador
            </p>
          </div>
          <button onClick={onFechar} className="text-white/40 hover:text-white/70 shrink-0 text-xl leading-none p-1">×</button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onInstalar}
            className="flex-1 bg-[#D4A017] text-white font-bold py-3 rounded-xl text-sm active:scale-95 transition"
          >
            {textoBtn}
          </button>
          <button
            onClick={onFechar}
            className="px-4 bg-white/10 text-white/70 rounded-xl text-sm active:scale-95 transition"
          >
            Depois
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// GUIA DE INSTALAÇÃO ANDROID (Chrome)
// ══════════════════════════════════════════════════════════════
function GuiaAndroid({ onFechar }: { onFechar: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-end justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md mb-2 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src={MARA_AVATAR} alt="MARA" className="w-12 h-12 rounded-2xl border-2 border-[#D4A017] object-cover" />
            <div>
              <p className="font-bold text-[#0f2044]">Instalar MARA IA</p>
              <p className="text-xs text-gray-400">Android (Chrome)</p>
            </div>
          </div>
          <button onClick={onFechar} className="text-gray-400 text-2xl leading-none p-1">×</button>
        </div>

        <div className="space-y-3">
          {[
            { n: 1, icon: '⋮', txt: 'Toque no menu do Chrome', sub: 'Três pontos no canto superior direito da tela', color: '#0f2044' },
            { n: 2, icon: '➕', txt: 'Toque em "Adicionar à tela inicial"', sub: 'Role a lista de opções para encontrar esta opção', color: '#0f2044' },
            { n: 3, icon: '✅', txt: 'Confirme tocando em "Adicionar"', sub: 'O ícone da MARA aparece na sua tela inicial', color: '#22c55e' },
          ].map(s => (
            <div key={s.n} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md"
                style={{ background: s.color }}>
                {s.n}
              </div>
              <div>
                <p className="font-semibold text-sm text-[#0f2044]">{s.icon} {s.txt}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-200">
          <p className="text-xs text-green-700 font-medium">
            ✅ Após instalar, o app MARA IA aparece na sua tela inicial como um app nativo, sem precisar abrir o Chrome!
          </p>
        </div>

        <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-xs text-blue-700 font-medium">
            💡 <strong>Dica:</strong> Se não aparecer "Adicionar à tela inicial", tente: Menu → "Instalar aplicativo" ou "Adicionar atalho".
          </p>
        </div>

        <button
          onClick={onFechar}
          className="mt-4 w-full bg-[#0f2044] text-white font-bold py-3 rounded-xl text-sm active:scale-95"
        >
          Entendi, vou instalar!
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// GUIA DE INSTALAÇÃO iOS (Safari)
// ══════════════════════════════════════════════════════════════
function GuiaIOS({ onFechar }: { onFechar: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-end justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md mb-2 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src={MARA_AVATAR} alt="MARA" className="w-12 h-12 rounded-2xl border-2 border-[#D4A017] object-cover" />
            <div>
              <p className="font-bold text-[#0f2044]">Instalar MARA IA</p>
              <p className="text-xs text-gray-400">iPhone / iPad (Safari)</p>
            </div>
          </div>
          <button onClick={onFechar} className="text-gray-400 text-2xl leading-none p-1">×</button>
        </div>

        <div className="space-y-3">
          {[
            { n: 1, icon: '⬆️', txt: 'Toque no botão compartilhar', sub: 'Ícone de seta na barra inferior do Safari' },
            { n: 2, icon: '➕', txt: 'Toque em "Adicionar à Tela de Início"', sub: 'Role a lista de opções para baixo' },
            { n: 3, icon: '✅', txt: 'Toque em "Adicionar"', sub: 'O ícone da MARA aparece na sua tela inicial' },
          ].map(s => (
            <div key={s.n} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#0f2044] rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">
                {s.n}
              </div>
              <div>
                <p className="font-semibold text-sm text-[#0f2044]">{s.icon} {s.txt}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-xs text-amber-700 font-medium">
            ⚠️ Apenas funciona no <strong>Safari</strong>. Se estiver no Chrome, copie a URL e abra no Safari.
          </p>
        </div>

        <button
          onClick={onFechar}
          className="mt-4 w-full bg-[#0f2044] text-white font-bold py-3 rounded-xl text-sm active:scale-95"
        >
          Entendi, vou instalar!
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TELA DE PIN
// ══════════════════════════════════════════════════════════════
function PinScreen({ onSuccess, onMostrarInstall }: {
  onSuccess: () => void
  onMostrarInstall: () => void
}) {
  const [pin, setPin]     = useState('')
  const [erro, setErro]   = useState(false)
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
        setErro(true); setShake(true)
        setTimeout(() => { setPin(''); setErro(false); setShake(false) }, 900)
      }
    }
  }
  const apagar = () => setPin(p => p.slice(0, -1))

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2044] via-[#1a3a6e] to-[#0f2044] flex flex-col items-center justify-between px-6 py-10">
      <div /> {/* spacer */}

      {/* Avatar + nome */}
      <div className="text-center">
        <div className="relative inline-block mb-6">
          <div className="w-28 h-28 rounded-3xl border-4 border-[#D4A017] shadow-2xl overflow-hidden mx-auto bg-[#0f2044]">
            <img
              src={MARA_AVATAR}
              alt="MARA IA"
              className="w-full h-full object-cover"
              onError={e => {
                (e.target as HTMLImageElement).src =
                  'https://ui-avatars.com/api/?name=MARA+IA&background=D4A017&color=ffffff&size=256&bold=true'
              }}
            />
          </div>
          <span className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold border-2 border-[#0f2044] animate-pulse">
            ON
          </span>
        </div>

        <h1 className="text-white text-3xl font-bold tracking-tight">MARA IA</h1>
        <p className="text-[#D4A017] text-sm font-medium mt-1">Secretária Executiva · Dr. Mauro Monção</p>

        {/* Dots do PIN */}
        <div className={`flex justify-center gap-5 mt-10 mb-4 ${shake ? 'animate-bounce' : ''}`}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
              i < pin.length
                ? erro ? 'bg-red-400 border-red-400 scale-110' : 'bg-[#D4A017] border-[#D4A017] scale-110'
                : 'border-white/30 bg-transparent'
            }`} />
          ))}
        </div>

        <p className="text-white/50 text-sm mb-8">
          {erro ? '❌ PIN incorreto' : pin.length === 0 ? 'Digite seu PIN' : '···'}
        </p>

        {/* Teclado numérico */}
        <div className="grid grid-cols-3 gap-3 w-72 mx-auto">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
            <button
              key={i}
              onClick={() => d === '⌫' ? apagar() : d !== '' ? digitar(d) : undefined}
              disabled={d === ''}
              className={`h-16 rounded-2xl text-white text-2xl font-semibold transition-all active:scale-90 ${
                d === ''
                  ? 'invisible'
                  : d === '⌫'
                  ? 'bg-white/10 border border-white/20 hover:bg-white/20'
                  : 'bg-white/10 border border-white/20 hover:bg-[#D4A017]/40 hover:border-[#D4A017]/60'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Rodapé */}
      <div className="text-center space-y-3">
        <button
          onClick={onMostrarInstall}
          className="flex items-center gap-2 mx-auto text-white/40 hover:text-white/70 text-xs transition"
        >
          <span>📲</span> Instalar como app no celular
        </button>
        <p className="text-white/20 text-xs">Ben Growth Center · Mauro Monção Advogados</p>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════════════
type Tab = 'home' | 'ausente' | 'leads' | 'comandos'

export default function MaraMobile() {
  const [autenticado, setAutenticado]   = useState(false)
  const [aba, setAba]                   = useState<Tab>('home')
  const [modoAusente, setModoAusente]   = useState<ModoAusenteState>({ ativo: false, motivo: null, retorno: null })
  const [carregando, setCarregando]     = useState(true)
  const [ativando, setAtivando]         = useState(false)
  const [motivoSel, setMotivoSel]       = useState('ferias')
  const [retornoInput, setRetornoInput] = useState('')
  const [leads, setLeads]               = useState<Lead[]>([])
  const [leadsLoad, setLeadsLoad]       = useState(false)
  const [hora, setHora]                 = useState('')
  const [cmdResp, setCmdResp]           = useState('')
  const [cmdLoad, setCmdLoad]           = useState(false)
  const [feedback, setFeedback]         = useState('')

  // PWA install
  const [installEvt, setInstallEvt]     = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner]     = useState(false)
  const [showGuiaIOS, setShowGuiaIOS]   = useState(false)
  const [isInstalled, setIsInstalled]   = useState(false)
  const [isIOS, setIsIOS]               = useState(false)
  const [isAndroid, setIsAndroid]       = useState(false)
  const [showGuiaAndroid, setShowGuiaAndroid] = useState(false)

  // ── Detectar plataforma e evento de instalação ────────────
  useEffect(() => {
    // Verificar se já está instalado
    const jaInstalado =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      sessionStorage.getItem(INST_STORAGE) === '1'

    setIsInstalled(jaInstalado)

    // Detectar plataformas
    const ua = navigator.userAgent
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
    const android = /Android/.test(ua)
    setIsIOS(ios)
    setIsAndroid(android)

    // Capturar evento BeforeInstallPrompt (Android Chrome automático)
    const handler = (e: Event) => {
      e.preventDefault()
      const evt = e as BeforeInstallPromptEvent
      setInstallEvt(evt)
      // Mostrar banner após 2 segundos se não instalado
      if (!jaInstalado) setTimeout(() => setShowBanner(true), 2000)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Detectar quando foi instalado
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowBanner(false)
      sessionStorage.setItem(INST_STORAGE, '1')
      mostrarFeedback('✅ MARA IA instalada! Abra pela tela inicial')
    })

    // Para Android sem beforeinstallprompt, mostrar guia manual após 3s
    if (android && !jaInstalado) {
      setTimeout(() => {
        if (!installEvt) setShowBanner(true)
      }, 3000)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const instalarPWA = async () => {
    if (installEvt) {
      await installEvt.prompt()
      const { outcome } = await installEvt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
        setShowBanner(false)
        sessionStorage.setItem(INST_STORAGE, '1')
        mostrarFeedback('✅ App instalado! Abra pela tela inicial')
      }
    } else if (isIOS) {
      setShowGuiaIOS(true)
      setShowBanner(false)
    } else if (isAndroid) {
      setShowGuiaAndroid(true)
      setShowBanner(false)
    }
  }

  const mostrarBotaoInstall = () => {
    if (installEvt) {
      setShowBanner(true)
    } else if (isIOS) {
      setShowGuiaIOS(true)
    } else if (isAndroid) {
      setShowGuiaAndroid(true)
    } else {
      setShowGuiaAndroid(true) // Desktop fallback
    }
  }

  // ── PIN ────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionStorage.getItem(PIN_STORAGE) === '1') setAutenticado(true)
  }, [])

  // ── Hora ──────────────────────────────────────────────────
  useEffect(() => {
    const upd = () => setHora(new Date().toLocaleTimeString('pt-BR', {
      timeZone: 'America/Fortaleza', hour: '2-digit', minute: '2-digit'
    }))
    upd()
    const id = setInterval(upd, 10000)
    return () => clearInterval(id)
  }, [])

  // ── Carregar status ────────────────────────────────────────
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

  // ── Leads ──────────────────────────────────────────────────
  const carregarLeads = useCallback(async () => {
    setLeadsLoad(true)
    try {
      const d = await fetch('/api/leads').then(r => r.json())
      const lista: Lead[] = d?.leads || d || []
      lista.sort((a, b) => {
        const da = new Date(a.createdAt || a.created_at || 0).getTime()
        const db = new Date(b.createdAt || b.created_at || 0).getTime()
        return db - da
      })
      setLeads(lista.slice(0, 20))
    } catch { setLeads([]) }
    setLeadsLoad(false)
  }, [])

  useEffect(() => { if (aba === 'leads') carregarLeads() }, [aba, carregarLeads])

  // ── Modo Ausente ───────────────────────────────────────────
  const ativarAusente = async () => {
    setAtivando(true)
    try {
      const p = new URLSearchParams({ action: 'ativar-ausente', motivo: motivoSel })
      if (retornoInput.trim()) p.set('retorno', retornoInput.trim())
      const d = await fetch(`/api/whatsapp-zapi?${p}`).then(r => r.json())
      if (d.ok) {
        setModoAusente({ ativo: true, motivo: motivoSel, retorno: retornoInput || null })
        mostrarFeedback('🛡️ Modo Ausente ativado!')
        setAba('home')
      }
    } catch {}
    setAtivando(false)
  }

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

  // ── Comandos ───────────────────────────────────────────────
  const executarComando = useCallback(async (cmd: string) => {
    setCmdLoad(true); setCmdResp('')
    try {
      if (cmd === '/leads') {
        const d = await fetch('/api/leads').then(r => r.json())
        const lista: Lead[] = d?.leads || d || []
        const hoje = new Date().toISOString().split('T')[0]
        const leadsHoje = lista.filter(l => (l.createdAt || l.created_at || '').startsWith(hoje))
        if (!leadsHoje.length) { setCmdResp('📋 Nenhum lead hoje ainda.\nDr. Ben está de plantão! 💪'); return }
        const linhas = leadsHoje.slice(0, 5).map((l, i) =>
          `${i+1}. ${l.nome || 'Sem nome'}\n   ${URGENCIA_LABEL[l.urgencia||'medium']} · ${AREA_LABEL[l.area||'outros']}\n   📞 ${l.telefone||l.numero||'—'}`
        )
        setCmdResp(`📋 Leads hoje (${leadsHoje.length}):\n\n${linhas.join('\n\n')}`)
      } else if (cmd === '/urgentes') {
        const d = await fetch('/api/leads').then(r => r.json())
        const lista: Lead[] = d?.leads || d || []
        const urg = lista.filter(l => l.urgencia === 'high' || l.urgencia === 'critical')
        if (!urg.length) { setCmdResp('🟢 Nenhum caso urgente!\nTudo tranquilo. 😌'); return }
        const linhas = urg.slice(0, 5).map((l, i) =>
          `${i+1}. 🚨 ${l.nome || 'Sem nome'}\n   📞 ${l.telefone||l.numero||'—'}\n   ⚖️ ${AREA_LABEL[l.area||'outros']}`
        )
        setCmdResp(`🚨 Urgentes (${urg.length}):\n\n${linhas.join('\n\n')}`)
      } else if (cmd === '/resumo') {
        const d = await fetch('/api/leads').then(r => r.json())
        const lista: Lead[] = d?.leads || d || []
        const hoje = new Date().toISOString().split('T')[0]
        const leadsHoje = lista.filter(l => (l.createdAt||l.created_at||'').startsWith(hoje))
        const urg = lista.filter(l => l.urgencia==='high'||l.urgencia==='critical')
        const aus = modoAusente.ativo ? `🔴 ${modoAusente.motivo}` : '🟢 Presente'
        setCmdResp(`📊 Resumo — ${hora}\n\n👥 Leads hoje: ${leadsHoje.length}\n🚨 Urgentes: ${urg.length}\n📦 Total CRM: ${lista.length}\n🤖 Dr. Ben: Operacional\n🛡️ Status: ${aus}`)
      } else if (cmd === '/status') {
        const d = await fetch('/api/whatsapp-zapi').then(r => r.json())
        const aus = modoAusente.ativo ? `🔴 Ausente (${modoAusente.motivo})` : '🟢 Presente'
        setCmdResp(`⚙️ Status:\n\n📱 Z-API: ${d.zapi||'—'}\n🎙️ TTS: ${d.elevenlabs||'—'}\n🛡️ MARA: ${aus}\n🕐 Hora: ${hora} (Fortaleza)`)
      }
    } catch { setCmdResp('⚠️ Erro ao buscar dados.\nTente novamente.') }
    setCmdLoad(false)
  }, [modoAusente, hora])

  useEffect(() => {
    if (aba === 'comandos' && !cmdResp) executarComando('/resumo')
  }, [aba])

  const mostrarFeedback = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(''), 2500)
  }

  const sair = () => { sessionStorage.removeItem(PIN_STORAGE); setAutenticado(false) }

  // ── Render PIN ─────────────────────────────────────────────
  if (!autenticado) {
    return (
      <>
        <PinScreen onSuccess={() => setAutenticado(true)} onMostrarInstall={mostrarBotaoInstall} />
        {showBanner && (
          <BannerInstalacao
            onInstalar={instalarPWA}
            onFechar={() => setShowBanner(false)}
            textoBtn={installEvt ? '⬇️ Instalar Agora' : '📲 Ver Como Instalar'}
          />
        )}
        {showGuiaIOS && <GuiaIOS onFechar={() => setShowGuiaIOS(false)} />}
        {showGuiaAndroid && <GuiaAndroid onFechar={() => setShowGuiaAndroid(false)} />}
      </>
    )
  }

  const motivoAtual = MOTIVOS.find(m => m.key === modoAusente.motivo)

  // ── Render App ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative select-none">

      {/* Overlays */}
      {showBanner && (
        <BannerInstalacao
          onInstalar={instalarPWA}
          onFechar={() => setShowBanner(false)}
          textoBtn={installEvt ? '⬇️ Instalar Agora' : '📲 Ver Como Instalar'}
        />
      )}
      {showGuiaIOS && <GuiaIOS onFechar={() => setShowGuiaIOS(false)} />}
      {showGuiaAndroid && <GuiaAndroid onFechar={() => setShowGuiaAndroid(false)} />}

      {/* Toast feedback */}
      {feedback && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#0f2044] text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold max-w-xs text-center animate-bounce">
          {feedback}
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#0f2044] to-[#1a3a6e] px-5 pt-12 pb-4 sticky top-0 z-40 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl border-2 border-[#D4A017] overflow-hidden bg-[#0f2044]">
                <img src={MARA_AVATAR_HEADER} alt="MARA"
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=M&background=D4A017&color=fff&size=128&bold=true' }}
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f2044]" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">MARA IA</p>
              <p className="text-[#D4A017] text-xs">{hora} · Fortaleza</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {modoAusente.ativo && (
              <span className="bg-amber-500 text-white text-xs px-2.5 py-1 rounded-full font-bold animate-pulse">
                AUSENTE
              </span>
            )}
            {/* Botão instalar (se não instalado) */}
            {!isInstalled && (
              <button onClick={mostrarBotaoInstall}
                className="text-[#D4A017] text-xs border border-[#D4A017]/40 px-2.5 py-1 rounded-full hover:bg-[#D4A017]/10 transition">
                📲
              </button>
            )}
            <button onClick={sair} className="text-white/30 hover:text-white/60 p-1.5">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTEÚDO ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-24">

        {/* ══ HOME ══════════════════════════════════════════ */}
        {aba === 'home' && (
          <div className="px-4 pt-5 space-y-4">

            {/* Card de status principal */}
            <div className={`rounded-3xl p-6 shadow-xl text-white relative overflow-hidden ${
              modoAusente.ativo
                ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                : 'bg-gradient-to-br from-[#0f2044] to-[#1a3a6e]'
            }`}>
              <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -translate-y-18 translate-x-18 pointer-events-none" />

              <div className="flex items-start gap-4">
                <div className="text-5xl shrink-0">
                  {modoAusente.ativo ? (motivoAtual?.emoji || '🛡️') : '✅'}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold">
                    {modoAusente.ativo ? (motivoAtual?.label || 'Ausente') : 'Presente'}
                  </h2>
                  <p className="text-white/80 text-sm mt-1 leading-snug">
                    {modoAusente.ativo
                      ? `MARA respondendo por você${modoAusente.retorno ? ` · Retorno: ${modoAusente.retorno}` : ''}`
                      : 'Você está disponível · MARA notifica os leads'
                    }
                  </p>
                </div>
              </div>

              {modoAusente.ativo ? (
                <button onClick={desativarAusente} disabled={ativando}
                  className="mt-4 w-full bg-white text-orange-600 font-bold py-3.5 rounded-2xl text-sm active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2">
                  {ativando ? <span className="animate-spin">⏳</span> : '👋 Estou de Volta — Desativar'}
                </button>
              ) : (
                <button onClick={() => setAba('ausente')}
                  className="mt-4 w-full bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold py-3.5 rounded-2xl text-sm active:scale-95 transition-all">
                  🛡️ Ativar Modo Ausente
                </button>
              )}
            </div>

            {/* Banner instalação manual se não instalado */}
            {!isInstalled && (
              <button onClick={mostrarBotaoInstall}
                className="w-full flex items-center gap-3 bg-gradient-to-r from-[#0f2044] to-[#1a3a6e] text-white rounded-2xl p-4 active:scale-95 transition-transform shadow-lg border border-[#D4A017]/30">
                <span className="text-2xl">📲</span>
                <div className="text-left">
                  <p className="font-bold text-sm">Instalar MARA IA como App</p>
                  <p className="text-white/60 text-xs">
                    {isIOS ? 'Safari → Compartilhar → Adicionar à Tela' : 'Chrome → Menu ⋮ → Adicionar à tela inicial'}
                  </p>
                </div>
                <span className="text-[#D4A017] ml-auto">›</span>
              </button>
            )}

            {/* Atalhos */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { emoji: '📋', label: 'Leads',        sub: 'Ver todos',        action: () => setAba('leads'),    bg: 'bg-blue-600' },
                { emoji: '🚨', label: 'Urgentes',     sub: 'Casos críticos',   action: () => { setAba('comandos'); setTimeout(() => executarComando('/urgentes'), 100) }, bg: 'bg-red-600' },
                { emoji: '📊', label: 'Resumo',       sub: 'Relatório do dia', action: () => { setAba('comandos'); setTimeout(() => executarComando('/resumo'), 100) }, bg: 'bg-purple-600' },
                { emoji: '⚙️', label: 'Status',       sub: 'Sistemas',         action: () => { setAba('comandos'); setTimeout(() => executarComando('/status'), 100) }, bg: 'bg-gray-700' },
              ].map(b => (
                <button key={b.label} onClick={b.action}
                  className={`${b.bg} text-white rounded-2xl p-4 text-left active:scale-95 transition-transform shadow-md`}>
                  <p className="text-3xl mb-2">{b.emoji}</p>
                  <p className="text-sm font-bold">{b.label}</p>
                  <p className="text-white/60 text-xs">{b.sub}</p>
                </button>
              ))}
            </div>

            {/* Link dashboard */}
            <a href="https://ben-growth-center.vercel.app/mara-ia" target="_blank" rel="noreferrer"
              className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-95 transition-transform">
              <div className="w-10 h-10 bg-[#0f2044] rounded-xl flex items-center justify-center text-xl shrink-0">🖥️</div>
              <div>
                <p className="text-sm font-bold text-[#0f2044]">Dashboard Completo</p>
                <p className="text-xs text-gray-400">Ben Growth Center · Configurações avançadas</p>
              </div>
              <span className="text-gray-300 ml-auto text-lg">›</span>
            </a>
          </div>
        )}

        {/* ══ MODO AUSENTE ══════════════════════════════════ */}
        {aba === 'ausente' && (
          <div className="px-4 pt-5 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[#0f2044]">🛡️ Modo Ausente</h2>
              <p className="text-gray-500 text-sm">MARA responde por você automaticamente</p>
            </div>

            {/* Status atual */}
            {modoAusente.ativo && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
                <p className="text-amber-700 font-bold">
                  {motivoAtual?.emoji} Ativo: {motivoAtual?.label || modoAusente.motivo}
                  {modoAusente.retorno && <span className="font-normal text-amber-600"> · Retorno: {modoAusente.retorno}</span>}
                </p>
                <button onClick={desativarAusente} disabled={ativando}
                  className="mt-3 w-full bg-green-500 text-white font-bold py-3 rounded-xl text-sm active:scale-95 transition-transform disabled:opacity-60">
                  {ativando ? '⏳ Desativando...' : '✅ Estou de Volta — Desativar'}
                </button>
              </div>
            )}

            {/* Seleção motivo */}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Selecione o motivo:</p>
            <div className="grid grid-cols-2 gap-3">
              {MOTIVOS.map(m => (
                <button key={m.key} onClick={() => setMotivoSel(m.key)}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                    motivoSel === m.key ? 'border-[#0f2044] bg-[#0f2044]/5 shadow-md' : 'border-gray-100 bg-white hover:border-gray-300'
                  }`}>
                  {motivoSel === m.key && (
                    <span className="absolute top-2.5 right-2.5 text-[#D4A017] font-bold text-lg">✦</span>
                  )}
                  <p className="text-3xl mb-2">{m.emoji}</p>
                  <p className="font-bold text-sm text-[#0f2044]">{m.label}</p>
                </button>
              ))}
            </div>

            {/* Retorno */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                📅 Previsão de retorno (opcional)
              </label>
              <input type="text" value={retornoInput} onChange={e => setRetornoInput(e.target.value)}
                placeholder="Ex: 15/03, amanhã, 14h..."
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D4A017] bg-white" />
            </div>

            {/* Preview */}
            <div className="bg-[#0f2044]/5 border border-[#0f2044]/15 rounded-2xl p-4">
              <p className="text-xs font-bold text-[#0f2044] mb-2 uppercase tracking-wide">👁️ MARA responderá assim:</p>
              <p className="text-sm text-gray-600 italic leading-relaxed">
                {motivoSel === 'ferias'       && `"Olá! O Dr. Mauro está em férias${retornoInput ? ` e retorna dia ${retornoInput}` : ''}. Posso anotar seu recado?"`}
                {motivoSel === 'doente'       && `"Olá! O Dr. Mauro está indisposto${retornoInput ? ` e retorna ${retornoInput}` : ' e retorna em breve'}. Posso ajudar?"`}
                {motivoSel === 'audiencia'    && `"Olá! O Dr. Mauro está em audiência${retornoInput ? ` até ${retornoInput}` : ' e retorna em breve'}. Posso anotar?"`}
                {motivoSel === 'viagem'       && `"Olá! O Dr. Mauro está em viagem${retornoInput ? ` e retorna dia ${retornoInput}` : ''}. Para urgências: (86) 9482-0054."`}
                {motivoSel === 'reuniao'      && `"Olá! O Dr. Mauro está em reunião${retornoInput ? ` até ${retornoInput}` : ''}. Posso anotar seu recado?"`}
                {motivoSel === 'fora_horario' && '"Olá! Nosso atendimento é seg-sex 8h-18h. Deixe sua mensagem e retornaremos no próximo dia útil."'}
              </p>
            </div>

            {/* Botão ativar */}
            <button onClick={ativarAusente} disabled={ativando}
              className={`w-full py-4 rounded-2xl font-bold text-white text-base shadow-xl active:scale-95 transition-all disabled:opacity-60 bg-gradient-to-r ${
                MOTIVOS.find(m => m.key === motivoSel)?.cor || 'from-amber-500 to-orange-500'
              }`}>
              {ativando ? '⏳ Ativando...' : `🛡️ Ativar — ${MOTIVOS.find(m => m.key === motivoSel)?.label}`}
            </button>
          </div>
        )}

        {/* ══ LEADS ═════════════════════════════════════════ */}
        {aba === 'leads' && (
          <div className="px-4 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0f2044]">📋 Leads do CRM</h2>
                <p className="text-gray-500 text-sm">{leads.length} registros</p>
              </div>
              <button onClick={carregarLeads}
                className="bg-[#0f2044] text-white text-xs px-4 py-2 rounded-xl active:scale-95 transition-transform font-semibold">
                🔄 Atualizar
              </button>
            </div>

            {leadsLoad ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="text-5xl animate-spin mb-4">⏳</div>
                  <p className="text-gray-400 text-sm">Carregando leads...</p>
                </div>
              </div>
            ) : leads.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <p className="text-5xl mb-4">📭</p>
                  <p className="text-gray-500 font-semibold">Nenhum lead ainda</p>
                  <p className="text-gray-400 text-sm mt-1">Dr. Ben está de plantão!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {leads.map((lead, i) => {
                  const hoje = new Date().toISOString().split('T')[0]
                  const isHoje = (lead.createdAt||lead.created_at||'').startsWith(hoje)
                  const numLimpo = (lead.numero||lead.telefone||'').replace(/\D/g,'')
                  const urgCor = URGENCIA_COR[lead.urgencia||'medium']
                  return (
                    <div key={i} className="bg-white rounded-2xl p-4 shadow-sm"
                      style={{ borderLeftWidth: 5, borderLeftColor: urgCor, borderLeftStyle: 'solid' }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#0f2044] truncate">{lead.nome || 'Sem nome'}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{AREA_LABEL[lead.area||'outros']}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                          <span className="text-xs font-bold" style={{ color: urgCor }}>
                            {URGENCIA_LABEL[lead.urgencia||'medium']}
                          </span>
                          {isHoje && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">HOJE</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500 flex-1 truncate">📞 {lead.telefone||lead.numero||'—'}</p>
                        {numLimpo && (
                          <a href={`https://wa.me/${numLimpo}`} target="_blank" rel="noreferrer"
                            className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-xl font-bold shrink-0 active:scale-95 transition-transform">
                            💬 WA
                          </a>
                        )}
                      </div>
                      {lead.resumo && (
                        <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">{lead.resumo}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ COMANDOS ══════════════════════════════════════ */}
        {aba === 'comandos' && (
          <div className="px-4 pt-5 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[#0f2044]">⚡ Central MARA</h2>
              <p className="text-gray-500 text-sm">Consultas e comandos em tempo real</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { cmd: '/leads',    emoji: '📋', label: 'Leads Hoje',    bg: 'bg-blue-600' },
                { cmd: '/urgentes', emoji: '🚨', label: 'Urgentes',      bg: 'bg-red-600' },
                { cmd: '/resumo',   emoji: '📊', label: 'Resumo do Dia', bg: 'bg-purple-600' },
                { cmd: '/status',   emoji: '⚙️', label: 'Status',        bg: 'bg-gray-700' },
              ].map(c => (
                <button key={c.cmd} onClick={() => executarComando(c.cmd)} disabled={cmdLoad}
                  className={`${c.bg} text-white rounded-2xl p-4 text-left active:scale-95 transition-transform disabled:opacity-60 shadow-md`}>
                  <p className="text-3xl mb-2">{c.emoji}</p>
                  <p className="text-sm font-bold">{c.label}</p>
                  <p className="text-white/60 text-[10px] font-mono">{c.cmd}</p>
                </button>
              ))}
            </div>

            {cmdLoad && (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                <div className="text-4xl animate-spin mb-3">⏳</div>
                <p className="text-gray-400 text-sm font-medium">MARA consultando...</p>
              </div>
            )}

            {cmdResp && !cmdLoad && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-xl border-2 border-[#D4A017] overflow-hidden bg-[#0f2044]">
                    <img src={MARA_AVATAR_HEADER} alt="MARA"
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=M&background=D4A017&color=fff&size=64&bold=true' }}
                    />
                  </div>
                  <p className="text-xs font-bold text-[#D4A017] uppercase tracking-wide">MARA IA</p>
                </div>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {cmdResp}
                </pre>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── BOTTOM NAV ─────────────────────────────────────── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 z-40 shadow-2xl">
        <div className="grid grid-cols-4 gap-1 px-2 py-2 pb-safe">
          {([
            { tab: 'home',     emoji: '🏠', label: 'Início'  },
            { tab: 'ausente',  emoji: '🛡️', label: 'Ausente' },
            { tab: 'leads',    emoji: '📋', label: 'Leads'   },
            { tab: 'comandos', emoji: '⚡', label: 'MARA'    },
          ] as { tab: Tab; emoji: string; label: string }[]).map(t => (
            <button key={t.tab} onClick={() => setAba(t.tab)}
              className={`flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all active:scale-90 ${
                aba === t.tab ? 'bg-[#0f2044] text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'
              }`}>
              <span className="text-xl leading-none mb-0.5">{t.emoji}</span>
              <span className="text-[10px] font-bold">{t.label}</span>
              {t.tab === 'ausente' && modoAusente.ativo && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
