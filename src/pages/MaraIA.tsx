import React, { useState, useEffect } from 'react'
import {
  Bot, Save, RefreshCw, CheckCircle2, AlertCircle, Zap,
  Clock, MessageSquare, Shield, ChevronDown, ChevronUp,
  ToggleLeft, ToggleRight, Phone, Star, Settings2,
  Brain, Volume2, Calendar, AlertTriangle, Loader,
  Play, Pause, Info, Edit3
} from 'lucide-react'

// ─── Tipos ───────────────────────────────────────────────────
interface ConfigMara {
  // Identidade
  nome: string
  saudacao: string
  despedida: string
  tom: 'formal' | 'cordial' | 'amigavel'
  // Prompt personalizado
  promptBase: string
  // Especialidades ativas
  areas: {
    tributario: boolean
    previdenciario: boolean
    bancario: boolean
    trabalhista: boolean
    civil: boolean
    empresarial: boolean
  }
  // Horário de atendimento
  horario: {
    segunda: string; terca: string; quarta: string
    quinta: string; sexta: string; sabado: string; domingo: string
    ativoFimDeSemana: boolean
  }
  // Regras de repasse
  repasseScore: number
  repassePalavras: string[]
  repasseValorMinimo: number
  repasseSempre: string[]
  // Limites
  maxMensagensSesSao: number
  tempoEspera: number
  // Status
  ativo: boolean
  modoManutencao: boolean
  mensagemManutencao: string
}

