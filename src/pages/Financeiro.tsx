// ============================================================
// BEN GROWTH CENTER — Página Financeiro (Asaas)
// ============================================================

import React, { useEffect, useState, useCallback } from 'react'
import {
  DollarSign, Plus, RefreshCw, Search, Copy, ExternalLink,
  CheckCircle2, Clock, AlertCircle, XCircle, Wifi, WifiOff,
  QrCode, FileText, CreditCard, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Banknote, User, Filter
} from 'lucide-react'
import {
  AsaasService, AsaasPaymentResponse, AsaasPaymentStatus,
  AsaasPaymentType, PLANOS_HONORARIOS
} from '../lib/asaas'

// ─── Helpers ──────────────────────────────────────────────────
const fmtValor  = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtData   = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
const copyText  = (t: string)  => navigator.clipboard.writeText(t).catch(() => {})

const TIPO_ICON: Record<string, React.ReactNode> = {
  PIX:         <QrCode  className="w-4 h-4 text-emerald-400" />,
  BOLETO:      <FileText className="w-4 h-4 text-amber-400" />,
  CREDIT_CARD: <CreditCard className="w-4 h-4 text-blue-400" />,
}

// ─── StatusBadge ──────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING:          { label: '⏳ Aguardando', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    RECEIVED:         { label: '✅ Recebido',   cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    CONFIRMED:        { label: '✅ Confirmado', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    OVERDUE:          { label: '🔴 Vencido',    cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
    REFUNDED:         { label: '↩️ Estornado',  cls: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
    RECEIVED_IN_CASH: { label: '💵 Em dinheiro',cls: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  }
  const s = map[status] || { label: status, cls: 'bg-slate-500/20 text-slate-300 border-slate-500/30' }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>{s.label}</span>
}

