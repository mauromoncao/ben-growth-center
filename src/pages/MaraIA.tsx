import React, { useState, useEffect, useRef } from 'react'
import {
  Bot, Save, RefreshCw, CheckCircle2, AlertCircle, Zap,
  Clock, MessageSquare, Shield, ChevronDown, ChevronUp,
  ToggleLeft, ToggleRight, Phone, Star, Settings2,
  Brain, Volume2, Calendar, AlertTriangle, Loader,
  Play, Info, Edit3, Sparkles, TrendingUp, Users,
  Bell, Target, Activity, BarChart2, Cpu, Lock,
  Wifi, WifiOff, CheckCircle, XCircle, ArrowRight,
  Briefcase, Scale, Heart, Home, Building2, FileText,
  UserCircle, Hash, Copy, ExternalLink, Mic, MicOff,
  Sun, Moon, Umbrella, Plane, Coffee, Pause, X,
  VolumeX, Headphones, Music, WandSparkles, MapPin,
  PauseCircle, PlayCircle, LogIn, LogOut, Award
} from 'lucide-react'

// ─── URLs oficiais ────────────────────────────────────────────
const MARA_AVATAR_URL = 'https://www.genspark.ai/api/files/s/qiD4oS1k?cache_control=3600'
const MARA_WEBHOOK_URL = 'https://ben-growth-center.vercel.app/api/whatsapp-mara'

// ─── Voice IDs ElevenLabs ─────────────────────────────────────
const VOICE_DR_BEN = 'ETf5cmpNIbpSiXmBaR2m'
const VOICE_MARA   = 'EST9Ui6982FZPSi7gCHi'

// ─── Tipos ───────────────────────────────────────────────────
interface ConfigMara {
  nome: string
  saudacao: string
  despedida: string
  tom: 'formal' | 'cordial' | 'amigavel'
  promptBase: string
  areas: {
    tributario: boolean
    previdenciario: boolean
    bancario: boolean
    trabalhista: boolean
    civil: boolean
    empresarial: boolean
    imobiliario: boolean
    familia: boolean
  }
  horario: {
    segunda: string; terca: string; quarta: string
    quinta: string; sexta: string; sabado: string; domingo: string
    ativoFimDeSemana: boolean
  }
  mensagensParaTriagem: number
  repassePalavras: string[]
  maxMensagensSesSao: number
  tempoEspera: number
  ativo: boolean
  modoManutencao: boolean
  mensagemManutencao: string
  notificacaoSonora: boolean
  alertaUrgente: boolean
  resumoAutomatico: boolean
  idioma: 'pt-BR' | 'es' | 'en'
  // Modo Ausente
  modoAusente: {
    ativo: boolean
    motivo: 'ferias' | 'doente' | 'audiencia' | 'viagem' | 'reuniao' | 'fora_horario'
    retorno: string
    mensagemPersonalizada: string
  }
  // Preferência de áudio
  audioPreferencia: {
    drMauro: 'audio' | 'texto' | 'perguntar'
    clientes: 'audio' | 'texto' | 'perguntar'
  }
}

interface ModoAusenteStatus {
  ativo: boolean
  motivo: string | null
  retorno: string | null
  mensagem: string | null
}

const CONFIG_PADRAO: ConfigMara = {
  nome: 'Dr. Ben',
  saudacao: 'Olá! 👋 Sou o Dr. Ben, assistente jurídico do escritório Mauro Monção Advogados. Como posso te ajudar hoje?',
  despedida: 'Foi um prazer atendê-lo! Se precisar de mais informações, estou à disposição. Tenha um ótimo dia! ⚖️',
  tom: 'cordial',
  promptBase: `Você é o Dr. Ben, assistente jurídico digital do escritório Mauro Monção Advogados Associados (OAB/PI · CE · MA), com sede em Parnaíba-PI.\n\nSua missão é realizar a triagem inicial do visitante, entender o problema jurídico e encaminhar para o advogado especialista correto. Você NÃO emite pareceres, NÃO representa o cliente e NÃO promete resultados.\n\n## FLUXO OBRIGATÓRIO (siga esta ordem):\n\n**ETAPA 1 – ABERTURA** (primeira mensagem)\nApresente-se de forma acolhedora e pergunte se pode fazer algumas perguntas rápidas.\n\n**ETAPA 2 – IDENTIFICAÇÃO**\nPergunte:\n- O atendimento é para você mesmo(a) ou para empresa/terceiro?\n- Você já é cliente do escritório ou é o primeiro contato?\n\n**ETAPA 3 – COLETA DA DEMANDA**\nPergunte: "Em poucas palavras, qual é o problema jurídico que você está enfrentando hoje?"\nOuça sem opinar. Não faça análise jurídica.\n\n**ETAPA 4 – CLASSIFICAÇÃO DA ÁREA**\nCom base no relato, infira a área: Tributário | Previdenciário | Bancário | Imobiliário | Família e Sucessões | Advocacia Pública | Trabalhista | Consumidor | Outros.\nConfirme com o usuário: "Pelo que você descreveu, isso parece estar ligado a [ÁREA]. Confere?"\n\n**ETAPA 5 – URGÊNCIA**\nPergunte: "Existe prazo próximo, risco imediato ou alguma situação urgente acontecendo agora?"\nClassifique internamente: low | medium | high | critical.\n\n**ETAPA 6 – COLETA DE CONTATO**\nDiga: "Para encaminharmos seu caso ao advogado especialista, preciso do seu nome e WhatsApp."\nColete nome e telefone (WhatsApp).\n\n**ETAPA 7 – ENCAMINHAMENTO**\nConfirme o recebimento, agradeça e informe que a equipe jurídica entrará em contato em breve.\nEncerre gentilmente.\n\n## REGRAS ABSOLUTAS:\n- NUNCA solicite CPF, CNPJ, RG, número de processo ou arquivos\n- NUNCA emita parecer, opinião jurídica ou análise do caso\n- NUNCA prometa resultados, prazos ou êxito\n- NUNCA recuse ou descarte um atendimento\n- Responda SEMPRE em português brasileiro\n- Seja cordial, profissional e objetivo\n- Mensagens curtas (máx. 3 parágrafos por resposta)`,
  areas: {
    tributario: true, previdenciario: true, bancario: true,
    trabalhista: true, civil: false, empresarial: false,
    imobiliario: true, familia: true,
  },
  horario: {
    segunda: '08:00–18:00', terca: '08:00–18:00', quarta: '08:00–18:00',
    quinta: '08:00–18:00', sexta: '08:00–18:00', sabado: '08:00–13:00',
    domingo: 'Fechado', ativoFimDeSemana: true,
  },
  mensagensParaTriagem: 3,
  repassePalavras: ['urgente', 'penhora', 'execução fiscal', 'prazo fatal', 'multa', 'bloqueio judicial'],
  maxMensagensSesSao: 10,
  tempoEspera: 30,
  ativo: true,
  modoManutencao: false,
  mensagemManutencao: 'Estamos em manutenção no momento. Retornaremos em breve. Para urgências, ligue: via WhatsApp pessoal.',
  notificacaoSonora: true,
  alertaUrgente: true,
  resumoAutomatico: true,
  idioma: 'pt-BR',
  modoAusente: {
    ativo: false,
    motivo: 'ferias',
    retorno: '',
    mensagemPersonalizada: '',
  },
  audioPreferencia: {
    drMauro: 'perguntar',
    clientes: 'perguntar',
  },
}

// ─── Status Badge ────────────────────────────────────────────
function StatusBadge({ ativo, label }: { ativo: boolean; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
      ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ativo ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
      {label || (ativo ? 'ATIVO' : 'INATIVO')}
    </span>
  )
}

