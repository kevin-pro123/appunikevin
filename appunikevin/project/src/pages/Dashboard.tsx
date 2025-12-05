import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { BookOpen, MessageSquare, Calendar, Layers, Bell } from 'lucide-react'
import './Dashboard.css'

interface Stats {
  courses: number
  messages: number
  reservations: number
  notifications: number
}

export default function Dashboard() {
  const profile = useAuthStore((state) => state.profile)
  const [stats, setStats] = useState<Stats>({
    courses: 0,
    messages: 0,
    reservations: 0,
    notifications: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!profile?.id) return

        const [coursesRes, messagesRes, reservationsRes, notificationsRes] = await Promise.all([
          supabase.from('courses').select('id', { count: 'exact' }),
          supabase.from('messages').select('id', { count: 'exact' }).eq('user_id', profile.id),
          supabase.from('reservations').select('id', { count: 'exact' }).eq('user_id', profile.id),
          supabase.from('notifications').select('id', { count: 'exact' }).eq('user_id', profile.id).eq('is_read', false)
        ])

        setStats({
          courses: coursesRes.count || 0,
          messages: messagesRes.count || 0,
          reservations: reservationsRes.count || 0,
          notifications: notificationsRes.count || 0
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [profile?.id])

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Bienvenido, {profile?.full_name}</h1>
        <p>Tu plataforma universitaria integral</p>
      </div>

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <BookOpen size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Cursos</p>
              <p className="stat-value">{stats.courses}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <MessageSquare size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Mensajes</p>
              <p className="stat-value">{stats.messages}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <Layers size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Reservas</p>
              <p className="stat-value">{stats.reservations}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">
              <Bell size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Notificaciones</p>
              <p className="stat-value">{stats.notifications}</p>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-section">
        <h2>Información de la Plataforma</h2>
        <div className="info-cards">
          <div className="info-card">
            <h3>Gestión de Horarios</h3>
            <p>Consulta tu horario de clases, aulas y ubicaciones en tiempo real.</p>
          </div>
          <div className="info-card">
            <h3>Comunicación Integral</h3>
            <p>Chat en tiempo real con profesores y compañeros de clase.</p>
          </div>
          <div className="info-card">
            <h3>Biblioteca Digital</h3>
            <p>Accede a recursos bibliográficos digitales y documentación académica.</p>
          </div>
          <div className="info-card">
            <h3>Reservas Inteligentes</h3>
            <p>Reserva aulas y salas de estudio con verificación de ocupación en tiempo real.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
