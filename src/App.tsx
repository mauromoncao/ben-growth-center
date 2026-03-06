import React from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import {
  LayoutDashboard, Megaphone, FileText,
  Users, Bot, Search, Settings, LogOut, Bell,
  Briefcase, Shield, MessageSquare,
  BarChart3, Plug, Workflow, TrendingUp, Scale, FileSignature, DollarSign,
  Target, GitBranch, LineChart, CreditCard, Cpu, Zap, Kanban, Headphones
} from 'lucide-react'

// Pages
import HubComercial    from './pages/HubComercial'
import Dashboard       from './pages/Dashboard'
import Campanhas       from './pages/Campanhas'
import Analytics       from './pages/Analytics'
import Conteudo        from './pages/Conteudo'
import CRM             from './pages/CRM'
import Leads           from './pages/Leads'
import Agentes         from './pages/Agentes'
import PalavrasChave   from './pages/PalavrasChave'
import Configuracoes   from './pages/Configuracoes'
import Plantonista     from './pages/Plantonista'
import DrBenIntegracao from './pages/DrBenIntegracao'
import Integracoes     from './pages/Integracoes'
import FlowBuilder     from './pages/FlowBuilder'
import IntegracaoJuris from './pages/IntegracaoJuris'
import Assinaturas     from './pages/Assinaturas'
import Financeiro      from './pages/Financeiro'
import MetaAds         from './pages/MetaAds'
import GoogleAds       from './pages/GoogleAds'
import WhatsAppConnect from './pages/WhatsAppConnect'
import MaraIA         from './pages/MaraIA'
import MaraMobile     from './pages/MaraMobile'

// ─── Rota privada ─────────────────────────────────────────────
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

// ─── Estrutura de navegação ────────────────────────────────────
const navGroups = [
  {
    label: 'PAINEL',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    ],
  },
  {
    label: 'BEN HUB',
    items: [
      { to: '/',                  icon: Briefcase,  label: 'Hub Comercial', exact: true },
      { to: '/integracao-juris',  icon: Scale,      label: 'Integração Juris' },
    ],
  },
  {
    label: 'CRM & LEADS',
    items: [
      { to: '/crm',   icon: Kanban, label: 'CRM' },
      { to: '/leads', icon: Users,  label: 'Leads' },
    ],
  },
  {
    label: 'MARA IA',
    items: [
      { to: '/mara-ia',       icon: Bot,           label: 'MARA IA' },
      { to: '/plantonista',   icon: Headphones,    label: 'Plantonista' },
      { to: '/whatsapp',      icon: MessageSquare, label: 'Dr. Ben — WhatsApp' },
    ],
  },
  {
    label: 'MARKETING',
    items: [
      { to: '/campanhas',      icon: Megaphone,  label: 'Campanhas' },
      { to: '/conteudo',       icon: FileText,   label: 'Conteúdo' },
      { to: '/palavras-chave', icon: Search,     label: 'Palavras-chave' },
      { to: '/google-ads',     icon: BarChart3,  label: 'Google Ads' },
      { to: '/meta-ads',       icon: Target,     label: 'Meta Ads' },
    ],
  },
  {
    label: 'AGENTES IA',
    items: [
      { to: '/agentes',      icon: Bot,       label: 'Agentes' },
      { to: '/flow-builder', icon: GitBranch, label: 'Flow Builder' },
      { to: '/analytics',    icon: LineChart, label: 'Analytics' },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { to: '/financeiro',       icon: DollarSign,    label: 'Financeiro' },
      { to: '/assinaturas',      icon: CreditCard,    label: 'Assinaturas' },
      { to: '/integracoes',      icon: Zap,           label: 'Integrações' },
      { to: '/dr-ben',           icon: Cpu,           label: 'Dr.Ben Integração' },
      { to: '/configuracoes',    icon: Settings,      label: 'Configurações' },
    ],
  },
]