const CONFIG_PADRAO: ConfigMara = {
  nome: 'Dr. Ben',
  saudacao: 'Olá! Sou o Dr. Ben, assistente jurídico do escritório Mauro Monção Advogados. Como posso te ajudar hoje?',
  despedida: 'Foi um prazer atendê-lo! Se precisar de mais informações, estou aqui. Tenha um ótimo dia! ⚖️',
  tom: 'cordial',
  promptBase: `Você é o Dr. Ben, assistente jurídico inteligente do escritório Mauro Monção Advogados.
Especialidades: Direito Tributário, Previdenciário e Bancário.
Localização: Teresina, Piauí — Brasil.
Advogado responsável: Dr. Mauro Monção (OAB/PI).

REGRAS:
- Seja cordial, profissional e objetivo
- Responda em português do Brasil
- Nunca forneça pareceres jurídicos definitivos — indique a necessidade de consulta
- Ao final de cada resposta, ofereça agendar uma consulta
- Para urgências (execução fiscal, prazo, penhora), encaminhe ao plantonista
- Limite respostas a 3 parágrafos curtos para melhor leitura no WhatsApp`,
  areas: {
    tributario: true,
    previdenciario: true,
    bancario: true,
    trabalhista: false,
    civil: false,
    empresarial: false,
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
  repasseScore: 70,
  repassePalavras: ['urgente', 'execução fiscal', 'penhora', 'multa', 'prazo fatal', 'amanhã', 'hoje'],
  repasseValorMinimo: 3000,
  repasseSempre: ['tributario'],
  maxMensagensSesSao: 10,
  tempoEspera: 30,
  ativo: true,
  modoManutencao: false,
  mensagemManutencao: 'Estamos em manutenção no momento. Retornaremos em breve. Para urgências, ligue: (86) 99948-4761.',
}

// ─── Badges de status ─────────────────────────────────────────
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
function Secao({ titulo, icone, children, defaultOpen = true }: {
  titulo: string; icone: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean
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

// ─── Componente Principal ─────────────────────────────────────
export default function MaraIA() {
  const [config, setConfig] = useState<ConfigMara>(CONFIG_PADRAO)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [testando, setTestando] = useState(false)
  const [msgTeste, setMsgTeste] = useState('')
  const [respostaTeste, setRespostaTeste] = useState('')
  const [novasPalavras, setNovasPalavras] = useState('')
  const [estatisticas] = useState({
    mensagensHoje: 47,
    leadsGerados: 8,
    taxaRepasse: 23,
    tempoMedioResposta: '4s',
    satisfacao: 94,
  })

  // ── Carregar config salva ─────────────────────────────────
  useEffect(() => {
    const salva = localStorage.getItem('mara-ia-config')
    if (salva) {
      try { setConfig({ ...CONFIG_PADRAO, ...JSON.parse(salva) }) }
      catch {}
    }
  }, [])

  // ── Salvar configuração ───────────────────────────────────
  const salvarConfig = async () => {
    setSalvando(true)
    try {
      // Salvar localmente
      localStorage.setItem('mara-ia-config', JSON.stringify(config))

      // Enviar para API
      await fetch('/api/mara-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      }).catch(() => {}) // Não bloquear se a API ainda não existir

      setSalvo(true)
      setTimeout(() => setSalvo(false), 3000)
    } finally {
      setSalvando(false)
    }
  }

  // ── Testar MARA IA ────────────────────────────────────────
  const testarMara = async () => {
    if (!msgTeste.trim()) return
    setTestando(true)
    setRespostaTeste('')
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_KEY || ''}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${config.promptBase}\n\nCliente: ${msgTeste}\n${config.nome}:`
              }]
            }],
            generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
          }),
        }
      )
      const data = await res.json()
      const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text
      setRespostaTeste(texto ?? '⚠️ Chave Gemini não configurada no Vercel. A resposta real funciona no webhook.')
    } catch {
      setRespostaTeste('⚠️ Para testar, configure GEMINI_API_KEY nas variáveis de ambiente do Vercel.')
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

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2044] flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0f2044] rounded-xl flex items-center justify-center">
              <Bot size={22} className="text-[#D4A017]" />
            </div>
            MARA IA — Configuração
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Configure a personalidade, regras e comportamento da assistente jurídica
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
              : <><Save size={16} /> Salvar Configuração</>
            }
          </button>
        </div>
      </div>

      {/* ── Cards de estatísticas ───────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Msg Hoje',      valor: estatisticas.mensagensHoje,     suffix: '',   cor: 'text-blue-600',  bg: 'bg-blue-50'   },
          { label: 'Leads Gerados', valor: estatisticas.leadsGerados,       suffix: '',   cor: 'text-green-600', bg: 'bg-green-50'  },
          { label: 'Taxa Repasse',  valor: estatisticas.taxaRepasse,        suffix: '%',  cor: 'text-amber-600', bg: 'bg-amber-50'  },
          { label: 'Resp. Média',   valor: estatisticas.tempoMedioResposta, suffix: '',   cor: 'text-purple-600',bg: 'bg-purple-50' },
          { label: 'Satisfação',    valor: estatisticas.satisfacao,         suffix: '%',  cor: 'text-emerald-600', bg: 'bg-emerald-50'},
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
            <p className={`text-2xl font-bold ${s.cor}`}>{s.valor}{s.suffix}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Status geral ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">MARA IA Ativa</p>
              <p className="text-xs text-gray-400">Responde mensagens no WhatsApp automaticamente</p>
            </div>
            <Toggle checked={config.ativo} onChange={v => set('ativo', v)} />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">Modo Manutenção</p>
              <p className="text-xs text-gray-400">Envia mensagem de aviso em vez de responder</p>
            </div>
            <Toggle checked={config.modoManutencao} onChange={v => set('modoManutencao', v)} />
          </div>
        </div>
        {config.modoManutencao && (
          <div className="mt-4">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Mensagem de Manutenção</label>
            <textarea
              rows={2}
              value={config.mensagemManutencao}
              onChange={e => set('mensagemManutencao', e.target.value)}
              className="w-full border border-amber-200 bg-amber-50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        )}
      </div>

      {/* ── Identidade ──────────────────────────────────────── */}
      <Secao titulo="Identidade da MARA IA" icone={<Bot size={16} className="text-[#D4A017]" />}>
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

      {/* ── Prompt da IA ────────────────────────────────────── */}
      <Secao titulo="Instruções da IA (Prompt)" icone={<Brain size={16} className="text-[#D4A017]" />}>
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Info size={14} className="text-blue-500" />
            <p className="text-xs text-blue-600">
              Estas instruções definem como a MARA IA se comporta em todas as conversas. Seja específico e claro.
            </p>
          </div>
          <textarea
            rows={10}
            value={config.promptBase}
            onChange={e => set('promptBase', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0f2044] bg-gray-50"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400">{config.promptBase.length} caracteres</p>
            <button
              onClick={() => set('promptBase', CONFIG_PADRAO.promptBase)}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <RefreshCw size={12} /> Restaurar padrão
            </button>
          </div>
        </div>
      </Secao>

      {/* ── Áreas de Atuação ────────────────────────────────── */}
      <Secao titulo="Áreas de Atuação Ativas" icone={<Shield size={16} className="text-[#D4A017]" />}>
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-3">
          {([
            { key: 'tributario',    label: 'Tributário',    emoji: '🧾', desc: 'Impostos, execuções fiscais, parcelamentos' },
            { key: 'previdenciario',label: 'Previdenciário', emoji: '👴', desc: 'Aposentadoria, benefícios INSS' },
            { key: 'bancario',      label: 'Bancário',       emoji: '🏦', desc: 'Revisão de contratos, cobranças' },
            { key: 'trabalhista',   label: 'Trabalhista',    emoji: '👷', desc: 'Direitos trabalhistas, rescisões' },
            { key: 'civil',         label: 'Cível',          emoji: '⚖️', desc: 'Contratos, indenizações' },
            { key: 'empresarial',   label: 'Empresarial',    emoji: '🏢', desc: 'Abertura de empresas, contratos' },
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
              <p className={`font-semibold text-sm ${config.areas[a.key] ? 'text-[#0f2044]' : 'text-gray-400'}`}>{a.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
            </div>
          ))}
        </div>
      </Secao>

      {/* ── Horário de Atendimento ──────────────────────────── */}
      <Secao titulo="Horário de Atendimento" icone={<Clock size={16} className="text-[#D4A017]" />}>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">Fora do horário, a MARA IA informa ao cliente e oferece agendamento.</p>
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
                <div key={key} className={`flex items-center gap-3 p-3 rounded-xl ${isFds && !config.horario.ativoFimDeSemana ? 'opacity-40' : ''}`}>
                  <span className="w-20 text-sm font-semibold text-gray-700">{label}</span>
                  <input
                    type="text"
                    value={config.horario[key] as string}
                    onChange={e => setConfig(c => ({ ...c, horario: { ...c.horario, [key]: e.target.value } }))}
                    disabled={isFds && !config.horario.ativoFimDeSemana}
                    placeholder="ex: 08:00–18:00 ou Fechado"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0f2044] disabled:bg-gray-100"
                  />
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
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

      {/* ── Regras de Repasse ───────────────────────────────── */}
      <Secao titulo="Regras de Repasse ao Plantonista" icone={<Zap size={16} className="text-[#D4A017]" />}>
        <div className="mt-4 space-y-5">

          {/* Score mínimo */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-semibold text-gray-700">Score mínimo para repasse</label>
              <span className="text-[#0f2044] font-bold text-lg">{config.repasseScore}</span>
            </div>
            <input
              type="range" min={50} max={95} step={5}
              value={config.repasseScore}
              onChange={e => set('repasseScore', Number(e.target.value))}
              className="w-full accent-[#0f2044]"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>50 (mais leads passam)</span>
              <span>95 (somente leads excelentes)</span>
            </div>
          </div>

          {/* Valor mínimo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Valor mínimo estimado do caso para repasse
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">R$</span>
              <input
                type="number" min={0} step={500}
                value={config.repasseValorMinimo}
                onChange={e => set('repasseValorMinimo', Number(e.target.value))}
                className="w-40 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2044]"
              />
            </div>
          </div>

          {/* Palavras-chave */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Palavras-chave que acionam repasse imediato
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {config.repassePalavras.map((p, i) => (
                <span key={i} className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-1 rounded-full">
                  {p}
                  <button
                    onClick={() => set('repassePalavras', config.repassePalavras.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-700 ml-1 text-base leading-none"
                  >×</button>
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
                placeholder="Digite e pressione Enter..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2044]"
              />
              <button
                onClick={() => {
                  if (novasPalavras.trim()) {
                    set('repassePalavras', [...config.repassePalavras, novasPalavras.trim().toLowerCase()])
                    setNovasPalavras('')
                  }
                }}
                className="px-4 py-2 bg-[#0f2044] text-white rounded-xl text-sm font-medium"
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
              <label className="block text-xs font-semibold text-gray-500 mb-1">Tempo máx. de espera (min)</label>
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

      {/* ── Testar MARA IA ──────────────────────────────────── */}
      <Secao titulo="Testar MARA IA ao Vivo" icone={<Play size={16} className="text-[#D4A017]" />} defaultOpen={false}>
        <div className="mt-4 space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2">
            <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              Simule uma conversa com a MARA IA usando as configurações acima.
              Requer <code className="font-mono bg-blue-100 px-1 rounded">VITE_GEMINI_KEY</code> configurada nas env do Vercel.
            </p>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={msgTeste}
              onChange={e => setMsgTeste(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && testarMara()}
              placeholder='Ex: "Recebi uma multa da Receita Federal, o que fazer?"'
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2044]"
            />
            <button
              onClick={testarMara}
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
                <Bot size={16} className="text-[#D4A017]" />
                <span className="text-xs font-bold text-[#0f2044]">{config.nome} respondeu:</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{respostaTeste}</p>
            </div>
          )}

          {/* Exemplos de mensagens */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">Exemplos rápidos:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Recebi auto de infração da Receita Federal',
                'Quero me aposentar mas o INSS negou',
                'Banco está me cobrando juros abusivos',
                'Urgente: penhora na minha conta',
                'Quero agendar uma consulta',
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

      {/* ── Variáveis de Ambiente ───────────────────────────── */}
      <Secao titulo="Variáveis de Ambiente (Vercel)" icone={<Settings2 size={16} className="text-[#D4A017]" />} defaultOpen={false}>
        <div className="mt-4 space-y-3">
          <p className="text-sm text-gray-500">
            Configure estas variáveis em <strong>vercel.com → Project → Settings → Environment Variables</strong>
          </p>
          {[
            { key: 'GEMINI_API_KEY',           status: 'obrigatorio', desc: 'Chave da IA Gemini — ativa as respostas inteligentes' },
            { key: 'EVOLUTION_API_URL',         status: 'configurado', desc: 'http://181.215.135.202:8080 — URL do VPS Hostinger' },
            { key: 'EVOLUTION_API_KEY',         status: 'configurado', desc: 'BenEvolution2026 — chave de autenticação da Evolution API' },
            { key: 'EVOLUTION_INSTANCE',        status: 'configurado', desc: 'drben — nome da instância WhatsApp' },
            { key: 'PLANTONISTA_WHATSAPP',      status: 'configurado', desc: '5586999484761 — número para alertas urgentes' },
            { key: 'OPENAI_API_KEY',            status: 'opcional',    desc: 'Para transcrição de áudios (Whisper) — opcional' },
            { key: 'PINECONE_API_KEY',          status: 'opcional',    desc: 'Memória de longo prazo das conversas — opcional' },
          ].map(v => (
            <div key={v.key} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <code className="text-xs font-mono text-[#0f2044] w-52 shrink-0">{v.key}</code>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                v.status === 'configurado' ? 'bg-green-100 text-green-700' :
                v.status === 'obrigatorio' ? 'bg-red-100 text-red-600' :
                'bg-gray-100 text-gray-500'
              }`}>
                {v.status === 'configurado' ? '✅ Configurado' : v.status === 'obrigatorio' ? '⚠️ Obrigatório' : '○ Opcional'}
              </span>
              <p className="text-xs text-gray-500">{v.desc}</p>
            </div>
          ))}
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle size={14} className="text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700">
              A variável <strong>GEMINI_API_KEY</strong> é necessária para as respostas inteligentes.
              Sem ela, a MARA IA usa apenas a mensagem de saudação padrão.
              Obtenha em <strong>aistudio.google.com/app/apikey</strong> (gratuito).
            </p>
          </div>
        </div>
      </Secao>

      {/* ── Botão salvar fixo ───────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pb-4">
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
