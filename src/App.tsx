import React from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Megaphone, TrendingUp, FileText,
  Users, Bot, Search, Settings, LogOut, Bell,
  ChevronRight, TrendingDown, Building2, Shield, MessageSquare,
  BarChart3
} from 'lucide-react'

// Pages
import HubComercial from './pages/HubComercial'
import Dashboard from './pages/Dashboard'
import Campanhas from './pages/Campanhas'
import Analytics from './pages/Analytics'
import Conteudo from './pages/Conteudo'
import CRM from './pages/CRM'
import Leads from './pages/Leads'
import Agentes from './pages/Agentes'
import PalavrasChave from './pages/PalavrasChave'
import Configuracoes from './pages/Configuracoes'
import Plantonista from './pages/Plantonista'
import DrBenIntegracao from './pages/DrBenIntegracao'

const navGroups = [
  {
    label: 'VISÃO GERAL',
    items: [
      { to: '/', icon: Building2, label: 'Central Comercial', exact: true },
    ],
  },
  {
    label: 'CRM & ATENDIMENTO',
    items: [
      { to: '/crm', icon: Users, label: 'CRM — Pipeline' },
      { to: '/plantonista', icon: Shield, label: 'Plantonista & Alertas' },
      { to: '/dr-ben', icon: MessageSquare, label: 'Dr. Ben — IA' },
    ],
  },
  {
    label: 'TRÁFEGO & MARKETING',
    items: [
      { to: '/campanhas', icon: Megaphone, label: 'Campanhas' },
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/conteudo', icon: FileText, label: 'Conteúdo IA' },
      { to: '/palavras-chave', icon: Search, label: 'Palavras-chave' },
    ],
  },
  {
    label: 'INTELIGÊNCIA',
    items: [
      { to: '/agentes', icon: Bot, label: 'Agentes IA' },
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard Ads' },
      { to: '/configuracoes', icon: Settings, label: 'Configurações' },
    ],
  },
]

// Ícone SVG do Ben Growth Center
function BenGrowthIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="url(#bgGradient)" />
      <path d="M10 28 L16 18 L22 22 L30 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="30" cy="12" r="3" fill="#00b37e" />
      <path d="M10 32 L30 32" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round"/>
      <defs>
        <linearGradient id="bgGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a3a7e" />
          <stop offset="1" stopColor="#0f2044" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function Sidebar() {
  const location = useLocation()
  return (
    <aside className="w-64 bg-primary-900 min-h-screen flex flex-col fixed left-0 top-0 z-40 overflow-y-auto">
      {/* Logo Ben Growth Center */}
      <div className="p-5 border-b border-primary-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <BenGrowthIcon className="w-10 h-10 flex-shrink-0" />
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">Ben Growth Center</h1>
            <p className="text-growth-400 text-xs font-medium">Inteligência Comercial Jurídica</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-4">
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="text-primary-400 text-xs font-semibold px-3 mb-1 tracking-wider">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const isActive = item.exact
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to)
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-growth text-white shadow-sm'
                        : 'text-primary-200 hover:bg-primary-700 hover:text-white'
                    }`}
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
      <div className="p-4 border-t border-primary-700 flex-shrink-0">
        {/* Ben Growth tag */}
        <div className="mb-3 px-2">
          <div className="flex items-center gap-2 bg-growth-900 border border-growth-700 rounded-lg px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-growth-400 animate-pulse" />
            <span className="text-growth-300 text-xs font-medium">Sistema Ativo</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 bg-growth rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">MM</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">Mauro Monção</p>
            <p className="text-primary-300 text-xs">Tributarista · OAB/PI</p>
          </div>
          <button className="text-primary-300 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

function TopBar() {
  return (
    <header className="h-14 bg-white border-b border-slate-200 fixed top-0 right-0 left-64 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div>
          <p className="text-slate-800 font-semibold text-sm">Ben Growth Center</p>
          <p className="text-slate-400 text-xs">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* Status agentes */}
        <div className="flex items-center gap-1.5 bg-growth-50 border border-growth-200 rounded-full px-3 py-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-growth-500 animate-pulse" />
          <span className="text-growth-700 text-xs font-medium">7 Agentes Ativos</span>
        </div>
        {/* Notificações */}
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
        </button>
        {/* Avatar */}
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">MM</span>
        </div>
      </div>
    </header>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <TopBar />
        <main className="pt-14 min-h-screen bg-slate-50">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HubComercial />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/plantonista" element={<Plantonista />} />
          <Route path="/dr-ben" element={<DrBenIntegracao />} />
          <Route path="/campanhas" element={<Campanhas />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/conteudo" element={<Conteudo />} />
          <Route path="/palavras-chave" element={<PalavrasChave />} />
          <Route path="/agentes" element={<Agentes />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