// ─── Mapa de breadcrumb por rota ───────────────────────────────
const breadcrumbMap: Record<string, { section: string; page: string }> = {
  '/dashboard':       { section: 'PAINEL',       page: 'Dashboard' },
  '/':                { section: 'BEN HUB',       page: 'Hub Comercial' },
  '/integracao-juris':{ section: 'BEN HUB',       page: 'Integração Juris' },
  '/crm':             { section: 'CRM & LEADS',   page: 'CRM' },
  '/leads':           { section: 'CRM & LEADS',   page: 'Leads' },
  '/mara-ia':         { section: 'MARA IA',        page: 'MARA IA — Assistente Pessoal' },
  '/plantonista':     { section: 'MARA IA',        page: 'Plantonista' },
  '/whatsapp':        { section: 'MARA IA',        page: 'Dr. Ben — Assistente Jurídico' },
  '/campanhas':       { section: 'MARKETING',      page: 'Campanhas' },
  '/conteudo':        { section: 'MARKETING',      page: 'Conteúdo' },
  '/palavras-chave':  { section: 'MARKETING',      page: 'Palavras-chave' },
  '/google-ads':      { section: 'MARKETING',      page: 'Google Ads' },
  '/meta-ads':        { section: 'MARKETING',      page: 'Meta Ads' },
  '/agentes':         { section: 'AGENTES IA',     page: 'Agentes' },
  '/flow-builder':    { section: 'AGENTES IA',     page: 'Flow Builder' },
  '/analytics':       { section: 'AGENTES IA',     page: 'Analytics' },
  '/financeiro':      { section: 'SISTEMA',        page: 'Financeiro' },
  '/assinaturas':     { section: 'SISTEMA',        page: 'Assinaturas' },
  '/integracoes':     { section: 'SISTEMA',        page: 'Integrações' },
  '/dr-ben':          { section: 'SISTEMA',        page: 'Dr.Ben Integração' },
  '/configuracoes':   { section: 'SISTEMA',        page: 'Configurações' },
}

