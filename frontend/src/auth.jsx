import { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(getToken()))

  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }

    let active = true
    api
      .me()
      .then((data) => {
        if (active) setUser(data.user)
      })
      .catch(() => {
        setToken(null)
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function login(credentials) {
    const data = await api.login(credentials)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  async function register(payload) {
    const data = await api.register(payload)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  function logout() {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
