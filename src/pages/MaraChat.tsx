// ============================================================
// MARA IA — CHAT PERSONALIZADO
// Interface de chat com avatar flutuante, balões e identidade
// visual do escritório Mauro Monção Advogados
// URL: /mara-chat  (pública, protegida por PIN)
// ============================================================
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Mic, MicOff, Loader2, ChevronDown, Phone, Info } from 'lucide-react'

// ─── Constantes ──────────────────────────────────────────────
const MARA_AVATAR    = '/mara-avatar-circle.png'
const NAVY           = '#0f2044'
const GOLD           = '#D4A017'
const API_URL        = 'https://ben-growth-center.vercel.app'
const PIN_STORAGE    = 'mara_chat_pin_ok'
const PIN_CORRETO    = import.meta.env.VITE_MARA_PIN || '1234'

// ─── Tipos ───────────────────────────────────────────────────
interface Mensagem {
  id:        string
  role:      'user' | 'mara' | 'sistema'
  texto:     string
  hora:      string
  lida:      boolean
  digitando?: boolean
}

// ─── Hora formatada (fuso BR) ─────────────────────────────────
function horaAgora() {
  return new Date().toLocaleTimeString('pt-BR', {
    timeZone: 'America/Fortaleza',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Componente: Bolinha de Digitação ─────────────────────────
function DigitandoIndicador() {
  return (
    <div className="flex items-end gap-2 mb-3">
      {/* Avatar MARA */}
      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 shadow-md border-2 border-white"
           style={{ background: NAVY }}>
        <img src={MARA_AVATAR} alt="MARA" className="w-full h-full object-cover"
             onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
        <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold" style={{marginTop:'-100%'}}>M</div>
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm max-w-[80px]"
           style={{ background: '#f0f0f0' }}>
        <div className="flex gap-1 items-center h-4">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-gray-400"
                 style={{ animation: `bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Componente: Balão de Mensagem ───────────────────────────
function Balao({ msg }: { msg: Mensagem }) {
  const isMARA  = msg.role === 'mara'
  const isSist  = msg.role === 'sistema'

  if (isSist) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {msg.texto}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-end gap-2 mb-3 ${isMARA ? '' : 'flex-row-reverse'}`}>
      {/* Avatar MARA */}
      {isMARA && (
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 shadow-md border-2 border-white"
             style={{ background: NAVY }}>
          <img src={MARA_AVATAR} alt="MARA" className="w-full h-full object-cover"
               onError={e => {
                 const img = e.target as HTMLImageElement
                 img.style.display = 'none'
                 if (img.parentElement) {
                   img.parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px">M</div>'
                 }
               }} />
        </div>
      )}

      <div className={`max-w-[75%] ${isMARA ? '' : 'items-end'} flex flex-col gap-1`}>
        {/* Bolha */}
        <div
          className={`px-4 py-2.5 shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
            isMARA
              ? 'rounded-2xl rounded-bl-sm text-gray-800'
              : 'rounded-2xl rounded-br-sm text-white'
          }`}
          style={{
            background: isMARA ? '#f0f0f0' : `linear-gradient(135deg, ${NAVY}, #1a3060)`,
          }}
          dangerouslySetInnerHTML={{
            __html: msg.texto
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/_(.*?)_/g, '<em>$1</em>')
          }}
        />
        {/* Hora + status */}
        <div className={`flex items-center gap-1 px-1 ${isMARA ? '' : 'flex-row-reverse'}`}>
          <span className="text-[10px] text-gray-400">{msg.hora}</span>
          {!isMARA && (
            <span className="text-[10px] text-blue-400">✓✓</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tela de PIN ─────────────────────────────────────────────
function TelaPIN({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin]       = useState('')
  const [erro, setErro]     = useState(false)
  const [shake, setShake]   = useState(false)

  function handleDigito(d: string) {
    if (pin.length >= 4) return
    const novo = pin + d
    setPin(novo)
    setErro(false)
    if (novo.length === 4) {
      setTimeout(() => {
        if (novo === PIN_CORRETO) {
          sessionStorage.setItem(PIN_STORAGE, '1')
          onUnlock()
        } else {
          setErro(true)
          setShake(true)
          setTimeout(() => { setPin(''); setShake(false) }, 600)
        }
      }, 200)
    }
  }

  function handleBackspace() {
    setPin(p => p.slice(0, -1))
    setErro(false)
  }

  const digitos = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
         style={{ background: `linear-gradient(160deg, ${NAVY} 0%, #1a3060 60%, #0f2044 100%)` }}>

      {/* Avatar */}
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 shadow-2xl"
             style={{ borderColor: GOLD }}>
          <img src={MARA_AVATAR} alt="MARA" className="w-full h-full object-cover"
               onError={e => {
                 const img = e.target as HTMLImageElement
                 img.style.display = 'none'
                 if (img.parentElement) {
                   img.parentElement.style.background = NAVY
                   img.parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#D4A017;font-size:40px;font-weight:700">M</div>'
                 }
               }} />
        </div>
        {/* Bolinha online */}
        <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white shadow" />
      </div>

      <h1 className="text-white text-2xl font-bold mb-1">MARA IA</h1>
      <p className="text-white/60 text-sm mb-8">Assistente Executiva · Dr. Mauro Monção</p>

      {/* Indicador PIN */}
      <div className={`flex gap-3 mb-8 ${shake ? 'animate-[wiggle_0.3s_ease-in-out_2]' : ''}`}>
        {[0,1,2,3].map(i => (
          <div key={i}
               className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                 pin.length > i
                   ? erro ? 'bg-red-400 border-red-400' : 'border-white'
                   : 'bg-transparent border-white/40'
               }`}
               style={{ background: pin.length > i && !erro ? GOLD : undefined }}
          />
        ))}
      </div>

      {erro && (
        <p className="text-red-400 text-xs mb-4 -mt-4">PIN incorreto. Tente novamente.</p>
      )}

      {/* Teclado */}
      <div className="grid grid-cols-3 gap-3 w-64">
        {digitos.map((d, i) => (
          <button
            key={i}
            onClick={() => d === '⌫' ? handleBackspace() : d ? handleDigito(d) : null}
            disabled={!d}
            className={`h-16 rounded-2xl text-white text-xl font-semibold transition-all active:scale-95 ${
              d === '⌫'
                ? 'bg-white/10 hover:bg-white/20'
                : d
                ? 'bg-white/15 hover:bg-white/25 active:bg-white/30'
                : 'invisible'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <p className="text-white/30 text-xs mt-8">Mauro Monção Advogados · Acesso Privado</p>
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────
export default function MaraChat() {
  const [desbloqueado, setDesbloqueado] = useState(
    () => sessionStorage.getItem(PIN_STORAGE) === '1'
  )
  const [mensagens, setMensagens]       = useState<Mensagem[]>([])
  const [input, setInput]               = useState('')
  const [enviando, setEnviando]         = useState(false)
  const [digitando, setDigitando]       = useState(false)
  const [scrollBaixo, setScrollBaixo]   = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  // Mensagem de boas-vindas
  useEffect(() => {
    if (!desbloqueado) return
    const hora = new Date().getHours()
    const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
    const emoji    = hora < 12 ? '☀️' : hora < 18 ? '🌤️' : '🌙'

    setTimeout(() => {
      setMensagens([{
        id:    '0',
        role:  'mara',
        texto: `${saudacao}, Dr. Mauro! ${emoji}\n\nEstou aqui e pronta. Como posso ajudá-lo hoje?`,
        hora:  horaAgora(),
        lida:  true,
      }])
    }, 600)
  }, [desbloqueado])

  // Auto-scroll
  useEffect(() => {
    if (scrollBaixo) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [mensagens, digitando, scrollBaixo])

  const enviarMensagem = useCallback(async () => {
    const texto = input.trim()
    if (!texto || enviando) return

    const msgUser: Mensagem = {
      id:    Date.now().toString(),
      role:  'user',
      texto,
      hora:  horaAgora(),
      lida:  true,
    }

    setMensagens(prev => [...prev, msgUser])
    setInput('')
    setEnviando(true)
    setDigitando(true)
    setScrollBaixo(true)

    try {
      const historico = mensagens
        .filter(m => m.role !== 'sistema')
        .slice(-10)
        .map(m => ({ role: m.role === 'mara' ? 'assistant' : 'user', content: m.texto }))

      const resp = await fetch(`${API_URL}/api/mara-chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mensagem: texto, historico }),
        signal:  AbortSignal.timeout(25000),
      })

      const data = await resp.json()
      const resposta = data?.resposta || 'Desculpe, não consegui processar. Tente novamente.'

      setDigitando(false)
      setMensagens(prev => [...prev, {
        id:    Date.now().toString() + '_r',
        role:  'mara',
        texto: resposta,
        hora:  horaAgora(),
        lida:  true,
      }])
    } catch (e) {
      setDigitando(false)
      setMensagens(prev => [...prev, {
        id:    Date.now().toString() + '_e',
        role:  'mara',
        texto: 'Tive uma instabilidade. Pode repetir, Dr. Mauro?',
        hora:  horaAgora(),
        lida:  true,
      }])
    } finally {
      setEnviando(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, enviando, mensagens])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviarMensagem()
    }
  }

  if (!desbloqueado) {
    return <TelaPIN onUnlock={() => setDesbloqueado(true)} />
  }

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto"
         style={{ background: '#ece5dd', fontFamily: "'Inter', sans-serif" }}>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-30 shadow-md"
           style={{ background: NAVY }}>

        {/* Avatar flutuante com status */}
        <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 shadow-lg"
               style={{ borderColor: GOLD }}>
            <img src={MARA_AVATAR} alt="MARA"
                 className="w-full h-full object-cover"
                 onError={e => {
                   const img = e.target as HTMLImageElement
                   img.style.display = 'none'
                   if (img.parentElement) {
                     img.parentElement.style.background = '#1a3060'
                     img.parentElement.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:${GOLD};font-weight:700;font-size:18px">M</div>`
                   }
                 }} />
          </div>
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2"
               style={{ borderColor: NAVY }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-base leading-tight">MARA IA</p>
          <p className="text-green-400 text-xs">online agora</p>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-3">
          <button className="text-white/70 hover:text-white transition">
            <Phone size={20} />
          </button>
          <button className="text-white/70 hover:text-white transition">
            <Info size={20} />
          </button>
        </div>
      </div>

      {/* ── BANNER IDENTIDADE ────────────────────────────────── */}
      <div className="mx-3 mt-3 mb-1 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3"
             style={{ background: `linear-gradient(135deg, ${NAVY}ee, #1a3060ee)` }}>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 flex-shrink-0"
               style={{ borderColor: GOLD }}>
            <img src={MARA_AVATAR} alt="MARA" className="w-full h-full object-cover"
                 onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
          <div>
            <p className="text-white font-bold text-sm">MARA — Secretária Executiva IA</p>
            <p className="text-white/60 text-xs">Mauro Monção Advogados · Acesso Privado</p>
          </div>
          <div className="ml-auto">
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: GOLD + '30', color: GOLD }}>
              🔒 Privado
            </span>
          </div>
        </div>
      </div>

      {/* ── MENSAGENS ────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-3 py-4 space-y-0"
        style={{ paddingBottom: '80px' }}
        onScroll={e => {
          const el = e.currentTarget
          setScrollBaixo(el.scrollHeight - el.scrollTop - el.clientHeight < 60)
        }}
      >
        {mensagens.map(msg => <Balao key={msg.id} msg={msg} />)}
        {digitando && <DigitandoIndicador />}
        <div ref={bottomRef} />
      </div>

      {/* Botão voltar ao fim */}
      {!scrollBaixo && (
        <button
          onClick={() => { setScrollBaixo(true); bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
          className="fixed bottom-24 right-4 w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-white z-20"
          style={{ background: NAVY }}>
          <ChevronDown size={20} />
        </button>
      )}

      {/* ── INPUT ────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-3 py-3 z-20"
           style={{ background: '#ece5dd' }}>
        <div className="flex items-end gap-2">
          <div className="flex-1 flex items-end rounded-3xl bg-white shadow-sm px-4 py-2 min-h-[46px]">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mensagem..."
              rows={1}
              className="flex-1 resize-none outline-none text-sm text-gray-800 placeholder-gray-400 max-h-32 leading-relaxed bg-transparent"
              style={{ scrollbarWidth: 'none' }}
            />
          </div>

          {/* Botão enviar */}
          <button
            onClick={enviarMensagem}
            disabled={!input.trim() || enviando}
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-md transition-all active:scale-95 disabled:opacity-50"
            style={{ background: input.trim() ? NAVY : '#ccc' }}
          >
            {enviando
              ? <Loader2 size={20} className="text-white animate-spin" />
              : <Send size={18} className="text-white translate-x-0.5" />
            }
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-1">
          Mauro Monção Advogados — Assistente Executiva Privada
        </p>
      </div>

      {/* CSS global para bounce */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%            { transform: translateY(-6px); }
        }
        @keyframes wiggle {
          0%, 100% { transform: translateX(0); }
          25%       { transform: translateX(-8px); }
          75%       { transform: translateX(8px); }
        }
        textarea { scrollbar-width: none; }
        textarea::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