// ─── Sidebar ───────────────────────────────────────────────────
function Sidebar() {
  const location = useLocation()
  const { logout } = useAuth()

  return (
    <aside
      className="w-56 min-h-screen flex flex-col fixed left-0 top-0 z-40 overflow-y-auto"
      style={{ background: '#0f2044', borderRight: '1px solid #0a1830' }}
    >
      {/* Logo / Brand */}
      <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #1a3060' }}>
        <div className="flex items-center gap-3">
          {/* Círculo dourado com B */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#D4A017' }}
          >
            <span className="text-sm font-bold text-white">B</span>
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight" style={{ color: '#FFFFFF' }}>
              Ben Growth Center
            </h1>
            <p className="text-[10px] font-medium tracking-wide" style={{ color: '#93C5FD' }}>
              Centro de Inteligência Comercial
            </p>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-2 py-3 space-y-3 overflow-y-auto">
        {navGroups.map(group => (
          <div key={group.label}>
            <p
              className="text-[10px] font-semibold px-2 mb-1 tracking-wider uppercase"
              style={{ color: '#60A5FA' }}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const isActive = item.exact
                  ? location.pathname === item.to
                  : location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    className="flex items-center gap-2 py-1.5 rounded-md transition-all text-[13px] font-medium"
                    style={
                      isActive
                        ? {
                            background: '#0a1830',
                            color: '#FFFFFF',
                            fontWeight: 600,
                            borderLeft: '3px solid #D4A017',
                            paddingLeft: '9px',
                            paddingRight: '8px',
                          }
                        : {
                            color: '#BFDBFE',
                            borderLeft: '3px solid transparent',
                            paddingLeft: '9px',
                            paddingRight: '8px',
                          }
                    }
                    onMouseEnter={e => {
                      if (!isActive) {
                        ;(e.currentTarget as HTMLElement).style.background = '#1a3060'
                        ;(e.currentTarget as HTMLElement).style.color = '#FFFFFF'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                        ;(e.currentTarget as HTMLElement).style.color = '#BFDBFE'
                      }
                    }}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Rodapé */}
      <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: '1px solid #1a3060' }}>
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg"
          style={{ background: '#0a1830' }}>
          {/* Avatar dourado */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#D4A017', color: '#FFFFFF' }}
          >
            <span className="text-[10px] font-bold">MM</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: '#FFFFFF' }}>
              Mauro Monção
            </p>
            <p className="text-[10px] truncate" style={{ color: '#93C5FD' }}>
              OAB/PI · Tributarista
            </p>
          </div>
          <button
            onClick={logout}
            title="Sair"
            className="p-1 rounded transition-colors flex-shrink-0"
            style={{ color: '#60A5FA' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#FCA5A5')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#60A5FA')}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}

// ─── TopBar ────────────────────────────────────────────────────
function TopBar() {
  const location = useLocation()
  const { user } = useAuth()

  // Iniciais do usuário para o avatar
  const initials = user?.nome
    ? user.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'MM'

  // Breadcrumb baseado na rota atual
  const crumb = breadcrumbMap[location.pathname] || { section: 'BEN HUB', page: 'Hub Comercial' }

  return (
    <header
      className="h-14 fixed top-0 left-0 right-0 z-30 flex items-center"
      style={{ background: '#0f2044', borderBottom: '1px solid #0a1830' }}
    >
      {/* Zona da Sidebar: briefcase centralizado em w-56 (224px) */}
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: '224px', borderRight: '1px solid #1a3060', height: '100%' }}
      >
        <Briefcase className="w-5 h-5" style={{ color: '#FFFFFF' }} />
      </div>

      {/* Breadcrumb */}
      <div className="flex-1 flex items-center px-6">
        <span className="text-xs font-semibold" style={{ color: '#93C5FD' }}>
          {crumb.section}
        </span>
        <span className="mx-2 text-xs" style={{ color: '#60A5FA' }}>›</span>
        <span className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
          {crumb.page}
        </span>
      </div>

      {/* Direita: Bell + separador + Avatar */}
      <div className="flex items-center px-5 gap-3">
        {/* Sino */}
        <button
          className="relative p-2 rounded-lg transition-colors"
          style={{ color: '#FFFFFF' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#BFDBFE')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#FFFFFF')}
          title="Notificações"
        >
          <Bell className="w-5 h-5" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: '#F59E0B' }}
          />
        </button>

        {/* Separador vertical */}
        <div className="w-px h-6" style={{ background: '#1a3060' }} />

        {/* Avatar com iniciais — fundo azul institucional */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer select-none"
          style={{ background: '#D4A017', color: '#FFFFFF' }}
          title={user?.nome || 'Usuário'}
        >
          <span className="text-xs font-bold">{initials}</span>
        </div>
      </div>
    </header>
  )
}

// ─── Layout ────────────────────────────────────────────────────
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex" style={{ background: '#F7F9FC', minHeight: '100vh' }}>
      <Sidebar />
      {/* Conteúdo principal deslocado pela sidebar (w-56 = 224px) */}
      <div className="flex-1" style={{ marginLeft: '224px' }}>
        <TopBar />
        <main className="pt-14 min-h-screen" style={{ background: '#F7F9FC' }}>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

// ─── Rotas ────────────────────────────────────────────────────
function AppRoutes() {
  const { isAuthenticated } = useAuth()
  return (
    <Routes>
      {/* ── Rota pública: App Mobile MARA IA (acesso via PIN) ── */}
      <Route path="/mara-app" element={<MaraMobile />} />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/"                   element={<HubComercial />} />
                <Route path="/dashboard"          element={<Dashboard />} />
                <Route path="/crm"                element={<CRM />} />
                <Route path="/leads"              element={<Leads />} />
                <Route path="/mara-ia"            element={<MaraIA />} />
                <Route path="/plantonista"         element={<Plantonista />} />
                <Route path="/whatsapp"             element={<WhatsAppConnect />} />
                <Route path="/dr-ben"             element={<DrBenIntegracao />} />
                <Route path="/campanhas"          element={<Campanhas />} />
                <Route path="/analytics"          element={<Analytics />} />
                <Route path="/conteudo"           element={<Conteudo />} />
                <Route path="/palavras-chave"     element={<PalavrasChave />} />
                <Route path="/agentes"            element={<Agentes />} />
                <Route path="/integracoes"        element={<Integracoes />} />
                <Route path="/flow-builder"       element={<FlowBuilder />} />
                <Route path="/integracao-juris"   element={<IntegracaoJuris />} />
                <Route path="/assinaturas"         element={<Assinaturas />} />
                <Route path="/financeiro"          element={<Financeiro />} />
                <Route path="/meta-ads"            element={<MetaAds />} />
                <Route path="/google-ads"          element={<GoogleAds />} />
                <Route path="/configuracoes"      element={<Configuracoes />} />
                <Route path="*"                   element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
