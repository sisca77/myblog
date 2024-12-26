import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import axios from 'axios'

interface User {
  username: string
  is_admin: boolean
}

interface LoginData {
  email: string
  password: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (data: LoginData) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const login = async (data: LoginData) => {
    try {
      setLoading(true)
      console.log('Login data received:', data)
      
      const requestData = {
        email: data.email,
        password: data.password
      }
      
      console.log('Sending request with data:', requestData)
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      console.log('Server response:', response.data)

      const { access_token, username, is_admin } = response.data
      
      localStorage.setItem('token', access_token)
      
      setUser({ username, is_admin })
      
    } catch (error) {
      console.error('Login error details:', error.response?.data)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
          const { username, is_admin } = response.data
          setUser({ username, is_admin })
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('token')
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
