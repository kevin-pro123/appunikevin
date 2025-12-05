import { ReactNode, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, Home, BookOpen, MessageSquare, Layers, Calendar, Map, Bell } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
  role: string
}

export default function Layout({ children, role }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const { profile, signOut } = useAuthStore()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const navItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/schedules', icon: Calendar, label: 'Horarios' },
    { path: '/map', icon: Map, label: 'Mapa del Campus' },
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/library', icon: BookOpen, label: 'Biblioteca' },
    { path: '/reservations', icon: Layers, label: 'Reservas' },
    { path: '/notifications', icon: Bell, label: 'Notificaciones' }
  ]

  return (
    <div className="layout">
      {/* Mobile Sidebar Toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>UniApp</h1>
          <span className="role-badge">{role}</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="nav-item"
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            {profile?.avatar_url && (
              <img src={profile.avatar_url} alt={profile.full_name} className="avatar" />
            )}
            <div>
              <p className="user-name">{profile?.full_name || 'Usuario'}</p>
              <p className="user-email">{profile?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span>Salir</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </main>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
