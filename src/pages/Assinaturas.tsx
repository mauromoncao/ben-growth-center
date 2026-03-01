// ============================================================
// BEN GROWTH CENTER — Página de Assinaturas Digitais (ZapSign)
// ============================================================

import React, { useEffect, useState, useCallback } from 'react'
import {
  FileSignature, Plus, RefreshCw, Search, Send, XCircle,
  CheckCircle2, Clock, AlertCircle, ExternalLink, Copy,
  Download, Wifi, WifiOff, ChevronLeft, ChevronRight,
  FileText, User, Mail, Phone
} from 'lucide-react'
import { ZapSignService, ZapSignTemplates, TipoContrato, ZapSignDocumentResponse } from '../lib/zapsign'

// ─── Helpers ──────────────────────────────────────────────────
const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const copyToClipboard = (text: string) => navigator.clipboard.writeText(text).catch(() => {})

// ─── Componente StatusBadge ────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    pending: { label: 'Aguardando', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: <Clock className="w-3 h-3" /> },
    signed:  { label: 'Assinado',   cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: <CheckCircle2 className="w-3 h-3" /> },
    refused: { label: 'Recusado',   cls: 'bg-red-500/20 text-red-300 border-red-500/30', icon: <XCircle className="w-3 h-3" /> },
  }
  const s = map[status] || { label: status, cls: 'bg-slate-500/20 text-slate-300 border-slate-500/30', icon: null }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  )
}

