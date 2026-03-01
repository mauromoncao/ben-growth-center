import React, { useState, useEffect, useRef } from 'react'
import { Bot, Send, User, Zap, Bell, CheckCircle2, AlertCircle, Phone, ExternalLink } from 'lucide-react'

// ─── Tipos ───────────────────────────────────────────────────
interface Msg {
  role: 'bot' | 'user' | 'system'
  texto: string
  hora: string
  acao?: 'repasse' | 'coleta' | 'qualificado'
}

interface WebhookLog {
  id: string
  fonte: string
  nome: string
  telefone: string
  mensagem: string
  hora: string
  status: 'recebido' | 'qualificado' | 'repassado'
  area?: string
  score?: number
}

// ─── Simulação de conversa Dr. Ben ───────────────────────────
const scriptDrBen = [
  { role: 'bot' as const, texto: 'Olá! Sou o Dr. Ben, assistente jurídico do escritório Mauro Monção. Como posso ajudar você hoje?', delay: 500 },
  { role: 'user' as const, texto: 'Tenho uma dívida com a Receita Federal e não sei o que fazer', delay: 2000 },
  { role: 'bot' as const, texto: 'Entendo sua preocupação! Esse tipo de situação tem solução. Para te ajudar melhor: qual o valor aproximado da dívida?', delay: 3500, acao: 'coleta' as const },
  { role: 'user' as const, texto: 'É em torno de R$ 200 mil de ICMS atrasado', delay: 5500 },
  { role: 'bot' as const, texto: '📊 Analisando seu caso... Valor: R$ 200k. Tipo: ICMS. Com esse perfil, há duas estratégias possíveis: defesa administrativa ou parcelamento especial. Dr. Mauro é especialista nisso!', delay: 7000, acao: 'qualificado' as const },
  { role: 'user' as const, texto: 'Quero falar com ele urgente!', delay: 9000 },
  { role: 'bot' as const, texto: '✅ Perfeito! Caso qualificado como ALTA PRIORIDADE. Score: 94/100. Encaminhando para o plantonista humano agora... Um especialista entrará em contato em até 30 minutos!', delay: 10500, acao: 'repasse' as const },
]

const webhookLogsMock: WebhookLog[] = [
  { id: 'w1', fonte: 'WhatsApp', nome: 'Carlos Mendes', telefone: '(86) 99801-2345', mensagem: 'Dívida R$ 180k ICMS', hora: '09:14', status: 'repassado', area: 'Tributário', score: 92 },
  { id: 'w2', fonte: 'Site (Chat)', nome: 'Ana Paula Sousa', telefone: '(86) 99712-8765', mensagem: 'Aposentadoria negada INSS', hora: '09:28', status: 'qualificado', area: 'Previdenciário', score: 74 },
  { id: 'w3', fonte: 'WhatsApp', nome: 'José Alves', telefone: '(86) 99400-1234', mensagem: 'Aposentadoria especial negada', hora: '07:45', status: 'repassado', area: 'Previdenciário', score: 85 },
  { id: 'w4', fonte: 'Site (Chat)', nome: 'Maria Oliveira', telefone: '(86) 99388-5432', mensagem: 'Dúvida IR — em coleta', hora: '10:10', status: 'recebido', area: 'Tributário', score: 45 },
]

const statusWebhookCor: Record<string, string> = {
  recebido: 'badge-blue',
  qualificado: 'badge-yellow',
  repassado: 'bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium',
}
const statusWebhookLabel: Record<string, string> = {
  recebido: '📥 Recebido',
  qualificado: '🤖 Qualificado',
  repassado: '👤 Repassado',
}

