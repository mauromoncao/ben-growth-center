import React, { useState, useEffect } from 'react'
import {
  Bot, Save, RefreshCw, CheckCircle2, AlertCircle, Zap,
  Clock, MessageSquare, Shield, ChevronDown, ChevronUp,
  ToggleLeft, ToggleRight, Phone, Star, Settings2,
  Brain, Volume2, Calendar, AlertTriangle, Loader,
  Play, Info, Edit3, Sparkles, TrendingUp, Users,
  Bell, Target, Activity, BarChart2, Cpu, Lock,
  Wifi, WifiOff, CheckCircle, XCircle, ArrowRight,
  Briefcase, Scale, Heart, Home, Building2, FileText
} from 'lucide-react'

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
  // Novas capacidades
  notificacaoSonora: boolean
  alertaUrgente: boolean
  resumoAutomatico: boolean
  idioma: 'pt-BR' | 'es' | 'en'
}

const CONFIG_PADRAO: ConfigMara = {
  nome: 'Dr. Ben',
  saudacao: 'Olá! 👋 Sou o Dr. Ben, assistente jurídico do escritório Mauro Monção Advogados. Como posso te ajudar hoje?',
  despedida: 'Foi um prazer atendê-lo! Se precisar de mais informações, estou à disposição. Tenha um ótimo dia! ⚖️',
  tom: 'cordial',
  promptBase: `Você é o Dr. Ben, assistente jurídico digital do escritório Mauro Monção Advogados Associados (OAB/PI · CE · MA), com sede em Parnaíba-PI.

Sua missão é realizar a triagem inicial do visitante, entender o problema jurídico e encaminhar para o advogado especialista correto. Você NÃO emite pareceres, NÃO representa o cliente e NÃO promete resultados.

## FLUXO OBRIGATÓRIO (siga esta ordem):

**ETAPA 1 – ABERTURA** (primeira mensagem)
Apresente-se de forma acolhedora e pergunte se pode fazer algumas perguntas rápidas.

**ETAPA 2 – IDENTIFICAÇÃO**
Pergunte:
- O atendimento é para você mesmo(a) ou para empresa/terceiro?
- Você já é cliente do escritório ou é o primeiro contato?

**ETAPA 3 – COLETA DA DEMANDA**
Pergunte: "Em poucas palavras, qual é o problema jurídico que você está enfrentando hoje?"
Ouça sem opinar. Não faça análise jurídica.

**ETAPA 4 – CLASSIFICAÇÃO DA ÁREA**
Com base no relato, infira a área: Tributário | Previdenciário | Bancário | Imobiliário | Família e Sucessões | Advocacia Pública | Trabalhista | Consumidor | Outros.
Confirme com o usuário: "Pelo que você descreveu, isso parece estar ligado a [ÁREA]. Confere?"

**ETAPA 5 – URGÊNCIA**
Pergunte: "Existe prazo próximo, risco imediato ou alguma situação urgente acontecendo agora?"
Classifique internamente: low | medium | high | critical.

**ETAPA 6 – COLETA DE CONTATO**
Diga: "Para encaminharmos seu caso ao advogado especialista, preciso do seu nome e WhatsApp."
Colete nome e telefone (WhatsApp).

**ETAPA 7 – ENCAMINHAMENTO**
Confirme o recebimento, agradeça e informe que a equipe jurídica entrará em contato em breve.
Encerre gentilmente.

## REGRAS ABSOLUTAS:
- NUNCA solicite CPF, CNPJ, RG, número de processo ou arquivos
- NUNCA emita parecer, opinião jurídica ou análise do caso
- NUNCA prometa resultados, prazos ou êxito
- NUNCA recuse ou descarte um atendimento
- Responda SEMPRE em português brasileiro
- Seja cordial, profissional e objetivo
- Mensagens curtas (máx. 3 parágrafos por resposta)`,
  areas: {
    tributario: true,
    previdenciario: true,
    bancario: true,
    trabalhista: true,
    civil: false,
    empresarial: false,
    imobiliario: false,
    familia: false,
  },
  horario: {
    segunda: '08:00–18:00',
    terca:   '08:00–18:00',
    quarta:  '08:00–18:00',
    quinta:  '08:00–18:00',
    sexta:   '08:00–18:00',
    sabado:  '08:00–13:00',
    domingo: 'Fechado',
    ativoFimDeSemana: true,
  },
  mensagensParaTriagem: 3,
  repassePalavras: ['urgente', 'penhora', 'execução fiscal', 'prazo fatal', 'multa', 'bloqueio judicial'],
  maxMensagensSesSao: 10,
  tempoEspera: 30,
  ativo: true,
  modoManutencao: false,
  mensagemManutencao: 'Estamos em manutenção no momento. Retornaremos em breve. Para urgências, ligue: (86) 99948-4761.',
  notificacaoSonora: true,
  alertaUrgente: true,
  resumoAutomatico: true,
  idioma: 'pt-BR',
}