// ─── Modal Nova Cobrança ───────────────────────────────────────
const ModalNovaCobranca = ({
  onClose, onSuccess
}: { onClose: () => void; onSuccess: () => void }) => {
  const [customerId, setCustomerId]   = useState('')
  const [nomeCliente, setNomeCliente] = useState('')
  const [cpfCnpj, setCpfCnpj]         = useState('')
  const [tipo, setTipo]               = useState<AsaasPaymentType>('PIX')
  const [valor, setValor]             = useState('')
  const [descricao, setDescricao]     = useState('')
  const [vencimento, setVencimento]   = useState('')
  const [usarPlano, setUsarPlano]     = useState(false)
  const [planoKey, setPlanoKey]       = useState<keyof typeof PLANOS_HONORARIOS>('consulta_avulsa')
  const [loading, setLoading]         = useState(false)
  const [erro, setErro]               = useState('')
  const [criandoCliente, setCriandoCliente] = useState(false)
  const [clienteCriado, setClienteCriado]   = useState('')

  const planoSelecionado = PLANOS_HONORARIOS[planoKey]

  const criarOuBuscarCliente = async (): Promise<string> => {
    if (customerId.trim()) return customerId.trim()
    setCriandoCliente(true)
    const cli = await AsaasService.criarCliente({
      name: nomeCliente.trim(),
      cpfCnpj: cpfCnpj.replace(/\D/g, ''),
    })
    setCriandoCliente(false)
    setClienteCriado(cli.id)
    return cli.id
  }

  const handleSubmit = async () => {
    if (!usarPlano && (!valor || !descricao || !vencimento))
      return setErro('Preencha valor, descrição e vencimento.')
    if (!customerId.trim() && (!nomeCliente.trim() || !cpfCnpj.trim()))
      return setErro('Informe o ID do cliente Asaas ou Nome + CPF/CNPJ.')
    setErro('')
    setLoading(true)
    try {
      const cliId = await criarOuBuscarCliente()
      if (usarPlano) {
        await AsaasService.cobrarPorPlano(cliId, planoKey)
      } else {
        await AsaasService.criarCobranca({
          customer: cliId,
          billingType: tipo,
          value: parseFloat(valor.replace(',', '.')),
          dueDate: vencimento,
          description: descricao.trim(),
        })
      }
      onSuccess()
      onClose()
    } catch (e: any) {
      setErro(e.message || 'Erro ao criar cobrança.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1629] border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Nova Cobrança</h2>
              <p className="text-white/50 text-sm">Pix · Boleto · Cartão via Asaas</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/80">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Usar plano pré-configurado */}
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
            <input type="checkbox" id="usarPlano" checked={usarPlano}
              onChange={e => setUsarPlano(e.target.checked)} className="accent-emerald-500 w-4 h-4" />
            <label htmlFor="usarPlano" className="text-white/80 text-sm cursor-pointer">
              Usar plano de honorários pré-configurado
            </label>
          </div>

          {/* Planos */}
          {usarPlano && (
            <div>
              <label className="text-white/70 text-sm font-medium mb-2 block">Plano</label>
              <div className="grid grid-cols-1 gap-2">
                {(Object.entries(PLANOS_HONORARIOS) as [keyof typeof PLANOS_HONORARIOS, typeof planoSelecionado][]).map(([key, p]) => (
                  <button key={key} onClick={() => setPlanoKey(key)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      planoKey === key
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                    }`}>
                    <span className="text-sm font-medium">{p.nome}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40">{p.tipo}</span>
                      <span className="text-sm font-bold text-emerald-400">{fmtValor(p.valor)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Campos manuais */}
          {!usarPlano && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/70 text-sm font-medium mb-1.5 block">Valor (R$) *</label>
                  <input value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-white/70 text-sm font-medium mb-1.5 block">Vencimento *</label>
                  <input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div>
                <label className="text-white/70 text-sm font-medium mb-1.5 block">Descrição *</label>
                <input value={descricao} onChange={e => setDescricao(e.target.value)}
                  placeholder="Ex: Honorários advocatícios — Tributário"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-white/70 text-sm font-medium mb-2 block">Forma de Pagamento</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PIX', 'BOLETO', 'CREDIT_CARD'] as AsaasPaymentType[]).map(t => (
                    <button key={t} onClick={() => setTipo(t)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                        tipo === t ? 'border-emerald-500 bg-emerald-500/10 text-white' : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
                      }`}>
                      {TIPO_ICON[t]}
                      {t === 'CREDIT_CARD' ? 'Cartão' : t}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <hr className="border-white/10" />

          {/* Cliente */}
          <div>
            <label className="text-white/70 text-sm font-medium mb-1.5 block">ID do Cliente Asaas (se já cadastrado)</label>
            <input value={customerId} onChange={e => setCustomerId(e.target.value)}
              placeholder="cus_XXXXXXXXXXXXXXXX"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500 font-mono text-sm" />
            <p className="text-white/30 text-xs mt-1">Ou preencha Nome + CPF/CNPJ abaixo para criar automaticamente</p>
          </div>
          {!customerId && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/70 text-sm font-medium mb-1.5 block">Nome do Cliente</label>
                <input value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} placeholder="Nome completo"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-white/70 text-sm font-medium mb-1.5 block">CPF / CNPJ</label>
                <input value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value)} placeholder="000.000.000-00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>
          )}
          {clienteCriado && (
            <p className="text-emerald-400 text-xs">✅ Cliente criado: <span className="font-mono">{clienteCriado}</span></p>
          )}

          {/* Erro */}
          {erro && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{erro}
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white transition-all">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={loading || criandoCliente}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
              {criandoCliente ? 'Criando cliente...' : loading ? 'Gerando...' : 'Gerar Cobrança'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Card de Cobrança ─────────────────────────────────────────
const CobrancaCard = ({ pag, onRefresh }: { pag: AsaasPaymentResponse; onRefresh: () => void }) => {
  const [pixModal, setPixModal]   = useState(false)
  const [pixData, setPixData]     = useState<{ payload: string; encodedImage: string } | null>(null)
  const [loadingPix, setLoadingPix] = useState(false)
  const [canceling, setCanceling]   = useState(false)

  const handleVerPix = async () => {
    if (pag.pixPayload) {
      setPixData({ payload: pag.pixPayload, encodedImage: pag.pixQrCodeImg || '' })
      setPixModal(true)
      return
    }
    setLoadingPix(true)
    try {
      const qr = await AsaasService.buscarPixQrCode(pag.id)
      setPixData(qr)
      setPixModal(true)
    } catch { alert('Erro ao buscar QR Code') }
    finally { setLoadingPix(false) }
  }

  const handleCancelar = async () => {
    if (!confirm('Cancelar esta cobrança?')) return
    setCanceling(true)
    try { await AsaasService.cancelarCobranca(pag.id); onRefresh() }
    catch { alert('Erro ao cancelar') }
    finally { setCanceling(false) }
  }

  return (
    <>
      <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/5 rounded-xl mt-0.5">
              {TIPO_ICON[pag.billingType] || <DollarSign className="w-4 h-4 text-white/40" />}
            </div>
            <div>
              <p className="text-white font-semibold">{pag.description || 'Cobrança Asaas'}</p>
              <p className="text-white/40 text-xs mt-0.5 font-mono">{pag.id}</p>
              <div className="flex items-center gap-3 mt-2">
                <StatusBadge status={pag.status} />
                <span className="text-white/40 text-xs">Venc: {fmtData(pag.dueDate)}</span>
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-white font-bold text-lg">{fmtValor(pag.value)}</p>
            {pag.netValue && pag.netValue !== pag.value && (
              <p className="text-white/30 text-xs">líq. {fmtValor(pag.netValue)}</p>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
          {pag.billingType === 'PIX' && pag.status === 'PENDING' && (
            <button onClick={handleVerPix} disabled={loadingPix}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50">
              {loadingPix ? <RefreshCw className="w-3 h-3 animate-spin" /> : <QrCode className="w-3 h-3" />}
              Ver QR Code
            </button>
          )}
          {pag.invoiceUrl && (
            <a href={pag.invoiceUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all">
              <ExternalLink className="w-3 h-3" /> Link Pagamento
            </a>
          )}
          {pag.bankSlipUrl && (
            <a href={pag.bankSlipUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all">
              <FileText className="w-3 h-3" /> Boleto PDF
            </a>
          )}
          {pag.status === 'PENDING' && (
            <button onClick={handleCancelar} disabled={canceling}
              className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50">
              {canceling ? <RefreshCw className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Modal QR Code Pix */}
      {pixModal && pixData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPixModal(false)}>
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-lg mb-4 text-center flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-400" /> Pix QR Code
            </h3>
            {pixData.encodedImage && (
              <img src={`data:image/png;base64,${pixData.encodedImage}`} alt="QR Code Pix"
                className="w-48 h-48 mx-auto rounded-xl mb-4" />
            )}
            <div className="bg-black/30 rounded-xl p-3 mb-4">
              <p className="text-white/50 text-xs mb-1">Pix copia e cola:</p>
              <p className="text-white text-xs font-mono break-all">{pixData.payload}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => copyText(pixData.payload)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all">
                <Copy className="w-4 h-4" /> Copiar
              </button>
              <button onClick={() => setPixModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-sm transition-all">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Página Principal ──────────────────────────────────────────
export default function Financeiro() {
  const [cobrancas, setCobrancas]       = useState<AsaasPaymentResponse[]>([])
  const [loading, setLoading]           = useState(true)
  const [conexao, setConexao]           = useState<'ok' | 'erro' | 'verificando'>('verificando')
  const [conta, setConta]               = useState('')
  const [saldo, setSaldo]               = useState<number | null>(null)
  const [busca, setBusca]               = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [pagina, setPagina]             = useState(1)
  const [totalCount, setTotalCount]     = useState(0)
  const [modalAberto, setModalAberto]   = useState(false)
  const LIMIT = 20

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const offset = (pagina - 1) * LIMIT
      const res = await AsaasService.listarCobrancas(
        offset, LIMIT,
        filtroStatus !== 'todos' ? filtroStatus : undefined
      )
      setCobrancas(res.data || [])
      setTotalCount(res.totalCount || 0)
    } catch {
      setCobrancas([])
    } finally {
      setLoading(false)
    }
  }, [pagina, filtroStatus])

  const testar = useCallback(async () => {
    setConexao('verificando')
    const r = await AsaasService.testarConexao()
    setConexao(r.ok ? 'ok' : 'erro')
    if (r.conta)  setConta(r.conta)
    if (r.saldo != null) setSaldo(r.saldo)
  }, [])

  useEffect(() => { testar(); carregar() }, [testar, carregar])

  const cobrancasFiltradas = cobrancas.filter(c =>
    busca === '' || (c.description || '').toLowerCase().includes(busca.toLowerCase()) || c.id.includes(busca)
  )

  const totalPaginas = Math.ceil(totalCount / LIMIT) || 1

  // Stats
  const recebido   = cobrancas.filter(c => ['RECEIVED','CONFIRMED'].includes(c.status)).reduce((s,c) => s + c.value, 0)
  const pendente   = cobrancas.filter(c => c.status === 'PENDING').reduce((s,c)  => s + c.value, 0)
  const vencido    = cobrancas.filter(c => c.status === 'OVERDUE').reduce((s,c)  => s + c.value, 0)

  return (
    <div className="min-h-screen bg-[#070d1f] text-white p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <DollarSign className="w-7 h-7 text-emerald-400" />
            Financeiro — Asaas
          </h1>
          <p className="text-white/50 text-sm mt-1">Cobranças, Pix, Boleto e Cartão</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Status conexão */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${
            conexao === 'ok'    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : conexao === 'erro'? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            {conexao === 'ok' ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {conexao === 'ok'
              ? `Conectado${conta ? ` · ${conta}` : ''}`
              : conexao === 'erro' ? 'Desconectado' : 'Verificando…'}
          </div>
          <button onClick={carregar} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white/60 transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setModalAberto(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-all">
            <Plus className="w-4 h-4" /> Nova Cobrança
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Saldo Asaas',  value: saldo != null ? fmtValor(saldo) : '—', icon: <Banknote className="w-5 h-5" />, color: 'text-white', bg: 'bg-white/5', border: 'border-white/10' },
          { label: 'Recebido',     value: fmtValor(recebido), icon: <TrendingUp className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { label: 'A Receber',    value: fmtValor(pendente), icon: <Clock className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
          { label: 'Vencido',      value: fmtValor(vencido),  icon: <TrendingDown className="w-5 h-5" />, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={s.color}>{s.icon}</div>
              <p className="text-white/50 text-xs font-medium">{s.label}</p>
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar cobrança..."
            className="w-full pl-9 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'todos',    label: 'Todos' },
            { key: 'PENDING',  label: '⏳ Pendente' },
            { key: 'RECEIVED', label: '✅ Recebido' },
            { key: 'OVERDUE',  label: '🔴 Vencido' },
          ].map(f => (
            <button key={f.key} onClick={() => { setFiltroStatus(f.key); setPagina(1) }}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                filtroStatus === f.key
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      ) : cobrancasFiltradas.length === 0 ? (
        <div className="text-center py-20">
          <DollarSign className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 font-medium">Nenhuma cobrança encontrada</p>
          <p className="text-white/25 text-sm mt-1">Clique em "Nova Cobrança" para gerar um Pix ou Boleto</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cobrancasFiltradas.map(pag => (
            <CobrancaCard key={pag.id} pag={pag} onRefresh={carregar} />
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white/60 disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white/50 text-sm">{pagina} / {totalPaginas} · {totalCount} cobranças</span>
          <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white/60 disabled:opacity-30">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {modalAberto && (
        <ModalNovaCobranca onClose={() => setModalAberto(false)} onSuccess={carregar} />
      )}
    </div>
  )
}
