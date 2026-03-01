import React from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import {
  LayoutDashboard, Megaphone, FileText,
  Users, Bot, Search, Settings, LogOut, Bell,
  ChevronRight, Building2, Shield, MessageSquare,
  BarChart3, Plug, Workflow, TrendingUp, Scale, FileSignature, DollarSign
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
import FlowBuilder       from './pages/FlowBuilder'
import IntegracaoJuris   from './pages/IntegracaoJuris'
import Assinaturas       from './pages/Assinaturas'
import Financeiro        from './pages/Financeiro'
import MetaAds          from './pages/MetaAds'
import GoogleAds        from './pages/GoogleAds'

// ─── Rota privada ─────────────────────────────────────────────
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

const navGroups = [
  {
    label: 'VISÃO GERAL',
    items: [
      { to: '/',         icon: Building2,       label: 'Central Comercial', exact: true },
    ],
  },
  {
    label: 'CRM & ATENDIMENTO',
    items: [
      { to: '/crm',          icon: Users,          label: 'CRM — Pipeline' },
      { to: '/plantonista',  icon: Shield,         label: 'Plantonista & Alertas' },
      { to: '/dr-ben',       icon: MessageSquare,  label: 'Dr. Ben — IA' },
      { to: '/flow-builder', icon: Workflow,       label: 'Dr. Ben Flow' },
    ],
  },
  {
    label: 'TRÁFEGO & MARKETING',
    items: [
      { to: '/campanhas',     icon: Megaphone,      label: 'Campanhas' },
      { to: '/meta-ads',      icon: BarChart3,      label: 'Meta Ads' },
      { to: '/google-ads',    icon: TrendingUp,     label: 'Google Ads' },
      { to: '/analytics',     icon: BarChart3,      label: 'Analytics' },
      { to: '/conteudo',      icon: FileText,       label: 'Conteúdo IA' },
      { to: '/palavras-chave',icon: Search,         label: 'Palavras-chave' },
    ],
  },
  {
    label: 'INTELIGÊNCIA',
    items: [
      { to: '/agentes',   icon: Bot,            label: 'Agentes IA' },
      { to: '/dashboard', icon: LayoutDashboard,label: 'Dashboard Ads' },
    ],
  },
  {
    label: 'DOCUMENTOS',
    items: [
      { to: '/assinaturas', icon: FileSignature, label: 'Assinaturas ZapSign' },
      { to: '/financeiro',  icon: DollarSign,    label: 'Financeiro Asaas' },
    ],
  },
  {
    label: 'ECOSSISTEMA',
    items: [
      { to: '/integracao-juris', icon: Scale,   label: 'Ben Juris Center' },
      { to: '/integracoes',      icon: Plug,    label: 'Integrações' },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { to: '/configuracoes', icon: Settings, label: 'Configurações' },
    ],
  },
]

function Sidebar() {
  const location = useLocation()
  return (
    <aside
      className="w-64 min-h-screen flex flex-col fixed left-0 top-0 z-40 overflow-y-auto"
      style={{ background: '#0a1628', borderRight: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Logo */}
      <div className="p-5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
            style={{ background: 'linear-gradient(135deg, #1e3470, #0f2044)', border: '1px solid rgba(212,160,23,0.40)' }}
          >
            <TrendingUp size={18} style={{ color: '#D4A017' }} />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-white font-sans">Ben Growth Center</h1>
            <p className="text-xs font-medium font-sans" style={{ color: '#D4A017' }}>Inteligência Comercial</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-4">
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="text-xs font-semibold px-3 mb-1.5 font-sans tracking-wider"
              style={{ color: 'rgba(159,176,215,0.50)' }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const isActive = item.exact
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to)
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-sans"
                    style={isActive
                      ? { background: '#D4A017', color: '#0f2044', fontWeight: 700 }
                      : { color: 'rgba(159,176,215,0.85)' }
                    }
                    onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = '#ffffff'; } }}
                    onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(159,176,215,0.85)'; } }}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                    {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="mb-3">
          <div className="flex items-center gap-2 rounded-xl px-3 py-1.5"
            style={{ background: 'rgba(0,179,126,0.12)', border: '1px solid rgba(0,179,126,0.28)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium font-sans" style={{ color: '#6ee7b7' }}>Sistema Ativo</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#D4A017', color: '#0f2044' }}>
            <span className="text-sm font-bold">MM</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold font-sans truncate">Mauro Monção</p>
            <p className="text-xs font-sans truncate" style={{ color: 'rgba(159,176,215,0.65)' }}>Tributarista · OAB/PI</p>
          </div>
          <button className="transition-colors" style={{ color: 'rgba(159,176,215,0.65)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(159,176,215,0.65)')}>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

function TopBar() {
  return (
    <header
      className="h-14 fixed top-0 right-0 left-64 z-30 flex items-center justify-between px-6"
      style={{ background: '#0f2044', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div>
        <p className="font-semibold text-sm font-serif text-white" style={{ letterSpacing: '-0.01em' }}>
          Ben Growth Center
        </p>
        <p className="text-xs font-sans" style={{ color: 'rgba(159,176,215,0.70)' }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {/* Status agentes */}
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{ background: 'rgba(0,179,126,0.15)', border: '1px solid rgba(0,179,126,0.35)', color: '#6ee7b7', fontSize: '0.75rem', fontWeight: 500 }}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-sans">7 Agentes Ativos</span>
        </div>
        {/* Notificações */}
        <button className="relative p-2 rounded-lg transition-colors"
          style={{ color: 'rgba(159,176,215,0.70)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(159,176,215,0.70)')}>
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
        </button>
        {/* Avatar + Logout */}
        <LogoutButton />
      </div>
    </header>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex" style={{ background: '#0f2044', minHeight: '100vh' }}>
      <Sidebar />
      <div className="flex-1 ml-64">
        <TopBar />
        <main className="pt-14 min-h-screen" style={{ background: '#0f2044' }}>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

function LogoutButton() {
  const { user, logout } = useAuth()
  const initials = user?.nome?.split(' ').map(n => n[0]).slice(0, 2).join('') || 'MM'
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: '#D4A017', color: '#0f2044' }}>
        <span className="text-xs font-bold">{initials}</span>
      </div>
      <button
        onClick={logout}
        title="Sair"
        className="p-1.5 rounded-lg transition-colors"
        style={{ color: 'rgba(159,176,215,0.60)' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(159,176,215,0.60)')}>
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  )
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
      } />
      <Route path="/*" element={
        <PrivateRoute>
          <Layout>
            <Routes>
              <Route path="/"                   element={<HubComercial />} />
              <Route path="/crm"                element={<CRM />} />
              <Route path="/plantonista"         element={<Plantonista />} />
              <Route path="/dr-ben"             element={<DrBenIntegracao />} />
              <Route path="/campanhas"          element={<Campanhas />} />
              <Route path="/analytics"          element={<Analytics />} />
              <Route path="/conteudo"           element={<Conteudo />} />
              <Route path="/palavras-chave"     element={<PalavrasChave />} />
              <Route path="/agentes"            element={<Agentes />} />
              <Route path="/dashboard"          element={<Dashboard />} />
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
      } />
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