// ─── Modal Novo Documento ──────────────────────────────────────
const ModalNovoDocumento = ({
  onClose, onSuccess
}: { onClose: () => void; onSuccess: () => void }) => {
  const [tipo, setTipo] = useState<TipoContrato>('honorarios_tributario')
  const [nome, setNome] = useState('')
  const [urlPdf, setUrlPdf] = useState('')
  const [prazo, setPrazo] = useState(30)
  const [mensagem, setMensagem] = useState('')
  const [signers, setSigners] = useState([
    { name: '', email: '', phone: '', sendAutomaticEmail: true, sendAutomaticWhatsapp: false }
  ])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const addSigner = () =>
    setSigners(prev => [...prev, { name: '', email: '', phone: '', sendAutomaticEmail: true, sendAutomaticWhatsapp: false }])

  const updateSigner = (i: number, field: string, value: any) =>
    setSigners(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))

  const removeSigner = (i: number) =>
    setSigners(prev => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    if (!nome.trim()) return setErro('Informe o nome do documento.')
    if (!urlPdf.trim()) return setErro('Informe a URL do PDF.')
    if (signers.some(s => !s.name.trim() || !s.email.trim())) return setErro('Preencha nome e e-mail de todos os signatários.')
    setErro('')
    setLoading(true)
    try {
      await ZapSignService.criarDocumento({
        name: nome.trim(),
        urlPdf: urlPdf.trim(),
        lang: 'pt',
        signDeadlineDays: prazo,
        message: mensagem.trim(),
        signers: signers.map(s => ({
          name: s.name.trim(),
          email: s.email.trim(),
          phone: s.phone.trim(),
          sendAutomaticEmail: s.sendAutomaticEmail,
          sendAutomaticWhatsapp: s.sendAutomaticWhatsapp,
          authMode: 'assinaturaTela',
        })),
      })
      onSuccess()
      onClose()
    } catch (e: any) {
      setErro(e.message || 'Erro ao criar documento.')
    } finally {
      setLoading(false)
    }
  }

  const tpl = ZapSignTemplates[tipo]

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1629] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <FileSignature className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Novo Documento</h2>
              <p className="text-white/50 text-sm">Enviar para assinatura digital</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Tipo de contrato */}
          <div>
            <label className="text-white/70 text-sm font-medium mb-2 block">Tipo de Documento</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(ZapSignTemplates) as [TipoContrato, typeof tpl][]).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => setTipo(key)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                    tipo === key
                      ? 'border-purple-500 bg-purple-500/10 text-white'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                  }`}
                >
                  <span className="text-lg">{t.emoji}</span>
                  <span className="text-xs font-medium leading-tight">{t.nome}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nome do documento */}
          <div>
            <label className="text-white/70 text-sm font-medium mb-1.5 block">Nome do Documento *</label>
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder={`Ex: ${tpl.nome} — João Silva`}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* URL do PDF */}
          <div>
            <label className="text-white/70 text-sm font-medium mb-1.5 block">URL do PDF *</label>
            <input
              value={urlPdf}
              onChange={e => setUrlPdf(e.target.value)}
              placeholder="https://... (link público para o PDF)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
            />
            <p className="text-white/30 text-xs mt-1">Insira o link público do PDF armazenado no Drive, Dropbox ou similar.</p>
          </div>

          {/* Prazo + mensagem */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/70 text-sm font-medium mb-1.5 block">Prazo (dias)</label>
              <input
                type="number"
                min={1}
                max={365}
                value={prazo}
                onChange={e => setPrazo(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-white/70 text-sm font-medium mb-1.5 block">Mensagem</label>
              <input
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
                placeholder="Mensagem para os signatários"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Signatários */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white/70 text-sm font-medium">Signatários *</label>
              <button onClick={addSigner} className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300">
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
            <div className="space-y-3">
              {signers.map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs font-medium">Signatário {i + 1}</span>
                    {signers.length > 1 && (
                      <button onClick={() => removeSigner(i)} className="text-red-400/60 hover:text-red-400">
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/30" />
                      <input
                        value={s.name}
                        onChange={e => updateSigner(i, 'name', e.target.value)}
                        placeholder="Nome completo"
                        className="w-full pl-8 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/30" />
                      <input
                        value={s.email}
                        onChange={e => updateSigner(i, 'email', e.target.value)}
                        placeholder="e-mail"
                        className="w-full pl-8 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/30" />
                      <input
                        value={s.phone}
                        onChange={e => updateSigner(i, 'phone', e.target.value)}
                        placeholder="Telefone (5586999...)"
                        className="w-full pl-8 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="flex items-center gap-4 pt-1">
                      <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
                        <input type="checkbox" checked={s.sendAutomaticEmail} onChange={e => updateSigner(i, 'sendAutomaticEmail', e.target.checked)} className="accent-purple-500" />
                        E-mail auto
                      </label>
                      <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
                        <input type="checkbox" checked={s.sendAutomaticWhatsapp} onChange={e => updateSigner(i, 'sendAutomaticWhatsapp', e.target.checked)} className="accent-green-500" />
                        WhatsApp
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{erro}
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all">
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Enviando...' : 'Enviar para Assinatura'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Card de Documento ─────────────────────────────────────────
const DocumentCard = ({
  doc, onRefresh
}: { doc: ZapSignDocumentResponse; onRefresh: () => void }) => {
  const [expanded, setExpanded] = useState(false)
  const [canceling, setCanceling] = useState(false)

  const handleCancel = async () => {
    if (!confirm('Cancelar este documento? Esta ação não pode ser desfeita.')) return
    setCanceling(true)
    try {
      await ZapSignService.cancelarDocumento(doc.token)
      onRefresh()
    } catch {
      alert('Erro ao cancelar documento.')
    } finally {
      setCanceling(false)
    }
  }

  const assinadosCount = doc.signers?.filter(s => s.status === 'signed').length || 0
  const totalSigners   = doc.signers?.length || 0

  return (
    <div className="bg-[#0f1629] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 bg-purple-500/20 rounded-lg flex-shrink-0 mt-0.5">
              <FileText className="w-4 h-4 text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold truncate">{doc.name}</p>
              <p className="text-white/40 text-xs mt-0.5">
                Criado {fmt(doc.createdAt)} · Token: <span className="font-mono">{doc.token.slice(0, 8)}…</span>
              </p>
              <div className="flex items-center gap-3 mt-2">
                <StatusBadge status={doc.status} />
                <span className="text-white/40 text-xs">{assinadosCount}/{totalSigners} assinaram</span>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {doc.signedFileUrl && (
              <a href={doc.signedFileUrl} target="_blank" rel="noopener noreferrer"
                className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all" title="Baixar assinado">
                <Download className="w-4 h-4" />
              </a>
            )}
            <a href={doc.originalFileUrl} target="_blank" rel="noopener noreferrer"
              className="p-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg transition-all" title="Ver original">
              <ExternalLink className="w-4 h-4" />
            </a>
            {doc.status === 'pending' && (
              <button onClick={handleCancel} disabled={canceling}
                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all disabled:opacity-50" title="Cancelar">
                {canceling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              </button>
            )}
            <button onClick={() => setExpanded(!expanded)}
              className="p-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg transition-all">
              <ChevronLeft className={`w-4 h-4 transition-transform ${expanded ? '-rotate-90' : 'rotate-180'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Signatários expandido */}
      {expanded && (
        <div className="border-t border-white/10 p-5 space-y-3">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Signatários</p>
          {doc.signers?.map(signer => (
            <div key={signer.token} className="flex items-center justify-between gap-4 bg-white/5 rounded-xl px-4 py-3">
              <div>
                <p className="text-white text-sm font-medium">{signer.name}</p>
                <p className="text-white/40 text-xs">{signer.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={signer.status} />
                {signer.status === 'pending' && signer.signUrl && (
                  <button
                    onClick={() => copyToClipboard(signer.signUrl)}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    title="Copiar link de assinatura"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copiar link
                  </button>
                )}
                {signer.signedAt && (
                  <span className="text-white/30 text-xs">{fmt(signer.signedAt)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Página Principal ──────────────────────────────────────────
export default function Assinaturas() {
  const [docs, setDocs]           = useState<ZapSignDocumentResponse[]>([])
  const [loading, setLoading]     = useState(true)
  const [conexao, setConexao]     = useState<'ok' | 'erro' | 'verificando'>('verificando')
  const [conta, setConta]         = useState('')
  const [busca, setBusca]         = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pending' | 'signed' | 'refused'>('todos')
  const [pagina, setPagina]       = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [modalAberto, setModalAberto]  = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await ZapSignService.listarDocumentos(pagina)
      setDocs(res.results || [])
      setTotalPaginas(Math.ceil((res.count || 0) / 10) || 1)
    } catch {
      setDocs([])
    } finally {
      setLoading(false)
    }
  }, [pagina])

  const testarConexao = useCallback(async () => {
    setConexao('verificando')
    const res = await ZapSignService.testarConexao()
    setConexao(res.ok ? 'ok' : 'erro')
    if (res.conta) setConta(res.conta)
  }, [])

  useEffect(() => { testarConexao(); carregar() }, [testarConexao, carregar])

  const docsFiltrados = docs.filter(d => {
    const matchBusca = busca === '' || d.name.toLowerCase().includes(busca.toLowerCase())
    const matchStatus = filtroStatus === 'todos' || d.status === filtroStatus
    return matchBusca && matchStatus
  })

  // Estatísticas
  const stats = {
    total: docs.length,
    pending: docs.filter(d => d.status === 'pending').length,
    signed: docs.filter(d => d.status === 'signed').length,
    refused: docs.filter(d => d.status === 'refused').length,
  }

  return (
    <div className="min-h-screen bg-[#070d1f] text-white p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileSignature className="w-7 h-7 text-purple-400" />
            Assinaturas Digitais
          </h1>
          <p className="text-white/50 text-sm mt-1">ZapSign — Contratos e documentos para assinatura eletrônica</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Status de Conexão */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${
            conexao === 'ok'          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : conexao === 'erro'      ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            {conexao === 'ok'    ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {conexao === 'ok' ? `Conectado${conta ? ` · ${conta}` : ''}` : conexao === 'erro' ? 'Desconectado' : 'Verificando…'}
          </div>
          <button onClick={carregar} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white/60 transition-all" title="Recarregar">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-all"
          >
            <Plus className="w-4 h-4" /> Novo Documento
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-white', bg: 'bg-white/5' },
          { label: 'Aguardando', value: stats.pending, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Assinados', value: stats.signed, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Recusados', value: stats.refused, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-white/10 rounded-2xl p-4`}>
            <p className="text-white/50 text-xs font-medium">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar documento..."
            className="w-full pl-9 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="flex gap-2">
          {(['todos', 'pending', 'signed', 'refused'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltroStatus(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                filtroStatus === f
                  ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                  : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
              }`}
            >
              {{ todos: 'Todos', pending: '⏳ Aguardando', signed: '✅ Assinados', refused: '❌ Recusados' }[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      ) : docsFiltrados.length === 0 ? (
        <div className="text-center py-20">
          <FileSignature className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 font-medium">Nenhum documento encontrado</p>
          <p className="text-white/25 text-sm mt-1">Clique em "Novo Documento" para enviar um contrato</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docsFiltrados.map(doc => (
            <DocumentCard key={doc.token} doc={doc} onRefresh={carregar} />
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white/60 disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white/50 text-sm">Página {pagina} de {totalPaginas}</span>
          <button
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white/60 disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <ModalNovoDocumento
          onClose={() => setModalAberto(false)}
          onSuccess={carregar}
        />
      )}
    </div>
  )
}
