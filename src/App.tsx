import React from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import {
  LayoutDashboard, Megaphone, FileText,
  Users, Bot, Search, Settings, LogOut, Bell,
  Building2, Shield, MessageSquare,
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
      style={{ background: '#FFFFFF', borderRight: '1px solid #E5E7EB' }}
    >
      {/* Logo */}
      <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #F3F4F6' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#1E40AF' }}
          >
            <TrendingUp size={16} style={{ color: '#FFFFFF' }} />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight" style={{ color: '#111827' }}>Ben Growth Center</h1>
            <p className="text-xs font-medium" style={{ color: '#D4A017' }}>Inteligência Comercial</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5">
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="text-xs font-semibold px-2 mb-1 tracking-wider"
              style={{ color: '#9CA3AF' }}>
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
                    className="flex items-center gap-2.5 py-2 rounded-lg transition-all text-sm"
                    style={isActive
                      ? { background: '#EFF6FF', color: '#1E40AF', fontWeight: 600, borderLeft: '3px solid #1E40AF', paddingLeft: '9px', paddingRight: '8px' }
                      : { color: '#6B7280', borderLeft: '3px solid transparent', paddingLeft: '9px', paddingRight: '8px' }
                    }
                    onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; (e.currentTarget as HTMLElement).style.color = '#374151'; } }}
                    onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6B7280'; } }}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid #F3F4F6' }}>
        <div className="mb-3">
          <div className="flex items-center gap-2 rounded-lg px-3 py-1.5"
            style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium" style={{ color: '#16A34A' }}>Sistema Ativo</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#D4A017', color: '#FFFFFF' }}>
            <span className="text-xs font-bold">MM</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#111827' }}>Mauro Monção</p>
            <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>Tributarista · OAB/PI</p>
          </div>
          <button className="transition-colors p-1" style={{ color: '#9CA3AF' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}>
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
      style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}
    >
      <div>
        <p className="font-semibold text-sm" style={{ color: '#111827' }}>
          Ben Growth Center
        </p>
        <p className="text-xs capitalize" style={{ color: '#9CA3AF' }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {/* Status agentes */}
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', fontSize: '0.75rem', fontWeight: 500 }}>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span>7 Agentes Ativos</span>
        </div>
        {/* Notificações */}
        <button className="relative p-2 rounded-lg transition-colors"
          style={{ color: '#9CA3AF' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#374151')}
          onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}>
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
    <div className="flex" style={{ background: '#F7F9FC', minHeight: '100vh' }}>
      <Sidebar />
      <div className="flex-1 ml-64">
        <TopBar />
        <main className="pt-14 min-h-screen" style={{ background: '#F7F9FC' }}>
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
        style={{ background: '#1E40AF', color: '#FFFFFF' }}>
        <span className="text-xs font-bold">{initials}</span>
      </div>
      <button
        onClick={logout}
        title="Sair"
        className="p-1.5 rounded-lg transition-colors"
        style={{ color: '#9CA3AF' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
        onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}>
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
