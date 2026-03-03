import { useState, useEffect, useCallback } from 'react'
import { Wifi, WifiOff, RefreshCw, Smartphone, MessageSquare, Users, AlertTriangle, CheckCircle, Loader } from 'lucide-react'

// Evolution API no VPS Hostinger
const EVOLUTION_URL = 'http://181.215.135.202:8080'
const EVOLUTION_KEY = 'BenEvolution2026'
const INSTANCE      = 'drben'

async function evoFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${EVOLUTION_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_KEY,
      ...(opts.headers ?? {}),
    },
  })
  return res.json()
}

export default function WhatsAppConnect() {
  const [status, setStatus]   = useState<'disconnected' | 'connecting' | 'open'>('disconnected')
  const [qrcode, setQrcode]   = useState<string | null>(null)
  const [leads, setLeads]     = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  // ── Buscar status da instância ──────────────────────────
  const buscarStatus = useCallback(async () => {
    try {
      const data = await evoFetch(`/instance/connectionState/${INSTANCE}`)
      const state = data?.instance?.state ?? data?.state ?? ''
      if (state === 'open')       setStatus('open')
      else if (state === 'connecting' || state === 'qrcode') setStatus('connecting')
      else                         setStatus('disconnected')
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
      // Conectar a instância
      await evoFetch(`/instance/connect/${INSTANCE}`, { method: 'GET' })
      // Buscar QR Code
      const data = await evoFetch(`/instance/connect/${INSTANCE}`)
      if (data?.base64)       setQrcode(data.base64)
      else if (data?.qrcode?.base64) setQrcode(data.qrcode.base64)
      else if (data?.code)    {
        // Buscar QR Code direto
        const qrData = await evoFetch(`/instance/fetchInstances`)
        const inst = qrData?.find?.((i: any) => i?.instance?.instanceName === INSTANCE)
        if (inst?.instance?.qrcode?.base64) setQrcode(inst.instance.qrcode.base64)
      }
    } catch (e) {
      console.error('Erro ao gerar QR Code:', e)
    } finally {
      setLoading(false)
    }
  }

  // ── Buscar QR Code da instância existente ──────────────
  const buscarQRCode = useCallback(async () => {
    try {
      const data = await evoFetch(`/instance/fetchInstances`)
      const inst = Array.isArray(data)
        ? data.find((i: any) => i?.instance?.instanceName === INSTANCE)
        : null
      if (inst?.instance?.qrcode?.base64) {
        setQrcode(inst.instance.qrcode.base64)
        setStatus('connecting')
      }
    } catch (e) {
      console.error('Erro ao buscar QR Code:', e)
    }
  }, [])

  // ── Desconectar ──────────────────────────────────────────
  const desconectar = async () => {
    if (!confirm('Deseja desconectar o WhatsApp do sistema?')) return
    await evoFetch(`/instance/logout/${INSTANCE}`, { method: 'DELETE' })
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
          <h1 className="text-2xl font-bold text-[#0f2044]">WhatsApp — Dr. Ben</h1>
          <p className="text-gray-500 text-sm mt-1">
            Conecte o número <strong>+55 86 9482-0054</strong> para ativar o Dr. Ben IA
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
              Conectar WhatsApp
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
                  Dr. Ben está online e respondendo clientes
                </p>
              </div>
              <button
                onClick={desconectar}
                className="px-6 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition text-sm font-medium"
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
                  <li>1. Abra o WhatsApp no celular</li>
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
                  Clique abaixo para gerar o QR Code
                </p>
              </div>
              <button
                onClick={solicitarQRCode}
                disabled={loading}
                className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl bg-[#0f2044] text-white font-semibold hover:bg-[#1a3060] transition disabled:opacity-50"
              >
                {loading
                  ? <><Loader size={18} className="animate-spin" /> Gerando QR Code...</>
                  : <><Smartphone size={18} /> Conectar WhatsApp</>
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

        {/* ── Card Instruções ────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-[#0f2044] flex items-center gap-2">
            <MessageSquare size={20} className="text-[#D4A017]" />
            Como funciona
          </h2>

          <div className="space-y-3">
            {[
              { icon: '📱', title: 'Escaneie o QR Code', desc: 'Use o número +55 86 9482-0054 para conectar' },
              { icon: '🤖', title: 'Dr. Ben responde', desc: 'IA jurídica responde clientes automaticamente 24/7' },
              { icon: '⚡', title: 'Leads urgentes', desc: 'Plantonista recebe alerta de casos prioritários' },
              { icon: '📋', title: 'CRM integrado', desc: 'Todas as conversas salvas no sistema' },
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

          {/* Info VPS */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
            <Wifi size={16} className="text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              Evolution API rodando no <strong>VPS Hostinger</strong> (São Paulo) — 24/7 ativo.
              IP: <code className="font-mono">181.215.135.202</code>
            </p>
          </div>

          {/* Aviso */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              Após escanear, o WhatsApp no celular ficará como <strong>"Aparelho conectado"</strong>.
              O número passa a funcionar via servidor — Dr. Ben responde automaticamente.
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