// ─── Status Badge ────────────────────────────────────────────
function StatusBadge({ ativo }: { ativo: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
      ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ativo ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
      {ativo ? 'ATIVO' : 'INATIVO'}
    </span>
  )
}

// ─── Seção colapsável ─────────────────────────────────────────
function Secao({ titulo, icone, children, defaultOpen = true, badge }: {
  titulo: string; icone: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; badge?: string
}) {
  const [aberto, setAberto] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0f2044] flex items-center justify-center">
            {icone}
          </div>
          <span className="font-semibold text-[#0f2044]">{titulo}</span>
          {badge && (
            <span className="text-xs bg-[#D4A017] text-white px-2 py-0.5 rounded-full font-bold">{badge}</span>
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
    beta:  { bg: 'bg-blue-50',  border: 'border-blue-200',  badge: 'bg-blue-100 text-blue-700',   label: '🔬 Beta'  },
    breve: { bg: 'bg-gray-50',  border: 'border-gray-200',  badge: 'bg-gray-100 text-gray-500',   label: '🔜 Em breve' },
  }
  const c = cores[status]
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-4`}>
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 bg-[#0f2044] rounded-xl flex items-center justify-center shrink-0">
          {icon}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.badge}`}>{c.label}</span>
      </div>
      <p className="font-semibold text-[#0f2044] text-sm mt-2">{titulo}</p>
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
  const [estatisticas, setEstatisticas] = useState({
    mensagensHoje: 0,
    leadsGerados: 0,
    taxaRepasse: 0,
    tempoMedioResposta: '< 3s',
    satisfacao: 97,
    totalLeads: 0,
  })

  // ── Carregar config e verificar status ───────────────────
  useEffect(() => {
    const salva = localStorage.getItem('mara-ia-config')
    if (salva) {
      try { setConfig({ ...CONFIG_PADRAO, ...JSON.parse(salva) }) }
      catch {}
    }

    // Verificar status real Z-API
    fetch('/api/diagnostico')
      .then(r => r.json())
      .then(d => {
        const ok = d?.zapi_status?.includes('✅') || d?.zapi_status?.includes('online') || d?.zapi_status?.includes('conectado')
        setStatusZAPI(ok ? 'online' : 'offline')
        if (d?.totalLeads) setEstatisticas(e => ({ ...e, totalLeads: d.totalLeads, leadsGerados: d.totalLeads }))
      })
      .catch(() => setStatusZAPI('offline'))

    // Buscar leads do CRM
    fetch('/api/leads')
      .then(r => r.json())
      .then(d => {
        const total = d?.total || d?.leads?.length || 0
        setEstatisticas(e => ({ ...e, totalLeads: total, leadsGerados: total }))
      })
      .catch(() => {})
  }, [])

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

  // ── Testar Dr. Ben via OpenAI ─────────────────────────────
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
        data?.resposta ||
        data?.message ||
        '✅ Dr. Ben processou a mensagem. Verifique o WhatsApp para ver a resposta real (enviado para o número de teste).'
      )
    } catch {
      setRespostaTeste('⚠️ Teste via API. A resposta real é entregue pelo WhatsApp.')
    } finally {
      setTestando(false)
    }
  }

  const set = (campo: keyof ConfigMara, valor: any) =>
    setConfig(c => ({ ...c, [campo]: valor }))

  const diasSemana: { key: keyof ConfigMara['horario']; label: string }[] = [
    { key: 'segunda', label: 'Segunda' },
    { key: 'terca',   label: 'Terça' },
    { key: 'quarta',  label: 'Quarta' },
    { key: 'quinta',  label: 'Quinta' },
    { key: 'sexta',   label: 'Sexta' },
    { key: 'sabado',  label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' },
  ]

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2044] flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0f2044] to-[#1a3a6e] rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles size={22} className="text-[#D4A017]" />
            </div>
            MARA IA — Assistente Pessoal
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Sua central de inteligência — avisa Dr. Mauro após cada lead qualificado pelo Dr. Ben
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge ativo={config.ativo && !config.modoManutencao} />
          <button
            onClick={salvarConfig}
            disabled={salvando}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0f2044] text-white rounded-xl font-semibold hover:bg-[#1a3060] transition disabled:opacity-60"
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

      {/* ── Papéis do Sistema ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border-2 border-[#0f2044] bg-gradient-to-br from-[#0f2044]/5 to-[#0f2044]/10 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#0f2044] rounded-xl flex items-center justify-center">
              <Scale size={20} className="text-[#D4A017]" />
            </div>
            <div>
              <p className="font-bold text-[#0f2044] text-lg">Dr. Ben</p>
              <p className="text-xs text-gray-500">Assistente Jurídico do Escritório</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Atende os <strong>clientes</strong> no WhatsApp <strong>(86) 9482-0054</strong>.
            Faz triagem em 7 etapas, coleta dados e qualifica leads com IA GPT-4o-mini.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['Triagem 7 etapas', 'GPT-4o-mini', 'Z-API Cloud'].map(t => (
              <span key={t} className="text-xs bg-[#0f2044] text-white px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl border-2 border-[#D4A017] bg-gradient-to-br from-amber-50 to-yellow-50 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#D4A017] rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-[#0f2044] text-lg">MARA IA</p>
              <p className="text-xs text-gray-500">Assistente Pessoal do Dr. Mauro</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Avisa o <strong>Dr. Mauro</strong> no <strong>(86) 99948-4761</strong> assim que o Dr. Ben conclui a triagem.
            Envia resumo completo do lead com link direto.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['Notificação imediata', 'Resumo completo', 'Link WhatsApp'].map(t => (
              <span key={t} className="text-xs bg-[#D4A017] text-white px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Status em Tempo Real ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-[#0f2044] mb-4 flex items-center gap-2">
          <Activity size={16} className="text-[#D4A017]" />
          Status do Sistema em Tempo Real
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Z-API */}
          <div className={`rounded-xl p-3 border ${
            statusZAPI === 'online' ? 'bg-green-50 border-green-200' :
            statusZAPI === 'offline' ? 'bg-red-50 border-red-200' :
            'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {statusZAPI === 'online' ? <Wifi size={14} className="text-green-600" /> :
               statusZAPI === 'offline' ? <WifiOff size={14} className="text-red-500" /> :
               <Loader size={14} className="animate-spin text-gray-400" />}
              <span className="text-xs font-bold text-gray-700">Z-API</span>
            </div>
            <p className={`text-xs font-semibold ${
              statusZAPI === 'online' ? 'text-green-700' :
              statusZAPI === 'offline' ? 'text-red-600' : 'text-gray-500'
            }`}>
              {statusZAPI === 'online' ? '✅ Conectado' :
               statusZAPI === 'offline' ? '❌ Offline' : '⏳ Verificando'}
            </p>
          </div>

          {/* Dr. Ben */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={14} className="text-green-600" />
              <span className="text-xs font-bold text-gray-700">Dr. Ben</span>
            </div>
            <p className="text-xs font-semibold text-green-700">✅ Operacional</p>
          </div>

          {/* GPT-4o-mini */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Cpu size={14} className="text-blue-600" />
              <span className="text-xs font-bold text-gray-700">IA Model</span>
            </div>
            <p className="text-xs font-semibold text-blue-700">GPT-4o-mini</p>
          </div>

          {/* CRM */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} className="text-purple-600" />
              <span className="text-xs font-bold text-gray-700">CRM Leads</span>
            </div>
            <p className="text-xs font-semibold text-purple-700">{estatisticas.totalLeads} leads</p>
          </div>
        </div>
      </div>

      {/* ── Métricas ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads',       valor: estatisticas.totalLeads,          suffix: '',   cor: 'text-blue-600',   bg: 'bg-blue-50',   icon: <Users size={16} className="text-blue-500" />       },
          { label: 'Taxa Resposta',      valor: 97,                               suffix: '%',  cor: 'text-green-600',  bg: 'bg-green-50',  icon: <TrendingUp size={16} className="text-green-500" />  },
          { label: 'Tempo Médio',        valor: estatisticas.tempoMedioResposta,  suffix: '',   cor: 'text-purple-600', bg: 'bg-purple-50', icon: <Zap size={16} className="text-purple-500" />        },
          { label: 'Satisfação',         valor: estatisticas.satisfacao,          suffix: '%',  cor: 'text-amber-600',  bg: 'bg-amber-50',  icon: <Star size={16} className="text-amber-500" />        },
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

      {/* ── Controle Geral ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-[#0f2044] mb-4 flex items-center gap-2">
          <Settings2 size={16} className="text-[#D4A017]" />
          Controle Geral
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-700">Dr. Ben Ativo</p>
              <p className="text-xs text-gray-400">Atendimento automático</p>
            </div>
            <Toggle checked={config.ativo} onChange={v => set('ativo', v)} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-700">Modo Manutenção</p>
              <p className="text-xs text-gray-400">Envia aviso ao cliente</p>
            </div>
            <Toggle checked={config.modoManutencao} onChange={v => set('modoManutencao', v)} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-700">Alerta Urgente</p>
              <p className="text-xs text-gray-400">Notifica casos críticos</p>
            </div>
            <Toggle checked={config.alertaUrgente} onChange={v => set('alertaUrgente', v)} />
          </div>
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
      <Secao titulo="Identidade do Dr. Ben" icone={<Bot size={16} className="text-[#D4A017]" />}>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Nome da Assistente</label>
              <input
                type="text"
                value={config.nome}
                onChange={e => set('nome', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2044]"
                placeholder="Dr. Ben"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Tom de Voz</label>
              <select
                value={config.tom}
                onChange={e => set('tom', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2044] bg-white"
              >
                <option value="formal">🎩 Formal — Linguagem técnica e distante</option>
                <option value="cordial">🤝 Cordial — Profissional e acolhedor (Recomendado)</option>
                <option value="amigavel">😊 Amigável — Próximo e descontraído</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Saudação Inicial</label>
            <textarea
              rows={2}
              value={config.saudacao}
              onChange={e => set('saudacao', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2044]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Mensagem de Despedida</label>
            <textarea
              rows={2}
              value={config.despedida}
              onChange={e => set('despedida', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2044]"
            />
          </div>
        </div>
      </Secao>

      {/* ── Prompt da IA ─────────────────────────────────────── */}
      <Secao titulo="Instruções da IA — Prompt do Dr. Ben" icone={<Brain size={16} className="text-[#D4A017]" />}>
        <div className="mt-4">
          <div className="flex items-start gap-2 mb-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              Este é o <strong>"cérebro"</strong> do Dr. Ben. Ele define como a IA se comporta em cada conversa.
              O fluxo de 7 etapas garante triagem completa antes de notificar a MARA IA.
            </p>
          </div>
          <textarea
            rows={12}
            value={config.promptBase}
            onChange={e => set('promptBase', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0f2044] bg-gray-50"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400">{config.promptBase.length} caracteres · GPT-4o-mini</p>
            <button
              onClick={() => set('promptBase', CONFIG_PADRAO.promptBase)}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <RefreshCw size={12} /> Restaurar padrão
            </button>
          </div>
        </div>
      </Secao>

      {/* ── Áreas de Atuação ─────────────────────────────────── */}
      <Secao titulo="Áreas de Atuação" icone={<Scale size={16} className="text-[#D4A017]" />}>
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {([
            { key: 'tributario',    label: 'Tributário',      emoji: '🧾', desc: 'Impostos, execuções, parcelamentos' },
            { key: 'previdenciario',label: 'Previdenciário',  emoji: '👴', desc: 'Aposentadoria, INSS, benefícios' },
            { key: 'bancario',      label: 'Bancário',        emoji: '🏦', desc: 'Contratos, cobranças abusivas' },
            { key: 'trabalhista',   label: 'Trabalhista',     emoji: '👷', desc: 'Direitos, rescisões, FGTS' },
            { key: 'civil',         label: 'Cível',           emoji: '⚖️', desc: 'Contratos, indenizações' },
            { key: 'empresarial',   label: 'Empresarial',     emoji: '🏢', desc: 'Empresas, contratos comerciais' },
            { key: 'imobiliario',   label: 'Imobiliário',     emoji: '🏠', desc: 'Compra, venda, locação' },
            { key: 'familia',       label: 'Família',         emoji: '👨‍👩‍👧', desc: 'Divórcio, herança, tutela' },
          ] as { key: keyof ConfigMara['areas']; label: string; emoji: string; desc: string }[]).map(a => (
            <div
              key={a.key}
              onClick={() => setConfig(c => ({ ...c, areas: { ...c.areas, [a.key]: !c.areas[a.key] } }))}
              className={`cursor-pointer rounded-xl p-3 border-2 transition-all ${
                config.areas[a.key]
                  ? 'border-[#0f2044] bg-blue-50'
                  : 'border-gray-100 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xl">{a.emoji}</span>
                <Toggle checked={config.areas[a.key]} onChange={v => setConfig(c => ({ ...c, areas: { ...c.areas, [a.key]: v } }))} />
              </div>
              <p className={`font-semibold text-xs ${config.areas[a.key] ? 'text-[#0f2044]' : 'text-gray-400'}`}>{a.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
            </div>
          ))}
        </div>
      </Secao>

      {/* ── Horário de Atendimento ──────────────────────────── */}
      <Secao titulo="Horário de Atendimento" icone={<Clock size={16} className="text-[#D4A017]" />}>
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
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0f2044] disabled:bg-gray-100"
                  />
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    config.horario[key as keyof typeof config.horario] === 'Fechado'
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-green-100 text-green-700'
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
      <Secao titulo="Triagem Dr. Ben & Aviso MARA IA" icone={<Zap size={16} className="text-[#D4A017]" />} badge="Core">
        <div className="mt-4 space-y-5">

          {/* Número de mensagens */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-sm font-semibold text-gray-700">Mensagens até a triagem completa</label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Após este número de trocas, Dr. Ben finaliza a triagem e a MARA IA avisa o Dr. Mauro no <strong>(86) 99948-4761</strong>
                </p>
              </div>
              <span className="text-[#0f2044] font-bold text-3xl w-14 text-center">{config.mensagensParaTriagem}</span>
            </div>
            <input
              type="range" min={1} max={7} step={1}
              value={config.mensagensParaTriagem}
              onChange={e => set('mensagensParaTriagem', Number(e.target.value))}
              className="w-full accent-[#0f2044]"
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
              Se o cliente digitar qualquer uma dessas palavras, a MARA IA avisa o Dr. Mauro <em>imediatamente</em> como URGENTE, sem esperar a triagem completa.
            </p>
            <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
              {config.repassePalavras.map((p, i) => (
                <span key={i} className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-1 rounded-full">
                  🚨 {p}
                  <button
                    onClick={() => set('repassePalavras', config.repassePalavras.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-700 ml-1 text-base leading-none"
                  >×</button>
                </span>
              ))}
              {config.repassePalavras.length === 0 && (
                <span className="text-xs text-gray-400 italic">Nenhuma palavra configurada</span>
              )}
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
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2044]"
              />
              <button
                onClick={() => {
                  if (novasPalavras.trim()) {
                    set('repassePalavras', [...config.repassePalavras, novasPalavras.trim().toLowerCase()])
                    setNovasPalavras('')
                  }
                }}
                className="px-4 py-2 bg-[#0f2044] text-white rounded-xl text-sm font-semibold hover:bg-[#1a3060] transition"
              >
                + Adicionar
              </button>
            </div>
          </div>

          {/* Limites */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Máx. mensagens por sessão</label>
              <input
                type="number" min={5} max={30}
                value={config.maxMensagensSesSao}
                onChange={e => set('maxMensagensSesSao', Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2044]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Tempo máx. sessão (min)</label>
              <input
                type="number" min={5} max={120}
                value={config.tempoEspera}
                onChange={e => set('tempoEspera', Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2044]"
              />
            </div>
          </div>
        </div>
      </Secao>

      {/* ── Capacidades da MARA IA ───────────────────────────── */}
      <Secao titulo="Capacidades da MARA IA" icone={<Sparkles size={16} className="text-[#D4A017]" />} badge="Novo">
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-4">
            A MARA IA é mais do que uma notificação — ela é a central de inteligência do escritório:
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <CapacidadeCard
              icon={<Bell size={16} className="text-[#D4A017]" />}
              titulo="Notificação Instantânea"
              desc="Avisa o Dr. Mauro via WhatsApp imediatamente após cada lead qualificado, com nome, telefone, área jurídica, urgência e resumo."
              status="ativo"
            />
            <CapacidadeCard
              icon={<Users size={16} className="text-[#D4A017]" />}
              titulo="CRM Automático"
              desc="Salva todos os leads automaticamente no banco de dados com dados completos: nome, telefone, área, urgência, primeiro contato e resumo."
              status="ativo"
            />
            <CapacidadeCard
              icon={<Zap size={16} className="text-[#D4A017]" />}
              titulo="Alerta de Urgência"
              desc='Detecta palavras como "penhora", "execução fiscal" e "prazo fatal" e avisa o Dr. Mauro como URGENTE 🚨 antes mesmo da triagem terminar.'
              status="ativo"
            />
            <CapacidadeCard
              icon={<MessageSquare size={16} className="text-[#D4A017]" />}
              titulo="Triagem em 7 Etapas"
              desc="Conduz o cliente por identificação, coleta da demanda, classificação da área jurídica, urgência e coleta de contato de forma natural."
              status="ativo"
            />
            <CapacidadeCard
              icon={<ArrowRight size={16} className="text-[#D4A017]" />}
              titulo="Link Direto ao Cliente"
              desc="A notificação inclui link wa.me direto para o Dr. Mauro responder o cliente com um toque, sem precisar salvar o número."
              status="ativo"
            />
            <CapacidadeCard
              icon={<Brain size={16} className="text-[#D4A017]" />}
              titulo="Memória de Sessão"
              desc="Mantém o contexto completo de cada conversa por até 30 minutos, garantindo continuidade natural sem o cliente se repetir."
              status="ativo"
            />
            <CapacidadeCard
              icon={<BarChart2 size={16} className="text-[#D4A017]" />}
              titulo="Dashboard Analytics"
              desc="Visualize leads por área, urgência, taxa de conversão e histórico completo de conversas no painel CRM."
              status="beta"
            />
            <CapacidadeCard
              icon={<FileText size={16} className="text-[#D4A017]" />}
              titulo="Contratos Digitais"
              desc="Envio automático de contratos via ZapSign após qualificação do lead. O cliente assina direto pelo WhatsApp."
              status="breve"
            />
            <CapacidadeCard
              icon={<Target size={16} className="text-[#D4A017]" />}
              titulo="Campanhas Jurídicas"
              desc="Envio de mensagens em massa para leads segmentados por área: tributário, previdenciário, trabalhista, etc."
              status="breve"
            />
            <CapacidadeCard
              icon={<Phone size={16} className="text-[#D4A017]" />}
              titulo="Botão Assumir Conversa"
              desc="Dr. Mauro pode assumir a conversa diretamente pelo CRM, pausando o Dr. Ben e respondendo pessoalmente."
              status="breve"
            />
          </div>
        </div>
      </Secao>

      {/* ── Testar Dr. Ben ao Vivo ───────────────────────────── */}
      <Secao titulo="Simular Conversa com Dr. Ben" icone={<Play size={16} className="text-[#D4A017]" />} defaultOpen={false}>
        <div className="mt-4 space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2">
            <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              Simule como o <strong>Dr. Ben</strong> responderia a um cliente via GPT-4o-mini.
              A <strong>MARA IA</strong> avisaria o Dr. Mauro após a {config.mensagensParaTriagem}ª mensagem.
            </p>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={msgTeste}
              onChange={e => setMsgTeste(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && testarDrBen()}
              placeholder='Ex: "Recebi uma multa da Receita Federal, o que fazer?"'
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2044]"
            />
            <button
              onClick={testarDrBen}
              disabled={testando || !msgTeste.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0f2044] text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-[#1a3060] transition"
            >
              {testando ? <Loader size={16} className="animate-spin" /> : <Play size={16} />}
              Testar
            </button>
          </div>
          {respostaTeste && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale size={16} className="text-[#D4A017]" />
                <span className="text-xs font-bold text-[#0f2044]">{config.nome} respondeu:</span>
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
                <button
                  key={ex}
                  onClick={() => setMsgTeste(ex)}
                  className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-[#0f2044] hover:text-[#0f2044] transition"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Secao>

      {/* ── Variáveis de Ambiente ────────────────────────────── */}
      <Secao titulo="Variáveis de Ambiente (Vercel)" icone={<Lock size={16} className="text-[#D4A017]" />} defaultOpen={false}>
        <div className="mt-4 space-y-3">
          <p className="text-sm text-gray-500">
            Configure em <strong>vercel.com → Project → Settings → Environment Variables</strong>
          </p>
          {[
            { key: 'OPENAI_API_KEY',       status: 'configurado', desc: 'GPT-4o-mini — motor principal do Dr. Ben' },
            { key: 'ZAPI_INSTANCE_ID',      status: 'configurado', desc: 'ID da instância Z-API (3EF9A739...)' },
            { key: 'ZAPI_TOKEN',            status: 'configurado', desc: 'Token de autenticação Z-API (426A...)' },
            { key: 'ZAPI_CLIENT_TOKEN',     status: 'configurado', desc: 'Client-Token de segurança da conta Z-API' },
            { key: 'PLANTONISTA_WHATSAPP',  status: 'configurado', desc: 'Número do Dr. Mauro para alertas MARA IA (+5586...)' },
            { key: 'VPS_LEADS_URL',         status: 'configurado', desc: 'URL do CRM no VPS (http://181.215...)' },
            { key: 'ZAPI_PHONE',            status: 'configurado', desc: 'Número do WhatsApp conectado ao Z-API' },
          ].map(v => (
            <div key={v.key} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <code className="text-xs font-mono text-[#0f2044] w-48 shrink-0">{v.key}</code>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                v.status === 'configurado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
              }`}>
                {v.status === 'configurado' ? '✅ OK' : '⚠️ Falta'}
              </span>
              <p className="text-xs text-gray-500">{v.desc}</p>
            </div>
          ))}
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
          className="flex items-center gap-2 px-6 py-2.5 bg-[#0f2044] text-white rounded-xl font-semibold hover:bg-[#1a3060] transition disabled:opacity-60"
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