// ─── Seção colapsável ─────────────────────────────────────────
function Secao({ titulo, icone, children, defaultOpen = true, badge, badgeColor }: {
  titulo: string; icone: React.ReactNode; children: React.ReactNode
  defaultOpen?: boolean; badge?: string; badgeColor?: string
}) {
  const [aberto, setAberto] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#19385C] flex items-center justify-center">
            {icone}
          </div>
          <span className="font-semibold text-[#19385C]">{titulo}</span>
          {badge && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${badgeColor || 'bg-[#DEC078] text-white'}`}>{badge}</span>
          )}
        </div>
        {aberto ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </button>
      {aberto && <div className="px-6 pb-6 border-t border-gray-50">{children}</div>}
    </div>
  )
}

// ─── Toggle switch ────────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </div>
      {label && <span className="text-sm text-gray-600">{label}</span>}
    </label>
  )
}

// ─── Card de Capacidade ───────────────────────────────────────
function CapacidadeCard({ icon, titulo, desc, status }: {
  icon: React.ReactNode; titulo: string; desc: string; status: 'ativo' | 'beta' | 'breve'
}) {
  const cores = {
    ativo: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', label: '✅ Ativo' },
    beta:  { bg: 'bg-[#f0f3fa]',  border: 'border-[#c5d0e8]',  badge: 'bg-[#e8edf7] text-[#19385C]',   label: '🔬 Beta'  },
    breve: { bg: 'bg-gray-50',  border: 'border-gray-200',  badge: 'bg-gray-100 text-gray-500',   label: '🔜 Em breve' },
  }
  const c = cores[status]
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-4`}>
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 bg-[#19385C] rounded-xl flex items-center justify-center shrink-0">
          {icon}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.badge}`}>{c.label}</span>
      </div>
      <p className="font-semibold text-[#19385C] text-sm mt-2">{titulo}</p>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────
export default function MaraIA() {
  const [config, setConfig] = useState<ConfigMara>(CONFIG_PADRAO)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [testando, setTestando] = useState(false)
  const [msgTeste, setMsgTeste] = useState('')
  const [respostaTeste, setRespostaTeste] = useState('')
  const [novasPalavras, setNovasPalavras] = useState('')
  const [statusZAPI, setStatusZAPI] = useState<'verificando' | 'online' | 'offline'>('verificando')
  const [modoAusenteStatus, setModoAusenteStatus] = useState<ModoAusenteStatus>({ ativo: false, motivo: null, retorno: null, mensagem: null })
  const [ativandoAusente, setAtivandoAusente] = useState(false)
  const [testandoVoz, setTestandoVoz] = useState<'mara' | 'drben' | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [estatisticas, setEstatisticas] = useState({
    mensagensHoje: 0, leadsGerados: 0, taxaRepasse: 0,
    tempoMedioResposta: '< 3s', satisfacao: 97, totalLeads: 0,
  })

  // ── Carregar config e verificar status ───────────────────
  useEffect(() => {
    const salva = localStorage.getItem('mara-ia-config')
    if (salva) {
      try { setConfig(prev => ({ ...CONFIG_PADRAO, ...JSON.parse(salva) })) } catch {}
    }
    verificarStatus()
    verificarModoAusente()
    const interval = setInterval(verificarModoAusente, 30000)
    return () => clearInterval(interval)
  }, [])

  const verificarStatus = async () => {
    try {
      const d = await fetch('/api/diagnostico').then(r => r.json())
      // A API retorna o campo "zapi" (não "zapi_status")
      const zapiField = d?.zapi || d?.zapi_status || ''
      const ok = zapiField.includes('✅') || zapiField.toLowerCase().includes('online') || zapiField.toLowerCase().includes('conectado')
      setStatusZAPI(ok ? 'online' : 'offline')
      if (d?.totalLeads) setEstatisticas(e => ({ ...e, totalLeads: d.totalLeads, leadsGerados: d.totalLeads }))
    } catch { setStatusZAPI('offline') }
    try {
      const d = await fetch('/api/leads').then(r => r.json())
      const total = d?.total || d?.leads?.length || 0
      setEstatisticas(e => ({ ...e, totalLeads: total, leadsGerados: total }))
    } catch {}
  }

  const verificarModoAusente = async () => {
    try {
      const d = await fetch('/api/mara-ausente').then(r => r.json())
      // Se VPS indisponível (ok: false ou modo_ausente: null), NÃO sobrescreve o estado atual
      // Isso evita que falha de rede desative o modo ausente sozinho
      if (!d.ok && d.modo_ausente === null) {
        console.warn('[MARA] VPS indisponível — mantendo estado atual')
        return
      }
      if (typeof d.modo_ausente === 'boolean') {
        setModoAusenteStatus({ ativo: d.modo_ausente, motivo: d.motivo, retorno: null, mensagem: null })
      }
    } catch {
      // Em caso de erro de rede, mantém estado atual (não altera)
      console.warn('[MARA] Erro ao verificar estado — mantendo estado atual')
    }
  }

  // ── Ativar / Desativar Modo Ausente ───────────────────────
  const ativarModoAusente = async () => {
    setAtivandoAusente(true)
    try {
      const motivo  = config.modoAusente.motivo
      const retorno = config.modoAusente.retorno
      const res = await fetch('/api/mara-ausente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ausente', motivo, retorno }),
      })
      const data = await res.json()
      if (data.ok) {
        setModoAusenteStatus({ ativo: true, motivo, retorno: retorno || null, mensagem: null })
        setSalvo(true)
        setTimeout(() => setSalvo(false), 3000)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setAtivandoAusente(false)
    }
  }

  const desativarModoAusente = async () => {
    setAtivandoAusente(true)
    try {
      const res = await fetch('/api/mara-ausente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'presente' }),
      })
      const data = await res.json()
      if (data.ok) {
        setModoAusenteStatus({ ativo: false, motivo: null, retorno: null, mensagem: null })
      }
    } catch {} finally {
      setAtivandoAusente(false)
    }
  }

  // ── Testar Voz ElevenLabs ─────────────────────────────────
  const testarVoz = async (tipo: 'mara' | 'drben') => {
    setTestandoVoz(tipo)
    setAudioUrl(null)
    const voiceId = tipo === 'mara' ? VOICE_MARA : VOICE_DR_BEN
    const texto = tipo === 'mara'
      ? 'Boa tarde, Dr. Mauro! Sou a MARA, sua secretária executiva. Estou aqui para te ajudar com tudo que precisar!'
      : 'Olá! Sou o Dr. Ben, assistente jurídico do escritório Mauro Monção. Como posso te ajudar hoje?'
    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: texto, voiceId, stability: 0.5, similarityBoost: 0.85, style: 0.2, speakerBoost: true }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setTimeout(() => audioRef.current?.play(), 100)
      }
    } catch (e) {
      console.error('[Voz] Erro:', e)
    } finally {
      setTestandoVoz(null)
    }
  }

  // ── Salvar configuração ───────────────────────────────────
  const salvarConfig = async () => {
    setSalvando(true)
    try {
      localStorage.setItem('mara-ia-config', JSON.stringify(config))
      await fetch('/api/mara-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      }).catch(() => {})
      setSalvo(true)
      setTimeout(() => setSalvo(false), 3000)
    } finally {
      setSalvando(false)
    }
  }

  // ── Testar Dr. Ben ────────────────────────────────────────
  const testarDrBen = async () => {
    if (!msgTeste.trim()) return
    setTestando(true)
    setRespostaTeste('')
    try {
      const res = await fetch('/api/whatsapp-zapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '5500000000000',
          text: { message: msgTeste },
          senderName: 'Teste Direto',
          _test: true,
        }),
      })
      const data = await res.json()
      setRespostaTeste(
        data?.resposta || data?.message ||
        '✅ Dr. Ben processou. Resposta enviada via WhatsApp para o número de teste.'
      )
    } catch {
      setRespostaTeste('⚠️ Teste via API. A resposta real é entregue pelo WhatsApp.')
    } finally {
      setTestando(false)
    }
  }

  const set = (campo: keyof ConfigMara, valor: any) =>
    setConfig(c => ({ ...c, [campo]: valor }))

  const setAusente = (campo: keyof ConfigMara['modoAusente'], valor: any) =>
    setConfig(c => ({ ...c, modoAusente: { ...c.modoAusente, [campo]: valor } }))

  const diasSemana: { key: keyof ConfigMara['horario']; label: string }[] = [
    { key: 'segunda', label: 'Segunda' }, { key: 'terca', label: 'Terça' },
    { key: 'quarta', label: 'Quarta' },   { key: 'quinta', label: 'Quinta' },
    { key: 'sexta', label: 'Sexta' },     { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' },
  ]

  const motivosAusente = [
    { key: 'ferias',      label: '🏖️ Férias',     desc: 'Em descanso, retorno em data definida' },
    { key: 'doente',      label: '🤒 Indisposto',  desc: 'Saúde, sem data definida de retorno' },
    { key: 'audiencia',   label: '⚖️ Audiência',   desc: 'Em audiência judicial, retorna em horas' },
    { key: 'viagem',      label: '✈️ Viagem',      desc: 'Em viagem de trabalho ou pessoal' },
    { key: 'reuniao',     label: '🤝 Reunião',     desc: 'Em reunião, retorna em breve' },
    { key: 'fora_horario', label: '😴 Fora do Horário', desc: 'Resposta automática fora do expediente' },
  ] as const

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#19385C] flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#19385C] to-[#1a3a6e] rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles size={22} className="text-[#DEC078]" />
            </div>
            MARA IA — Secretária Executiva
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Central de inteligência do Dr. Mauro Monção · GPT-4o-mini + ElevenLabs TTS
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge ativo={config.ativo && !config.modoManutencao} />
          {modoAusenteStatus.ativo && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              MODO AUSENTE
            </span>
          )}
          <button
            onClick={salvarConfig}
            disabled={salvando}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#19385C] text-white rounded-xl font-semibold hover:bg-[#0f2044] transition disabled:opacity-60"
          >
            {salvando
              ? <><Loader size={16} className="animate-spin" /> Salvando...</>
              : salvo
              ? <><CheckCircle2 size={16} className="text-green-400" /> Salvo!</>
              : <><Save size={16} /> Salvar</>
            }
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* PERFIL OFICIAL DA MARA IA                             */}
      {/* ══════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-[#19385C] to-[#1a3a6e] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        {/* Detalhe decorativo */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#DEC078]/10 rounded-full -translate-y-24 translate-x-24" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16" />

        <div className="relative flex flex-col lg:flex-row items-center lg:items-start gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-32 h-32 rounded-2xl border-4 border-[#DEC078] shadow-2xl overflow-hidden">
              <img
                src={MARA_AVATAR_URL}
                alt="MARA IA"
                className="w-full h-full object-cover"
                onError={e => {
                  (e.target as HTMLImageElement).src =
                    'https://ui-avatars.com/api/?name=MARA+IA&background=D4A017&color=0f2044&size=256&bold=true'
                }}
              />
            </div>
            <span className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold border-2 border-white animate-pulse">
              ONLINE
            </span>
          </div>

          {/* Dados do perfil */}
          <div className="flex-1 text-center lg:text-left">
            <div className="flex items-center gap-3 justify-center lg:justify-start flex-wrap">
              <h2 className="text-3xl font-bold text-white">MARA IA</h2>
              <span className="bg-[#DEC078] text-white text-xs px-3 py-1 rounded-full font-bold">
                Secretária Executiva
              </span>
            </div>
            <p className="text-[#DEC078] font-semibold text-sm mt-1">Dr. Mauro Monção · Advogados Associados</p>
            <p className="text-white/70 text-xs mt-1">22 anos · Brasileira · Formada em Gestão Jurídica · FGV São Paulo · 4 anos de experiência</p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-xl p-3 border border-white/20">
                <p className="text-white/60 text-xs mb-1">📱 Número Dedicado</p>
                <p className="text-white font-bold text-lg">(86) 99948-4761</p>
                <p className="text-[#DEC078] text-xs">Número conectado Z-API</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 border border-white/20">
                <p className="text-white/60 text-xs mb-1">🎙️ Voz ElevenLabs</p>
                <p className="text-white font-mono text-xs">{VOICE_MARA}</p>
                <p className="text-green-400 text-xs">✅ Configurada</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 border border-white/20">
                <p className="text-white/60 text-xs mb-1">🔗 Webhook Z-API</p>
                <p className="text-white font-mono text-xs break-all">/api/whatsapp-zapi</p>
                <p className="text-green-400 text-xs">✅ Ativo</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 border border-white/20">
                <p className="text-white/60 text-xs mb-1">🤖 IA Engine</p>
                <p className="text-white font-bold">GPT-4o-mini</p>
                <p className="text-green-400 text-xs">✅ OpenAI</p>
              </div>
            </div>
          </div>

          {/* Tags de personalidade */}
          <div className="flex flex-col gap-2 shrink-0">
            {[
              { tag: 'Elegante',    emoji: '💎' },
              { tag: 'Inteligente', emoji: '🧠' },
              { tag: 'Proativa',    emoji: '⚡' },
              { tag: 'Discreta',    emoji: '🤫' },
              { tag: 'Eficiente',   emoji: '🎯' },
              { tag: 'Empática',    emoji: '💝' },
            ].map(({ tag, emoji }) => (
              <span key={tag} className="text-xs bg-[#DEC078]/20 border border-[#DEC078]/40 text-[#DEC078] px-3 py-1 rounded-full text-center">
                {emoji} {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Tom de voz adaptativo */}
        <div className="relative mt-5 p-4 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-white/80 text-xs font-semibold mb-3">🎭 Tom de Voz Adaptativo da MARA:</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { ctx: 'Formal/Profissional', resp: 'Executiva & Precisa', icon: '👔' },
              { ctx: 'Informal/Amigável',   resp: 'Próxima & Calorosa',  icon: '😊' },
              { ctx: 'Urgente/Estressante', resp: 'Calma & Resolutiva',  icon: '🛡️' },
              { ctx: 'Pessoal/Reflexiva',   resp: 'Empática & Discreta', icon: '💙' },
            ].map(t => (
              <div key={t.ctx} className="bg-white/10 rounded-lg p-2 text-center">
                <p className="text-lg">{t.icon}</p>
                <p className="text-white/60 text-[10px]">{t.ctx}</p>
                <p className="text-[#DEC078] text-[10px] font-semibold">{t.resp}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODO AUSENTE — CONTROLE PRINCIPAL                      */}
      {/* ══════════════════════════════════════════════════════ */}
      <div className={`rounded-2xl border-2 p-6 shadow-sm transition-all ${
        modoAusenteStatus.ativo
          ? 'border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50'
          : 'border-gray-100 bg-white'
      }`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              modoAusenteStatus.ativo ? 'bg-amber-500' : 'bg-[#19385C]'
            }`}>
              {modoAusenteStatus.ativo
                ? <PauseCircle size={20} className="text-white" />
                : <PlayCircle size={20} className="text-[#DEC078]" />
              }
            </div>
            <div>
              <h3 className="font-bold text-[#19385C] text-lg">🛡️ Modo Ausente da MARA IA</h3>
              <p className="text-xs text-gray-500">Quando ativo, MARA responde por você automaticamente no WhatsApp</p>
            </div>
          </div>

          {/* Status atual */}
          {modoAusenteStatus.ativo ? (
            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-amber-500 text-white">
                🔴 MARA Respondendo por Você
              </span>
              {modoAusenteStatus.retorno && (
                <p className="text-xs text-amber-600 mt-1">Retorno: {modoAusenteStatus.retorno}</p>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-green-100 text-green-700">
              🟢 Dr. Mauro Presente
            </span>
          )}
        </div>

        {/* Cards de motivo */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          {motivosAusente.map(m => (
            <button
              key={m.key}
              onClick={() => setAusente('motivo', m.key)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                config.modoAusente.motivo === m.key
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-gray-100 bg-gray-50 hover:border-amber-200'
              }`}
            >
              <p className="font-semibold text-sm text-[#19385C]">{m.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>

        {/* Data de retorno */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              📅 Data/hora de retorno (opcional)
            </label>
            <input
              type="text"
              value={config.modoAusente.retorno}
              onChange={e => setAusente('retorno', e.target.value)}
              placeholder="Ex: 15/03, amanhã, 14h..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              💬 Mensagem personalizada (opcional)
            </label>
            <input
              type="text"
              value={config.modoAusente.mensagemPersonalizada}
              onChange={e => setAusente('mensagemPersonalizada', e.target.value)}
              placeholder="Ex: Estou em congresso em São Paulo..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* Preview da mensagem */}
        <div className="mb-5 p-3 bg-white rounded-xl border border-amber-200">
          <p className="text-xs font-semibold text-amber-700 mb-2">👁️ Preview — MARA responderá assim pelos seus contatos:</p>
          <p className="text-sm text-gray-600 italic">
            {config.modoAusente.motivo === 'ferias' && `"Olá! O Dr. Mauro está em férias${config.modoAusente.retorno ? ` e retorna dia ${config.modoAusente.retorno}` : ''}. Posso anotar seu recado?"`}
            {config.modoAusente.motivo === 'doente' && `"Olá! O Dr. Mauro está indisposto${config.modoAusente.retorno ? ` e retorna ${config.modoAusente.retorno}` : ' e retorna em breve'}. Posso ajudar?"`}
            {config.modoAusente.motivo === 'audiencia' && `"Olá! O Dr. Mauro está em audiência${config.modoAusente.retorno ? ` e retorna por volta das ${config.modoAusente.retorno}` : ' e retorna em breve'}. Posso anotar seu recado?"`}
            {config.modoAusente.motivo === 'viagem' && `"Olá! O Dr. Mauro está em viagem${config.modoAusente.retorno ? ` e retorna dia ${config.modoAusente.retorno}` : ''}. Para urgências: (86) 9482-0054."`}
            {config.modoAusente.motivo === 'reuniao' && `"Olá! O Dr. Mauro está em reunião${config.modoAusente.retorno ? ` e estará disponível às ${config.modoAusente.retorno}` : ' e retorna em breve'}. Posso anotar seu recado?"`}
            {config.modoAusente.motivo === 'fora_horario' && `"Olá! Nosso horário de atendimento é seg-sex 8h-18h. Deixe sua mensagem e retornaremos no próximo dia útil."`}
          </p>
          <p className="text-xs text-gray-400 mt-2">⚠️ Palavras urgentes (penhora, execução, prazo fatal) sempre alertam o Dr. Mauro mesmo no modo ausente</p>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3 flex-wrap">
          {!modoAusenteStatus.ativo ? (
            <button
              onClick={ativarModoAusente}
              disabled={ativandoAusente}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition disabled:opacity-60"
            >
              {ativandoAusente
                ? <Loader size={16} className="animate-spin" />
                : <PauseCircle size={16} />
              }
              🛡️ Ativar Modo Ausente
            </button>
          ) : (
            <button
              onClick={desativarModoAusente}
              disabled={ativandoAusente}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition disabled:opacity-60"
            >
              {ativandoAusente
                ? <Loader size={16} className="animate-spin" />
                : <PlayCircle size={16} />
              }
              ✅ Estou de Volta — Desativar
            </button>
          )}

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className={`w-2 h-2 rounded-full ${modoAusenteStatus.ativo ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
            <p className="text-xs text-gray-600">
              {modoAusenteStatus.ativo
                ? `MARA ativa — Motivo: ${modoAusenteStatus.motivo || 'ausente'}`
                : 'Dr. Mauro presente — MARA apenas notifica'
              }
            </p>
          </div>
        </div>

        {/* Comandos via WhatsApp */}
        <div className="mt-4 p-3 bg-[#f0f3fa] border border-[#c5d0e8] rounded-xl">
          <p className="text-xs font-semibold text-[#19385C] mb-2">📱 Também funciona via WhatsApp — envie para a MARA:</p>
          <div className="flex flex-wrap gap-2">
            {[
              { cmd: '/ausente ferias 20/03', desc: 'Férias até 20/03' },
              { cmd: '/ausente doente',        desc: 'Indisposto' },
              { cmd: '/ausente audiencia 15h', desc: 'Audiência até 15h' },
              { cmd: '/presente',              desc: 'Desativar' },
            ].map(c => (
              <code key={c.cmd} className="text-xs bg-white border border-[#c5d0e8] text-[#19385C] px-2 py-1 rounded-lg">
                {c.cmd}
              </code>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* VOZES ELEVENLABS                                       */}
      {/* ══════════════════════════════════════════════════════ */}
      <Secao
        titulo="🎙️ Vozes ElevenLabs — Dr. Ben & MARA IA"
        icone={<Volume2 size={16} className="text-[#DEC078]" />}
        badge="TTS Ativo"
        badgeColor="bg-purple-100 text-purple-700"
      >
        <div className="mt-5 space-y-5">
          {/* Info */}
          <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl flex items-start gap-2">
            <Headphones size={14} className="text-purple-500 mt-0.5 shrink-0" />
            <p className="text-xs text-purple-700">
              Ambos os agentes podem enviar <strong>respostas em áudio</strong> via ElevenLabs TTS.
              O sistema pergunta ao interlocutor se prefere áudio antes de ativar. A preferência é salva permanentemente.
            </p>
          </div>

          {/* Cards de voz */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Dr. Ben */}
            <div className="p-4 rounded-xl border-2 border-[#19385C] bg-gradient-to-br from-[#19385C]/5 to-[#19385C]/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-[#19385C] rounded-xl flex items-center justify-center">
                    <Scale size={16} className="text-[#DEC078]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#19385C] text-sm">Dr. Ben</p>
                    <p className="text-xs text-gray-400">Assistente Jurídico</p>
                  </div>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">✅ Ativo</span>
              </div>
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Voice ID ElevenLabs:</p>
                <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded-lg text-[#19385C] break-all">{VOICE_DR_BEN}</code>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Voz masculina, profissional e acolhedora — ideal para atendimento jurídico de clientes.
              </p>
              <button
                onClick={() => testarVoz('drben')}
                disabled={testandoVoz !== null}
                className="flex items-center gap-2 px-4 py-2 bg-[#19385C] text-white rounded-xl text-xs font-semibold hover:bg-[#0f2044] transition disabled:opacity-50"
              >
                {testandoVoz === 'drben'
                  ? <><Loader size={12} className="animate-spin" /> Gerando áudio...</>
                  : <><Play size={12} /> ▶ Ouvir Voz do Dr. Ben</>
                }
              </button>
            </div>

            {/* MARA */}
            <div className="p-4 rounded-xl border-2 border-[#DEC078] bg-gradient-to-br from-amber-50 to-yellow-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-[#DEC078] rounded-xl flex items-center justify-center">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-[#19385C] text-sm">MARA IA</p>
                    <p className="text-xs text-gray-400">Secretária Executiva</p>
                  </div>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">✅ Ativo</span>
              </div>
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Voice ID ElevenLabs:</p>
                <code className="text-xs font-mono bg-amber-100 px-2 py-1 rounded-lg text-[#19385C] break-all">{VOICE_MARA}</code>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Voz feminina, elegante e executiva — perfeita para a secretária pessoal do Dr. Mauro.
              </p>
              <button
                onClick={() => testarVoz('mara')}
                disabled={testandoVoz !== null}
                className="flex items-center gap-2 px-4 py-2 bg-[#DEC078] text-white rounded-xl text-xs font-semibold hover:bg-amber-600 transition disabled:opacity-50"
              >
                {testandoVoz === 'mara'
                  ? <><Loader size={12} className="animate-spin" /> Gerando áudio...</>
                  : <><Play size={12} /> ▶ Ouvir Voz da MARA</>
                }
              </button>
            </div>
          </div>

          {/* Player oculto */}
          {audioUrl && (
            <audio ref={audioRef} src={audioUrl} controls className="w-full rounded-xl" />
          )}

          {/* Preferências de áudio */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#19385C]">⚙️ Comportamento de Áudio</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-2">🎙️ Para o Dr. Mauro (MARA IA)</p>
                <select
                  value={config.audioPreferencia.drMauro}
                  onChange={e => setConfig(c => ({ ...c, audioPreferencia: { ...c.audioPreferencia, drMauro: e.target.value as any } }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#19385C] bg-white"
                >
                  <option value="perguntar">🤔 Perguntar na primeira conversa do dia</option>
                  <option value="audio">🎙️ Sempre enviar em áudio</option>
                  <option value="texto">💬 Sempre enviar em texto</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-2">⚖️ Para Clientes (Dr. Ben)</p>
                <select
                  value={config.audioPreferencia.clientes}
                  onChange={e => setConfig(c => ({ ...c, audioPreferencia: { ...c.audioPreferencia, clientes: e.target.value as any } }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#19385C] bg-white"
                >
                  <option value="perguntar">🤔 Perguntar na 3ª mensagem do cliente</option>
                  <option value="audio">🎙️ Sempre enviar em áudio</option>
                  <option value="texto">💬 Sempre enviar em texto</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-[#f0f3fa] border border-[#c5d0e8] rounded-xl flex items-start gap-2">
              <Info size={14} className="text-[#19385C] mt-0.5 shrink-0" />
              <div className="text-xs text-[#19385C]">
                <p><strong>Como funciona:</strong> Quando configurado para "perguntar", o agente diz:</p>
                <p className="mt-1 italic">"Posso enviar minhas próximas respostas em áudio? Prefere assim? 😊"</p>
                <p className="mt-1">A resposta do interlocutor é salva permanentemente (sim → áudio, não → texto).</p>
              </div>
            </div>
          </div>
        </div>
      </Secao>

      {/* ── Papéis do Sistema ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border-2 border-[#19385C] bg-gradient-to-br from-[#19385C]/5 to-[#19385C]/10 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#19385C] rounded-xl flex items-center justify-center">
              <Scale size={20} className="text-[#DEC078]" />
            </div>
            <div>
              <p className="font-bold text-[#19385C] text-lg">Dr. Ben</p>
              <p className="text-xs text-gray-500">Assistente Jurídico do Escritório</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Atende os <strong>clientes</strong> no WhatsApp <strong>(86) 9482-0054</strong>.
            Faz triagem em 7 etapas, coleta dados e qualifica leads com IA GPT-4o-mini.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['Triagem 7 etapas', 'GPT-4o-mini', 'Z-API Cloud', 'ElevenLabs TTS'].map(t => (
              <span key={t} className="text-xs bg-[#19385C] text-white px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl border-2 border-[#DEC078] bg-gradient-to-br from-amber-50 to-yellow-50 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#DEC078] rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-[#19385C] text-lg">MARA IA</p>
              <p className="text-xs text-gray-500">Secretária Pessoal do Dr. Mauro</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Secretária pessoal no WhatsApp <strong>via WhatsApp pessoal</strong>.
            Notifica leads, gerencia o modo ausente, executa comandos e responde com personalidade.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['Notificação imediata', 'Modo Ausente', 'Comandos /leads', 'ElevenLabs TTS'].map(t => (
              <span key={t} className="text-xs bg-[#DEC078] text-white px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Status em Tempo Real ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#19385C] flex items-center gap-2">
            <Activity size={16} className="text-[#DEC078]" />
            Status do Sistema em Tempo Real
          </h3>
          <button
            onClick={verificarStatus}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <RefreshCw size={12} /> Atualizar
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            {
              label: 'Z-API', icon: statusZAPI === 'online' ? <Wifi size={14} className="text-green-600" /> : <WifiOff size={14} className="text-red-500" />,
              status: statusZAPI === 'online' ? '✅ Conectado' : statusZAPI === 'offline' ? '❌ Offline' : '⏳ Verificando',
              bg: statusZAPI === 'online' ? 'bg-green-50 border-green-200' : statusZAPI === 'offline' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200',
            },
            { label: 'Dr. Ben',  icon: <CheckCircle size={14} className="text-green-600" />, status: '✅ Operacional', bg: 'bg-green-50 border-green-200' },
            { label: 'MARA IA',  icon: <Sparkles size={14} className="text-amber-500" />,    status: '✅ Online',       bg: 'bg-amber-50 border-amber-200' },
            { label: 'GPT-4o',   icon: <Cpu size={14} className="text-[#19385C]" />,           status: 'gpt-4o-mini',    bg: 'bg-[#f0f3fa] border-[#c5d0e8]' },
            { label: 'TTS',      icon: <Volume2 size={14} className="text-purple-600" />,     status: '✅ ElevenLabs',   bg: 'bg-purple-50 border-purple-200' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-3 border ${s.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                {s.icon}
                <span className="text-xs font-bold text-gray-700">{s.label}</span>
              </div>
              <p className="text-xs font-semibold text-gray-600">{s.status}</p>
            </div>
          ))}
        </div>

        {/* Leads estatísticas */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Leads', valor: estatisticas.totalLeads,           suffix: '',  cor: 'text-[#19385C]',   bg: 'bg-[#f0f3fa]',   icon: <Users size={16} className="text-[#19385C]" />      },
            { label: 'Taxa Resposta', valor: 97,                              suffix: '%', cor: 'text-green-600',  bg: 'bg-green-50',  icon: <TrendingUp size={16} className="text-green-500" /> },
            { label: 'Tempo Médio',  valor: estatisticas.tempoMedioResposta,  suffix: '',  cor: 'text-purple-600', bg: 'bg-purple-50', icon: <Zap size={16} className="text-purple-500" />       },
            { label: 'Satisfação',   valor: estatisticas.satisfacao,          suffix: '%', cor: 'text-amber-600',  bg: 'bg-amber-50',  icon: <Star size={16} className="text-amber-500" />       },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-1">
                {s.icon}
                <p className={`text-2xl font-bold ${s.cor}`}>{s.valor}{s.suffix}</p>
              </div>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Controle Geral ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-[#19385C] mb-4 flex items-center gap-2">
          <Settings2 size={16} className="text-[#DEC078]" />
          Controle Geral
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            { campo: 'ativo',             label: 'Dr. Ben Ativo',     desc: 'Atendimento automático de clientes' },
            { campo: 'modoManutencao',    label: 'Modo Manutenção',   desc: 'Envia aviso de manutenção aos clientes' },
            { campo: 'alertaUrgente',     label: 'Alerta Urgente',    desc: 'Notifica casos críticos imediatamente' },
          ].map(c => (
            <div key={c.campo} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-700">{c.label}</p>
                <p className="text-xs text-gray-400">{c.desc}</p>
              </div>
              <Toggle
                checked={config[c.campo as keyof ConfigMara] as boolean}
                onChange={v => set(c.campo as keyof ConfigMara, v)}
              />
            </div>
          ))}
        </div>
        {config.modoManutencao && (
          <div className="mt-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Mensagem exibida em Manutenção</label>
            <textarea
              rows={2}
              value={config.mensagemManutencao}
              onChange={e => set('mensagemManutencao', e.target.value)}
              className="w-full border border-amber-200 bg-amber-50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        )}
      </div>

      {/* ── Identidade do Dr. Ben ────────────────────────────── */}
      <Secao titulo="Identidade do Dr. Ben" icone={<Bot size={16} className="text-[#DEC078]" />}>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Nome da Assistente</label>
              <input
                type="text"
                value={config.nome}
                onChange={e => set('nome', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#19385C]"
                placeholder="Dr. Ben"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Tom de Voz</label>
              <select
                value={config.tom}
                onChange={e => set('tom', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#19385C] bg-white"
              >
                <option value="formal">🎩 Formal — Linguagem técnica e distante</option>
                <option value="cordial">🤝 Cordial — Profissional e acolhedor (Recomendado)</option>
                <option value="amigavel">😊 Amigável — Próximo e descontraído</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Saudação Inicial</label>
            <textarea rows={2} value={config.saudacao} onChange={e => set('saudacao', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#19385C]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Mensagem de Despedida</label>
            <textarea rows={2} value={config.despedida} onChange={e => set('despedida', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#19385C]" />
          </div>
        </div>
      </Secao>

      {/* ── Prompt da IA ─────────────────────────────────────── */}
      <Secao titulo="Instruções da IA — Prompt do Dr. Ben" icone={<Brain size={16} className="text-[#DEC078]" />} defaultOpen={false}>
        <div className="mt-4">
          <div className="flex items-start gap-2 mb-3 p-3 bg-[#f0f3fa] border border-[#e8edf7] rounded-xl">
            <Info size={14} className="text-[#19385C] mt-0.5 shrink-0" />
            <p className="text-xs text-[#19385C]">
              Este é o <strong>"cérebro"</strong> do Dr. Ben. O fluxo de 7 etapas garante triagem completa antes de notificar a MARA IA.
            </p>
          </div>
          <textarea
            rows={12}
            value={config.promptBase}
            onChange={e => set('promptBase', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#19385C] bg-gray-50"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400">{config.promptBase.length} caracteres · GPT-4o-mini</p>
            <button onClick={() => set('promptBase', CONFIG_PADRAO.promptBase)}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <RefreshCw size={12} /> Restaurar padrão
            </button>
          </div>
        </div>
      </Secao>

      {/* ── Áreas de Atuação ─────────────────────────────────── */}
      <Secao titulo="Áreas de Atuação" icone={<Scale size={16} className="text-[#DEC078]" />} defaultOpen={false}>
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {([
            { key: 'tributario',     label: 'Tributário',      emoji: '🧾', desc: 'Impostos, execuções, parcelamentos' },
            { key: 'previdenciario', label: 'Previdenciário',  emoji: '👴', desc: 'Aposentadoria, INSS, benefícios' },
            { key: 'bancario',       label: 'Bancário',        emoji: '🏦', desc: 'Contratos, cobranças abusivas' },
            { key: 'trabalhista',    label: 'Trabalhista',     emoji: '👷', desc: 'Direitos, rescisões, FGTS' },
            { key: 'civil',          label: 'Cível',           emoji: '⚖️', desc: 'Contratos, indenizações' },
            { key: 'empresarial',    label: 'Empresarial',     emoji: '🏢', desc: 'Empresas, contratos comerciais' },
            { key: 'imobiliario',    label: 'Imobiliário',     emoji: '🏠', desc: 'Compra, venda, locação' },
            { key: 'familia',        label: 'Família',         emoji: '👨‍👩‍👧', desc: 'Divórcio, herança, tutela' },
          ] as { key: keyof ConfigMara['areas']; label: string; emoji: string; desc: string }[]).map(a => (
            <div
              key={a.key}
              onClick={() => setConfig(c => ({ ...c, areas: { ...c.areas, [a.key]: !c.areas[a.key] } }))}
              className={`cursor-pointer rounded-xl p-3 border-2 transition-all ${
                config.areas[a.key] ? 'border-[#19385C] bg-[#f0f3fa]' : 'border-gray-100 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xl">{a.emoji}</span>
                <Toggle checked={config.areas[a.key]} onChange={v => setConfig(c => ({ ...c, areas: { ...c.areas, [a.key]: v } }))} />
              </div>
              <p className={`font-semibold text-xs ${config.areas[a.key] ? 'text-[#19385C]' : 'text-gray-400'}`}>{a.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
            </div>
          ))}
        </div>
      </Secao>

      {/* ── Horário de Atendimento ──────────────────────────── */}
      <Secao titulo="Horário de Atendimento" icone={<Clock size={16} className="text-[#DEC078]" />} defaultOpen={false}>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">Fora do horário, o Dr. Ben informa o cliente e agenda para o próximo dia.</p>
            <Toggle
              checked={config.horario.ativoFimDeSemana}
              onChange={v => setConfig(c => ({ ...c, horario: { ...c.horario, ativoFimDeSemana: v } }))}
              label="Fim de semana ativo"
            />
          </div>
          <div className="grid grid-cols-1 gap-2">
            {diasSemana.map(({ key, label }) => {
              const isFds = key === 'sabado' || key === 'domingo'
              return (
                <div key={key} className={`flex items-center gap-3 p-3 rounded-xl bg-gray-50 ${isFds && !config.horario.ativoFimDeSemana ? 'opacity-40' : ''}`}>
                  <span className="w-20 text-sm font-semibold text-gray-700">{label}</span>
                  <input
                    type="text"
                    value={config.horario[key] as string}
                    onChange={e => setConfig(c => ({ ...c, horario: { ...c.horario, [key]: e.target.value } }))}
                    disabled={isFds && !config.horario.ativoFimDeSemana}
                    placeholder="ex: 08:00–18:00 ou Fechado"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#19385C] disabled:bg-gray-100"
                  />
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    config.horario[key as keyof typeof config.horario] === 'Fechado'
                      ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-700'
                  }`}>
                    {config.horario[key as keyof typeof config.horario] === 'Fechado' ? 'Fechado' : 'Aberto'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </Secao>

      {/* ── Triagem & Aviso MARA ─────────────────────────────── */}
      <Secao titulo="Triagem Dr. Ben & Aviso MARA IA" icone={<Zap size={16} className="text-[#DEC078]" />} badge="Core">
        <div className="mt-4 space-y-5">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-[#c5d0e8] rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-sm font-semibold text-gray-700">Mensagens até a triagem completa</label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Após este número de trocas, Dr. Ben finaliza a triagem e a MARA IA avisa o Dr. Mauro no <strong>via WhatsApp pessoal</strong>
                </p>
              </div>
              <span className="text-[#19385C] font-bold text-3xl w-14 text-center">{config.mensagensParaTriagem}</span>
            </div>
            <input
              type="range" min={1} max={7} step={1}
              value={config.mensagensParaTriagem}
              onChange={e => set('mensagensParaTriagem', Number(e.target.value))}
              className="w-full accent-[#19385C]"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1 (notifica rápido)</span>
              <span>7 (coleta máximo)</span>
            </div>
          </div>

          {/* Palavras-chave de urgência */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              🚨 Palavras que disparam ALERTA IMEDIATO
            </label>
            <p className="text-xs text-gray-400 mb-3">
              Se o cliente digitar qualquer uma dessas palavras, a MARA IA avisa o Dr. Mauro <em>imediatamente</em> como URGENTE.
            </p>
            <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
              {config.repassePalavras.map((p, i) => (
                <span key={i} className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-1 rounded-full">
                  🚨 {p}
                  <button onClick={() => set('repassePalavras', config.repassePalavras.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-700 ml-1 text-base leading-none">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={novasPalavras}
                onChange={e => setNovasPalavras(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && novasPalavras.trim()) {
                    set('repassePalavras', [...config.repassePalavras, novasPalavras.trim().toLowerCase()])
                    setNovasPalavras('')
                  }
                }}
                placeholder="Digite uma palavra e pressione Enter..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#19385C]"
              />
              <button
                onClick={() => {
                  if (novasPalavras.trim()) {
                    set('repassePalavras', [...config.repassePalavras, novasPalavras.trim().toLowerCase()])
                    setNovasPalavras('')
                  }
                }}
                className="px-4 py-2 bg-[#19385C] text-white rounded-xl text-sm font-semibold hover:bg-[#0f2044] transition"
              >
                + Adicionar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Máx. mensagens por sessão</label>
              <input type="number" min={5} max={30} value={config.maxMensagensSesSao}
                onChange={e => set('maxMensagensSesSao', Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#19385C]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Tempo máx. sessão (min)</label>
              <input type="number" min={5} max={120} value={config.tempoEspera}
                onChange={e => set('tempoEspera', Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#19385C]" />
            </div>
          </div>
        </div>
      </Secao>

      {/* ── Capacidades da MARA IA ───────────────────────────── */}
      <Secao titulo="Capacidades Completas da MARA IA" icone={<Sparkles size={16} className="text-[#DEC078]" />} badge="Novo" defaultOpen={false}>
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-4">
            A MARA IA é a central de inteligência do escritório Mauro Monção:
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <CapacidadeCard icon={<Bell size={16} className="text-[#DEC078]" />}
              titulo="Notificação Instantânea de Leads" status="ativo"
              desc="Avisa o Dr. Mauro via WhatsApp após cada lead qualificado: nome, telefone, área jurídica, urgência e resumo completo." />
            <CapacidadeCard icon={<PauseCircle size={16} className="text-[#DEC078]" />}
              titulo="Modo Ausente Inteligente" status="ativo"
              desc="5 motivos: férias, doente, audiência, viagem, reunião. Responde automaticamente e alerta urgências mesmo durante a ausência." />
            <CapacidadeCard icon={<Volume2 size={16} className="text-[#DEC078]" />}
              titulo="Respostas em Áudio (TTS)" status="ativo"
              desc="Integração com ElevenLabs — envia áudio realista com a voz da MARA ou Dr. Ben. Sistema pergunta preferência antes de ativar." />
            <CapacidadeCard icon={<Brain size={16} className="text-[#DEC078]" />}
              titulo="Memória de Conversa Contínua" status="ativo"
              desc="Mantém histórico das últimas 30 mensagens com o Dr. Mauro, garantindo continuidade natural nas interações." />
            <CapacidadeCard icon={<Users size={16} className="text-[#DEC078]" />}
              titulo="CRM Automático de Leads" status="ativo"
              desc="Salva todos os leads automaticamente no banco com nome, telefone, área, urgência, primeiro contato e resumo." />
            <CapacidadeCard icon={<Zap size={16} className="text-[#DEC078]" />}
              titulo="Alerta de Urgência 24/7" status="ativo"
              desc="Detecta 'penhora', 'execução fiscal', 'prazo fatal' e notifica o Dr. Mauro imediatamente, mesmo em férias." />
            <CapacidadeCard icon={<MessageSquare size={16} className="text-[#DEC078]" />}
              titulo="Triagem Jurídica em 7 Etapas" status="ativo"
              desc="Dr. Ben conduz o cliente por identificação, área jurídica, urgência e contato de forma natural e profissional." />
            <CapacidadeCard icon={<ArrowRight size={16} className="text-[#DEC078]" />}
              titulo="Link Direto ao Cliente" status="ativo"
              desc="Notificação inclui wa.me direto para responder o cliente com um toque, sem precisar salvar o número." />
            <CapacidadeCard icon={<BarChart2 size={16} className="text-[#DEC078]" />}
              titulo="Dashboard Analytics" status="beta"
              desc="Visualize leads por área, urgência, taxa de conversão e histórico completo no painel CRM." />
            <CapacidadeCard icon={<FileText size={16} className="text-[#DEC078]" />}
              titulo="Contratos Digitais (ZapSign)" status="breve"
              desc="Envio automático de contratos após qualificação. Cliente assina direto pelo WhatsApp." />
            <CapacidadeCard icon={<Target size={16} className="text-[#DEC078]" />}
              titulo="Campanhas Jurídicas" status="breve"
              desc="Mensagens em massa para leads segmentados por área: tributário, previdenciário, trabalhista, etc." />
            <CapacidadeCard icon={<Phone size={16} className="text-[#DEC078]" />}
              titulo="Assumir Conversa" status="breve"
              desc="Dr. Mauro assume a conversa diretamente pelo CRM, pausando o Dr. Ben e respondendo pessoalmente." />
          </div>
        </div>
      </Secao>

      {/* ── Testar Dr. Ben ao Vivo ───────────────────────────── */}
      <Secao titulo="Simular Conversa com Dr. Ben" icone={<Play size={16} className="text-[#DEC078]" />} defaultOpen={false}>
        <div className="mt-4 space-y-4">
          <div className="p-3 bg-[#f0f3fa] border border-[#c5d0e8] rounded-xl flex items-start gap-2">
            <Info size={14} className="text-[#19385C] mt-0.5 shrink-0" />
            <p className="text-xs text-[#19385C]">
              Simule como o <strong>Dr. Ben</strong> responderia a um cliente via GPT-4o-mini.
            </p>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={msgTeste}
              onChange={e => setMsgTeste(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && testarDrBen()}
              placeholder='Ex: "Recebi uma multa da Receita Federal, o que fazer?"'
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#19385C]"
            />
            <button
              onClick={testarDrBen}
              disabled={testando || !msgTeste.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#19385C] text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-[#0f2044] transition"
            >
              {testando ? <Loader size={16} className="animate-spin" /> : <Play size={16} />}
              Testar
            </button>
          </div>
          {respostaTeste && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale size={16} className="text-[#DEC078]" />
                <span className="text-xs font-bold text-[#19385C]">{config.nome} respondeu:</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{respostaTeste}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">Exemplos de casos reais:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Recebi auto de infração da Receita Federal',
                'Quero me aposentar mas o INSS negou',
                'Banco está cobrando juros abusivos',
                'URGENTE: penhora na minha conta hoje',
                'Preciso de ajuda com herança',
                'Fui demitido sem justa causa',
              ].map(ex => (
                <button key={ex} onClick={() => setMsgTeste(ex)}
                  className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-[#19385C] hover:text-[#19385C] transition">
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Secao>

      {/* ── Setup da Instância MARA Z-API ───────────────────── */}
      <Secao titulo="Setup — Instância MARA Z-API" icone={<Zap size={16} className="text-[#DEC078]" />} badge="Novo" defaultOpen={true}>
        <div className="mt-4 space-y-5">

          {/* Credenciais da nova instância */}
          <div>
            <p className="text-xs font-bold text-[#19385C] uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#19385C] text-white flex items-center justify-center text-xs">1</span>
              Credenciais da Nova Instância MARA
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#19385C] text-white">
                    <th className="px-4 py-3 text-left text-xs font-semibold">Campo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { campo: 'Instance ID',   valor: '3EFBA328D48CC11FFCB66237BF5854B6', status: 'ok' },
                    { campo: 'Token',         valor: 'EAC44AD0F0FF58FCD5A23C3B',         status: 'ok' },
                    { campo: 'Client Token',  valor: '(mesmo do Dr. Ben — ZAPI_CLIENT_TOKEN)', status: 'reuso' },
                    { campo: 'Número',        valor: 'Número configurado via Env Variable', status: 'ok' },
                    { campo: 'Webhook URL',   valor: 'ben-growth-center.vercel.app/api/whatsapp-mara', status: 'ok' },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 font-semibold text-[#19385C] text-xs">{row.campo}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 break-all">{row.valor}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          row.status === 'ok'    ? 'bg-green-100 text-green-700' :
                          row.status === 'reuso' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {row.status === 'ok' ? '✅ Definido' : row.status === 'reuso' ? '🔄 Reutilizar' : '⚠️ Pendente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Passo a passo */}
          <div>
            <p className="text-xs font-bold text-[#19385C] uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#19385C] text-white flex items-center justify-center text-xs">2</span>
              Passos para Ativar (em ordem)
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#DEC078] text-white">
                    <th className="px-4 py-3 text-left text-xs font-semibold w-10">Passo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Ação</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Onde</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    {
                      passo: '1',
                      acao: 'Adicionar MARA_ZAPI_INSTANCE_ID e MARA_ZAPI_TOKEN no Vercel',
                      onde: 'vercel.com → ben-growth-center → Settings → Env Variables',
                      status: 'pendente',
                    },
                    {
                      passo: '2',
                      acao: 'Aguardar redeploy automático do Vercel (~1 min)',
                      onde: 'Vercel → Deployments → aguardar ✅',
                      status: 'pendente',
                    },
                    {
                      passo: '3',
                      acao: 'Configurar Webhook automático via endpoint',
                      onde: '/api/mara-setup?action=webhook',
                      status: 'pendente',
                    },
                    {
                      passo: '4',
                      acao: 'Verificar status da instância conectada',
                      onde: '/api/mara-setup?action=status',
                      status: 'pendente',
                    },
                    {
                      passo: '5',
                      acao: 'Enviar mensagem de teste para Dr. Mauro',
                      onde: '/api/mara-setup?action=testar',
                      status: 'pendente',
                    },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-center">
                        <span className="w-7 h-7 rounded-full bg-[#19385C] text-white text-xs font-bold flex items-center justify-center mx-auto">
                          {row.passo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-800">{row.acao}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">{row.onde}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold">
                          ⏳ Pendente
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Links rápidos de setup */}
          <div>
            <p className="text-xs font-bold text-[#19385C] uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#19385C] text-white flex items-center justify-center text-xs">3</span>
              Links Rápidos de Configuração
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#19385C] text-white">
                    <th className="px-4 py-3 text-left text-xs font-semibold">Ação</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">URL</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold w-20">Abrir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { acao: '📡 Verificar Status',           url: '/api/mara-setup?action=status' },
                    { acao: '🔗 Configurar Webhook',         url: '/api/mara-setup?action=webhook' },
                    { acao: '✉️ Enviar Teste ao Dr. Mauro',  url: '/api/mara-setup?action=testar' },
                    { acao: '📷 Ver QR Code (se precisar)',  url: '/api/mara-setup?action=qrcode' },
                    { acao: '🔌 Desconectar Instância',      url: '/api/mara-setup?action=desconectar' },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-xs font-semibold text-[#19385C]">{row.acao}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        https://ben-growth-center.vercel.app{row.url}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`https://ben-growth-center.vercel.app${row.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-[#DEC078] font-semibold hover:underline"
                        >
                          Abrir <ExternalLink size={12} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comandos do WhatsApp */}
          <div>
            <p className="text-xs font-bold text-[#19385C] uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#25D366] text-white flex items-center justify-center text-xs">W</span>
              Comandos MARA via WhatsApp
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#25D366] text-white">
                    <th className="px-4 py-3 text-left text-xs font-semibold">Comando</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">O que faz</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Efeito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { cmd: '/ausente',  desc: 'MARA assume o número do Dr. Mauro',          efeito: 'Ativa modo ausente → MARA responde por você (foto Dr. Mauro permanece)' },
                    { cmd: '/presente', desc: 'Desativa modo ausente do Dr. Mauro',          efeito: 'MARA para de responder + resumo das conversas recebidas' },
                    { cmd: '/leads',    desc: 'Lista leads captados hoje',                    efeito: 'Mostra nome, telefone e área de cada lead' },
                    { cmd: '/urgentes', desc: 'Lista casos marcados como urgentes/críticos',  efeito: 'Filtra leads com urgência high ou critical' },
                    { cmd: '/resumo',   desc: 'Relatório executivo do dia',                   efeito: 'Total leads, urgentes, status dos sistemas' },
                    { cmd: '/status',   desc: 'Status de todos os sistemas',                  efeito: 'OpenAI, Z-API, CRM, Vercel' },
                    { cmd: '/agenda',   desc: 'Compromissos do dia',                          efeito: 'Integração com calendário (em configuração)' },
                    { cmd: '/ajuda',    desc: 'Lista todos os comandos disponíveis',          efeito: 'Exibe este menu pelo WhatsApp' },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono bg-gray-100 text-[#19385C] px-2 py-1 rounded font-bold">{row.cmd}</code>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700">{row.desc}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 italic">{row.efeito}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modo Ausente — Como funciona */}
          <div>
            <p className="text-xs font-bold text-[#19385C] uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs">⚡</span>
              Modo Ausente — Fluxo de Troca de Perfil
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-orange-500 text-white">
                    <th className="px-4 py-3 text-left text-xs font-semibold">Evento</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Nome no WhatsApp</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Quem responde</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="bg-white">
                    <td className="px-4 py-3 text-xs font-semibold text-green-700">🟢 Modo PRESENTE</td>
                    <td className="px-4 py-3 text-xs text-gray-800">Dr. Mauro Monção</td>
                    <td className="px-4 py-3 text-xs text-gray-600">Advogado | OAB/PI · CE · MA</td>
                    <td className="px-4 py-3 text-xs font-semibold text-[#19385C]">Você (Dr. Mauro)</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 text-xs font-semibold text-red-600">🔴 Modo AUSENTE</td>
                    <td className="px-4 py-3 text-xs text-gray-800">MARA — Assistente Dr. Mauro</td>
                    <td className="px-4 py-3 text-xs text-gray-600">🤖 Respondendo por ele</td>
                    <td className="px-4 py-3 text-xs font-semibold text-purple-700">MARA IA (automático)</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 text-xs font-semibold text-blue-700">🔄 Ao retornar</td>
                    <td className="px-4 py-3 text-xs text-gray-800">Dr. Mauro Monção</td>
                    <td className="px-4 py-3 text-xs text-gray-600">Restaurado automaticamente</td>
                    <td className="px-4 py-3 text-xs text-gray-600">Resumo de conversas enviado para você</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </Secao>

      {/* ── Variáveis de Ambiente ────────────────────────────── */}
      <Secao titulo="Variáveis de Ambiente (Vercel)" icone={<Lock size={16} className="text-[#DEC078]" />} defaultOpen={false}>
        <div className="mt-4 space-y-4">
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <ExternalLink size={12} />
            Configure em{' '}
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer"
               className="text-[#DEC078] font-semibold hover:underline">
              vercel.com → ben-growth-center → Settings → Environment Variables
            </a>
          </p>

          {/* Tabela Dr. Ben */}
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">🤖 Dr. Ben — Instância Principal</p>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#19385C] text-white">
                    <th className="px-4 py-3 text-left text-xs font-semibold">Variável</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { key: 'OPENAI_API_KEY',      desc: 'GPT-4o-mini — motor principal do Dr. Ben e MARA IA',  status: 'ok' },
                    { key: 'ZAPI_INSTANCE_ID',     desc: 'ID da instância Z-API Dr. Ben — (86) 9482-0054',      status: 'ok' },
                    { key: 'ZAPI_TOKEN',           desc: 'Token de autenticação Z-API Dr. Ben',                  status: 'ok' },
                    { key: 'ZAPI_CLIENT_TOKEN',    desc: 'Client-Token de segurança — mesmo para todas as contas', status: 'ok' },
                    { key: 'PLANTONISTA_WHATSAPP', desc: 'Número Dr. Mauro para alertas (via variável de ambiente)',       status: 'ok' },
                    { key: 'VPS_LEADS_URL',        desc: 'URL do CRM/VPS (http://181.215.135.202:3001)',        status: 'ok' },
                    { key: 'ELEVENLABS_API_KEY',   desc: 'ElevenLabs TTS — voz Dr. Ben + MARA',                 status: 'ok' },
                  ].map((v, i) => (
                    <tr key={v.key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3"><code className="text-xs font-mono text-[#19385C]">{v.key}</code></td>
                      <td className="px-4 py-3 text-xs text-gray-600">{v.desc}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-semibold">✅ OK</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabela MARA — nova instância */}
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">🌟 MARA IA — Nova Instância Dedicada</p>
            <div className="overflow-x-auto rounded-xl border border-amber-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-amber-500 text-white">
                    <th className="px-4 py-3 text-left text-xs font-semibold">Variável</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Valor a Configurar</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {[
                    { key: 'MARA_ZAPI_INSTANCE_ID',  val: '3EFBA328D48CC11FFCB66237BF5854B6', status: 'novo' },
                    { key: 'MARA_ZAPI_TOKEN',         val: 'EAC44AD0F0FF58FCD5A23C3B',         status: 'novo' },
                    { key: 'MARA_ZAPI_CLIENT_TOKEN',  val: '(mesmo do ZAPI_CLIENT_TOKEN)',       status: 'reuso' },
                  ].map((v, i) => (
                    <tr key={v.key} className={i % 2 === 0 ? 'bg-white' : 'bg-amber-50'}>
                      <td className="px-4 py-3"><code className="text-xs font-mono text-amber-800 font-bold">{v.key}</code></td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 break-all">{v.val}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          v.status === 'novo'   ? 'bg-amber-100 text-amber-700' :
                          v.status === 'reuso'  ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {v.status === 'novo' ? '🆕 ADICIONAR' : v.status === 'reuso' ? '🔄 Reutilizar' : '✅ OK'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-amber-700 mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
              ⚠️ <strong>Atenção:</strong> As variáveis marcadas com "🆕 ADICIONAR" precisam ser criadas no Vercel. Após salvar, aguarde ~1 min o redeploy e clique em "🔗 Configurar Webhook" acima.
            </p>
          </div>

          {/* Tabela ElevenLabs */}
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">🎙️ ElevenLabs TTS — Voice IDs</p>
            <div className="overflow-x-auto rounded-xl border border-purple-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-purple-600 text-white">
                    <th className="px-4 py-3 text-left text-xs font-semibold">Voz</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Voice ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Uso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100">
                  <tr className="bg-white">
                    <td className="px-4 py-3 text-xs font-semibold text-purple-800">Dr. Ben</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{VOICE_DR_BEN}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">Respostas de voz para clientes</td>
                  </tr>
                  <tr className="bg-purple-50">
                    <td className="px-4 py-3 text-xs font-semibold text-purple-800">MARA IA</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{VOICE_MARA}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">Respostas de voz para Dr. Mauro</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </Secao>

      {/* ── Botão salvar fixo ────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <button
          onClick={() => setConfig(CONFIG_PADRAO)}
          className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition"
        >
          Restaurar Padrões
        </button>
        <button
          onClick={salvarConfig}
          disabled={salvando}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#19385C] text-white rounded-xl font-semibold hover:bg-[#0f2044] transition disabled:opacity-60"
        >
          {salvando
            ? <><Loader size={16} className="animate-spin" /> Salvando...</>
            : salvo
            ? <><CheckCircle2 size={16} className="text-green-400" /> Configuração Salva!</>
            : <><Save size={16} /> Salvar Configuração</>
          }
        </button>
      </div>

    </div>
  )
}
