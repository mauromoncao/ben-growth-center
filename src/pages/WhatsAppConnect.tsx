import { useState, useEffect, useCallback } from 'react'
import { Wifi, WifiOff, RefreshCw, Smartphone, MessageSquare, Users, CheckCircle, Loader, Zap } from 'lucide-react'

// Status via Evolution proxy (instância conectada via QR Code)
const PROXY = '/api/whatsapp-proxy'

export default function WhatsAppConnect() {
  const [status, setStatus]   = useState<'disconnected' | 'connecting' | 'open'>('disconnected')
  const [qrcode, setQrcode]   = useState<string | null>(null)
  const [leads, setLeads]     = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  // ── Buscar status da instância ──────────────────────────
  const buscarStatus = useCallback(async () => {
    try {
      const res  = await fetch(`${PROXY}?action=status`)
      const data = await res.json()
      const state = data?.state ?? data?.status ?? ''
      if (state === 'open')                                   setStatus('open')
      else if (state === 'connecting' || state === 'qrcode') setStatus('connecting')
      else                                                    setStatus('disconnected')
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'))
    } catch (e) {
      console.error('Erro ao buscar status:', e)
    }
  }, [])

  // ── Solicitar QR Code ───────────────────────────────────
  const solicitarQRCode = async () => {
    setLoading(true)
    setQrcode(null)
    setStatus('connecting')
    try {
      const res  = await fetch(`${PROXY}?action=connect`)
      const data = await res.json()
      if (data?.qrcode) setQrcode(data.qrcode)
      setTimeout(async () => {
        const r2  = await fetch(`${PROXY}?action=qrcode`)
        const d2  = await r2.json()
        if (d2?.qrcode) setQrcode(d2.qrcode)
      }, 2000)
    } catch (e) {
      console.error('Erro ao gerar QR Code:', e)
    } finally {
      setLoading(false)
    }
  }

  // ── Buscar QR Code da instância existente ──────────────
  const buscarQRCode = useCallback(async () => {
    try {
      const res  = await fetch(`${PROXY}?action=qrcode`)
      const data = await res.json()
      if (data?.qrcode) {
        setQrcode(data.qrcode)
        setStatus(prev => prev === 'open' ? 'open' : 'connecting')
      }
    } catch (e) {
      console.error('Erro ao buscar QR Code:', e)
    }
  }, [])

  // ── Desconectar ──────────────────────────────────────────
  const desconectar = async () => {
    if (!confirm('Deseja desconectar o WhatsApp do sistema?')) return
    await fetch(`${PROXY}?action=disconnect`, { method: 'POST' })
    setStatus('disconnected')
    setQrcode(null)
  }

  // ── Polling a cada 5 segundos ───────────────────────────
  useEffect(() => {
    buscarStatus()
    buscarQRCode()
    const interval = setInterval(() => {
      buscarStatus()
      buscarQRCode()
    }, 5000)
    return () => clearInterval(interval)
  }, [buscarStatus, buscarQRCode])

  const statusColor = {
    open:         'text-green-600 bg-green-50 border-green-200',
    connecting:   'text-yellow-600 bg-yellow-50 border-yellow-200',
    disconnected: 'text-red-600 bg-red-50 border-red-200',
  }[status]

  const statusLabel = {
    open:         '🟢 Conectado',
    connecting:   '🟡 Conectando...',
    disconnected: '🔴 Desconectado',
  }[status]

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2044]">Dr. Ben — Assistente Jurídico</h1>
          <p className="text-gray-500 text-sm mt-1">
            Número ativo: <strong>(86) 9482-0054</strong> — Dr. Ben atende clientes 24/7 via WhatsApp
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${statusColor}`}>
          {status === 'open'         && <Wifi size={16} />}
          {status === 'connecting'   && <Loader size={16} className="animate-spin" />}
          {status === 'disconnected' && <WifiOff size={16} />}
          {statusLabel}
        </div>
      </div>

      {/* ── Grid principal ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Card QR Code ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0f2044] flex items-center gap-2">
              <Smartphone size={20} className="text-[#D4A017]" />
              Conexão WhatsApp
            </h2>
            {lastUpdate && (
              <span className="text-xs text-gray-400">Atualizado: {lastUpdate}</span>
            )}
          </div>

          {/* Status: Conectado */}
          {status === 'open' && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle size={64} className="mx-auto text-green-500" />
              <div>
                <p className="text-xl font-bold text-green-600">WhatsApp Conectado!</p>
                <p className="text-gray-500 text-sm mt-1">
                  Dr. Ben está online e respondendo clientes automaticamente
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                <Zap size={14} />
                GPT-4o-mini ativo — triagem jurídica em 7 etapas
              </div>
              <button
                onClick={desconectar}
                className="block mx-auto px-6 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition text-sm font-medium"
              >
                Desconectar
              </button>
            </div>
          )}

          {/* Status: Conectando + QR Code */}
          {(status === 'connecting' || status === 'disconnected') && qrcode && (
            <div className="text-center space-y-4">
              <div className="bg-white p-4 rounded-xl border-2 border-[#0f2044] inline-block">
                <img
                  src={qrcode.startsWith('data:') ? qrcode : `data:image/png;base64,${qrcode}`}
                  alt="QR Code WhatsApp"
                  className="w-56 h-56 mx-auto"
                />
              </div>
              <div className="space-y-2">
                <p className="font-bold text-[#0f2044]">Escaneie com o WhatsApp</p>
                <ol className="text-sm text-gray-500 text-left space-y-1 max-w-xs mx-auto">
                  <li>1. Abra o WhatsApp no celular com (86) 9482-0054</li>
                  <li>2. Toque em ⋮ → Aparelhos conectados</li>
                  <li>3. Toque em "Conectar um aparelho"</li>
                  <li>4. Aponte a câmera para o QR Code</li>
                </ol>
              </div>
              <button
                onClick={solicitarQRCode}
                className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition text-sm"
              >
                <RefreshCw size={14} />
                Gerar novo QR Code
              </button>
            </div>
          )}

          {/* Status: Desconectado sem QR Code */}
          {status === 'disconnected' && !qrcode && (
            <div className="text-center py-8 space-y-4">
              <WifiOff size={64} className="mx-auto text-gray-300" />
              <div>
                <p className="text-lg font-bold text-gray-600">WhatsApp Desconectado</p>
                <p className="text-gray-400 text-sm mt-1">
                  Clique abaixo para reconectar
                </p>
              </div>
              <button
                onClick={solicitarQRCode}
                disabled={loading}
                className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl bg-[#0f2044] text-white font-semibold hover:bg-[#1a3060] transition disabled:opacity-50"
              >
                {loading
                  ? <><Loader size={18} className="animate-spin" /> Gerando QR Code...</>
                  : <><Smartphone size={18} /> Reconectar WhatsApp</>
                }
              </button>
            </div>
          )}

          {/* Conectando sem QR Code ainda */}
          {status === 'connecting' && !qrcode && (
            <div className="text-center py-8 space-y-4">
              <Loader size={64} className="mx-auto text-[#D4A017] animate-spin" />
              <p className="text-gray-500">Aguardando QR Code...</p>
            </div>
          )}
        </div>

        {/* ── Card Como funciona ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#0f2044] flex items-center gap-2">
            <MessageSquare size={20} className="text-[#D4A017]" />
            Como funciona
          </h2>

          <div className="space-y-3">
            {[
              { icon: '📱', title: 'Cliente manda mensagem', desc: 'Qualquer pessoa envia WhatsApp para (86) 9482-0054' },
              { icon: '⚖️', title: 'Dr. Ben responde', desc: 'IA jurídica com GPT-4o-mini atende automaticamente 24/7' },
              { icon: '📋', title: 'Triagem em 7 etapas', desc: 'Dr. Ben coleta nome, telefone, área jurídica e urgência' },
              { icon: '🤖', title: 'MARA IA avisa Dr. Mauro', desc: 'Você recebe o resumo do lead no (86) 99948-4761' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-semibold text-[#0f2044] text-sm">{item.title}</p>
                  <p className="text-gray-500 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Info sistema */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
            <Zap size={16} className="text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              Evolution API + GPT-4o-mini rodando na <strong>VPS Hostinger</strong> — 24/7 ativo.
            </p>
          </div>

          {/* Aviso */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <Wifi size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              O celular com (86) 9482-0054 precisa estar com WhatsApp conectado como <strong>"Aparelho conectado"</strong> para Dr. Ben funcionar.
            </p>
          </div>
        </div>
      </div>

      {/* ── Leads recentes ─────────────────────────────────── */}
      {leads.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0f2044] flex items-center gap-2">
              <Users size={20} className="text-[#D4A017]" />
              Leads Recentes — Dr. Ben
            </h2>
          </div>
          <div className="space-y-2">
            {leads.map((lead, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  lead.urgente ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    lead.urgente ? 'bg-red-500' : 'bg-[#0f2044]'
                  }`}>
                    {(lead.nome ?? lead.numero ?? '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#0f2044]">
                      {lead.nome ?? lead.numero}
                      {lead.urgente && <span className="ml-2 text-xs text-red-600 font-bold">🚨 URGENTE</span>}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-xs">{lead.ultima_mensagem}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {new Date(lead.criado_em).toLocaleString('pt-BR', {
                      day: '2-digit', month: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                  {lead.atendido && (
                    <span className="text-xs text-green-600 font-medium">✓ Atendido</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
