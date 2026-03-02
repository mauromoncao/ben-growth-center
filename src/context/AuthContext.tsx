// ============================================================
// BEN GROWTH CENTER — Auth Context
// Acesso: mauromoncaoestudos@gmail.com / BenGrowth@2026!
// ============================================================
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthUser {
  email: string
  nome: string
  modulo: string
}

interface AuthContextType {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<{ ok: boolean; erro?: string }>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = 'ben_growth_auth'

// Credenciais válidas — alterar senha via painel de Configurações
const CREDENCIAIS = [
  {
    email: 'mauromoncaoestudos@gmail.com',
    senha: 'BenGrowth@2026!',
    nome: 'Mauro Monção',
    modulo: 'Ben Growth Center',
  },
  {
    email: 'mauro@moncaoadvogados.com.br',
    senha: 'BenGrowth@2026!',
    nome: 'Mauro Monção',
    modulo: 'Ben Growth Center',
  },
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const login = async (email: string, password: string): Promise<{ ok: boolean; erro?: string }> => {
    // Simula latência de autenticação
    await new Promise(r => setTimeout(r, 800))

    const cred = CREDENCIAIS.find(
      c => c.email.toLowerCase() === email.toLowerCase() && c.senha === password
    )

    if (!cred) {
      return { ok: false, erro: 'E-mail ou senha incorretos.' }
    }

    const authUser: AuthUser = {
      email: cred.email,
      nome: cred.nome,
      modulo: cred.modulo,
    }

    setUser(authUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
    return { ok: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
