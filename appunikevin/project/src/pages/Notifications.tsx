import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Bell, Trash2 } from 'lucide-react'
import { Notification } from '../types'
import './Notifications.css'

export default function Notifications() {
  const profile = useAuthStore((state) => state.profile)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!profile?.id) return

        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setNotifications(data || [])
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    if (profile?.id) {
      fetchNotifications()
    }
  }, [profile?.id])

  useEffect(() => {
    if (!profile?.id) return

    const subscription = supabase
      .channel(`notifications:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [profile?.id])

  const handleMarkAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error

      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.is_read)
    : notifications

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      general: '📢',
      location: '📍',
      reservation: '🏫',
      message: '💬',
      course: '📚'
    }
    return icons[type] || '📢'
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      general: 'General',
      location: 'Ubicación',
      reservation: 'Reserva',
      message: 'Mensaje',
      course: 'Curso'
    }
    return labels[type] || type
  }

  return (
    <div className="notifications">
      <div className="page-header">
        <h1>Notificaciones</h1>
        <p>Gestiona tus alertas e informaciones importantes</p>
      </div>

      <div className="filter-tabs">
        <button
          className={`tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todas ({notifications.length})
        </button>
        <button
          className={`tab ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Sin Leer ({notifications.filter((n) => !n.is_read).length})
        </button>
      </div>

      {loading ? (
        <div className="loading">Cargando notificaciones...</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={48} />
          <p>{filter === 'unread' ? 'Sin notificaciones sin leer' : 'Sin notificaciones'}</p>
        </div>
      ) : (
        <div className="notifications-list">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              <div
                className="notification-content"
                onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
              >
                <div className="notification-header">
                  <h3>{notification.title}</h3>
                  <span className="notification-type">{getTypeLabel(notification.type)}</span>
                </div>
                <p className="notification-message">{notification.message}</p>
                <span className="notification-time">
                  {new Date(notification.created_at).toLocaleString('es-ES')}
                </span>
              </div>
              <button
                className="delete-btn"
                onClick={() => handleDelete(notification.id)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
