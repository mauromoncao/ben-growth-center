import { useState, useEffect, useCallback } from 'react'
import { Wifi, WifiOff, MessageSquare, CheckCircle, Loader, Zap, RefreshCw, Shield, Clock } from 'lucide-react'

const ZAPI_ENDPOINT = '/api/whatsapp-zapi'

export default function WhatsAppConnect() {
  const [status, setStatus]       = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const [lastCheck, setLastCheck] = useState<string>('')
  const [uptime, setUptime]       = useState<string>('')
  const [loading, setLoading]     = useState(false)

  // ── Buscar status real do Z-API ─────────────────────────
  const verificarStatus = useCallback(async () => {
    try {
      const res  = await fetch(ZAPI_ENDPOINT)
      const data = await res.json()
      // GET retorna { zapi: '✅ configurado', token: '✅ client-token ok' }
      // Testar conexão real
      const res2  = await fetch(`${ZAPI_ENDPOINT}?action=testar&para=ping`)
      const data2 = await res2.json()
      // Se token_ok = true e não retornou "Instance not found" = conectado
      if (data2?.token_ok && !data2?.zapi_resp?.error?.includes('not found')) {
        setStatus('connected')
      } else if (data?.zapi?.includes('✅')) {
        setStatus('connected')
      } else {
        setStatus('disconnected')
      }
      setLastCheck(new Date().toLocaleTimeString('pt-BR'))
    } catch {
      setStatus('disconnected')
    }
  }, [])

  // Verificar via diagnóstico (mais confiável)
  const verificarDiagnostico = useCallback(async () => {
    try {
      const res  = await fetch('/api/diagnostico')
      const data = await res.json()
      if (data?.zapi?.includes('✅ CONECTADO')) {
        setStatus('connected')
      } else if (data?.zapi?.includes('❌')) {
        setStatus('disconnected')
      }
      setLastCheck(new Date().toLocaleTimeString('pt-BR'))
    } catch {
      setStatus('disconnected')
    }
  }, [])

  // ── Polling a cada 30 segundos ──────────────────────────
  useEffect(() => {
    verificarDiagnostico()
    const interval = setInterval(verificarDiagnostico, 30000)
    return () => clearInterval(interval)
  }, [verificarDiagnostico])

  // ── Uptime contador ─────────────────────────────────────
  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => {
      const diff = Math.floor((Date.now() - start) / 1000)
      const h = Math.floor(diff / 3600)
      const m = Math.floor((diff % 3600) / 60)
      const s = diff % 60
      setUptime(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleAtualizar = async () => {
    setLoading(true)
    setStatus('checking')
    await verificarDiagnostico()
    setLoading(false)
  }

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2044]">Dr. Ben — Assistente Jurídico</h1>
          <p className="text-gray-500 text-sm mt-1">
            Número ativo: <strong>(86) 9482-0054</strong> — Dr. Ben atende clientes 24/7 via WhatsApp
          </p>
        </div>

        {/* Badge de status */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all ${
          status === 'connected'    ? 'text-green-700 bg-green-50 border-green-300' :
          status === 'checking'     ? 'text-yellow-700 bg-yellow-50 border-yellow-300' :
                                      'text-red-700 bg-red-50 border-red-300'
        }`}>
          {status === 'connected'  && <Wifi size={16} />}
          {status === 'checking'   && <Loader size={16} className="animate-spin" />}
          {status === 'disconnected' && <WifiOff size={16} />}
          {status === 'connected'    ? 'Conectado' :
           status === 'checking'     ? 'Verificando...' : 'Desconectado'}
        </div>
      </div>

      {/* ── Grid principal ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Card Status Z-API ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[#0f2044] flex items-center gap-2">
              <Zap size={20} className="text-[#D4A017]" />
              Status da Conexão
            </h2>
            <button
              onClick={handleAtualizar}
              disabled={loading}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>

          {/* Conectado */}
          {status === 'connected' && (
            <div className="text-center py-6 space-y-4">
              <div className="relative inline-block">
                <CheckCircle size={72} className="text-green-500 mx-auto" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full" />
              </div>
              <div>
                <p className="text-xl font-bold text-green-600">Z-API Conectado!</p>
                <p className="text-gray-500 text-sm mt-1">Dr. Ben está online e atendendo automaticamente</p>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Canal</p>
                  <p className="font-bold text-green-700 text-sm">Z-API ☁️</p>
                </div>
                <div className="bg-[#f0f3fa] rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">IA</p>
                  <p className="font-bold text-[#0f2044] text-sm">GPT-4o-mini</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Sessão ativa</p>
                  <p className="font-bold text-purple-700 text-sm">{uptime || '—'}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">Última verificação</p>
                  <p className="font-bold text-amber-700 text-sm">{lastCheck || '—'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Verificando */}
          {status === 'checking' && (
            <div className="text-center py-10 space-y-4">
              <Loader size={64} className="mx-auto text-[#D4A017] animate-spin" />
              <p className="text-gray-500">Verificando conexão Z-API...</p>
            </div>
          )}

          {/* Desconectado */}
          {status === 'disconnected' && (
            <div className="text-center py-8 space-y-4">
              <WifiOff size={64} className="mx-auto text-gray-300" />
              <div>
                <p className="text-lg font-bold text-gray-600">Z-API Desconectado</p>
                <p className="text-gray-400 text-sm mt-1">
                  Acesse <strong>app.z-api.io</strong> e reconecte a instância
                </p>
              </div>
              <a
                href="https://app.z-api.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0f2044] text-white font-semibold hover:bg-[#1a3060] transition text-sm"
              >
                <Zap size={16} />
                Acessar Z-API
              </a>
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
              { icon: '🤖', title: 'MARA IA avisa Dr. Mauro', desc: 'Você recebe o resumo completo do lead no WhatsApp' },
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

          {/* Info Z-API */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-green-50 border border-green-200">
            <Shield size={16} className="text-green-600 mt-0.5 shrink-0" />
            <p className="text-xs text-green-700">
              <strong>Z-API Cloud</strong> — conexão estável na nuvem, sem depender de celular ligado ou QR Code manual.
            </p>
          </div>

          {/* Keepalive info */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-[#f0f3fa] border border-[#c5d0e8]">
            <Clock size={16} className="text-[#0f2044] mt-0.5 shrink-0" />
            <p className="text-xs text-[#0f2044]">
              Monitoramento automático a cada <strong>5 minutos</strong> — se desconectar, Dr. Mauro é avisado imediatamente.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