// ─── Componente Principal ────────────────────────────────────
export default function DrBenIntegracao() {
  const [mensagens, setMensagens] = useState<Msg[]>([])
  const [rodando, setRodando] = useState(false)
  const [concluido, setConcluido] = useState(false)
  const [novaMsg, setNovaMsg] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)
  const [alertaRepasse, setAlertaRepasse] = useState(false)

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [mensagens])

  const iniciarDemo = async () => {
    setMensagens([])
    setRodando(true)
    setConcluido(false)
    setAlertaRepasse(false)

    for (const item of scriptDrBen) {
      await new Promise(r => setTimeout(r, item.delay - (scriptDrBen[scriptDrBen.indexOf(item) - 1]?.delay || 0)))
      const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      setMensagens(prev => [...prev, { role: item.role, texto: item.texto, hora, acao: item.acao }])

      if (item.acao === 'repasse') {
        setTimeout(() => setAlertaRepasse(true), 800)
      }
    }

    setRodando(false)
    setConcluido(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dr. Ben — Integração CRM</h1>
          <p className="text-white/60 text-sm mt-1">Fluxo de qualificação IA e repasse automático para humano</p>
        </div>
        <button onClick={iniciarDemo} disabled={rodando}
          className="btn-primary flex items-center gap-2 text-sm disabled:opacity-60">
          <Bot className="w-4 h-4" />
          {rodando ? 'Simulando...' : 'Simular Conversa Dr. Ben'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat simulado */}
        <div className="card flex flex-col h-[520px]">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/8">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Dr. Ben — Chat ao Vivo</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-600 text-xs">Online · Gemini 2.5 Flash</span>
              </div>
            </div>
            {alertaRepasse && (
              <div className="ml-auto flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full animate-pulse">
                <Bell className="w-3 h-3" /> Alerta enviado!
              </div>
            )}
          </div>

          {/* Mensagens */}
          <div ref={chatRef} className="flex-1 overflow-y-auto space-y-3 mb-4">
            {mensagens.length === 0 && (
              <div className="text-center py-12">
                <Bot className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-white/50 text-sm">Clique em "Simular Conversa" para ver o Dr. Ben qualificando um lead em tempo real</p>
              </div>
            )}
            {mensagens.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'bot' && (
                  <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-amber-600" />
                  </div>
                )}
                <div className={`max-w-xs rounded-2xl px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-navy text-white rounded-tr-sm'
                    : msg.acao === 'repasse'
                    ? 'bg-green-50 border-2 border-green-400 text-white/90 rounded-tl-sm'
                    : msg.acao === 'qualificado'
                    ? 'bg-amber-50 border border-amber-300 text-white/90 rounded-tl-sm'
                    : 'bg-white/6 text-white/90 rounded-tl-sm'
                }`}>
                  {msg.role === 'bot' && (
                    <p className={`text-xs font-medium mb-0.5 ${msg.acao === 'repasse' ? 'text-green-600' : msg.acao === 'qualificado' ? 'text-amber-600' : 'text-white/50'}`}>
                      {msg.acao === 'repasse' ? '✅ Repasse Automático' : msg.acao === 'qualificado' ? '🤖 Qualificação IA' : '🤖 Dr. Ben'}
                    </p>
                  )}
                  <p>{msg.texto}</p>
                  <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-gold-200' : 'text-white/50'}`}>{msg.hora}</p>
                </div>
              </div>
            ))}
            {rodando && (
              <div className="flex gap-2">
                <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-amber-600" />
                </div>
                <div className="bg-white/6 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2 pt-3 border-t border-white/8">
            <input
              type="text"
              value={novaMsg}
              onChange={e => setNovaMsg(e.target.value)}
              placeholder="Testar Dr. Ben manualmente..."
              className="flex-1 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/55"
            />
            <button className="btn-primary px-3 py-2">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Painel direito — Dados coletados + Webhook log */}
        <div className="space-y-4">
          {/* Card lead capturado */}
          {concluido && (
            <div className="card border-2 border-green-400 bg-green-50">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-700">Lead Registrado no CRM!</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { label: 'Nome', value: 'Lead Demo' },
                  { label: 'Área', value: 'Tributário' },
                  { label: 'Score', value: '94/100' },
                  { label: 'Urgência', value: '🔴 Alta' },
                  { label: 'Valor Est.', value: 'R$ 20.000' },
                  { label: 'Status', value: '⏳ Aguardando' },
                ].map(item => (
                  <div key={item.label} className="bg-white/5 rounded-lg p-2">
                    <p className="text-white/50 text-xs">{item.label}</p>
                    <p className="font-medium text-white">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button className="flex-1 bg-green-500 text-white text-sm py-2 rounded-lg hover:bg-green-600 transition-colors">
                  Abrir no CRM
                </button>
                <button className="flex-1 bg-white/5 border border-green-300 text-green-700 text-sm py-2 rounded-lg hover:bg-green-50 transition-colors">
                  Ver no WhatsApp
                </button>
              </div>
            </div>
          )}

          {/* Webhook — Log de entradas */}
          <div className="card">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Webhook — Entradas Recentes
            </h3>
            <div className="space-y-2">
              {webhookLogsMock.map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-white/4 rounded-xl hover:bg-white/6 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{log.fonte === 'WhatsApp' ? '💬' : '🌐'}</span>
                    <div>
                      <p className="font-medium text-white/90 text-sm">{log.nome}</p>
                      <p className="text-white/50 text-xs">{log.mensagem} · {log.hora}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.score && (
                      <span className="text-xs text-white/60">{log.score}</span>
                    )}
                    <span className={statusWebhookCor[log.status]}>{statusWebhookLabel[log.status]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configuração da integração */}
          <div className="card">
            <h3 className="font-semibold text-white mb-3">⚙️ Integração Ativa</h3>
            <div className="space-y-2">
              {[
                { fonte: 'WhatsApp (Meta API)', status: true, url: 'webhook/whatsapp' },
                { fonte: 'Chat Site (mauromoncao.adv.br)', status: true, url: 'webhook/site-chat' },
                { fonte: 'Formulário Site', status: true, url: 'webhook/form' },
                { fonte: 'Google Ads (Lead Form)', status: false, url: 'webhook/google-leads' },
              ].map(item => (
                <div key={item.fonte} className="flex items-center justify-between p-2.5 bg-white/4 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white/90">{item.fonte}</p>
                    <p className="text-white/50 text-xs font-mono">/api/{item.url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.status ? 'bg-green-400' : 'bg-slate-300'}`} />
                    <span className={`text-xs ${item.status ? 'text-green-600' : 'text-white/50'}`}>
                      {item.status ? 'Ativo' : 'Pendente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
