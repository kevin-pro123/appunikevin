import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Layers, Plus } from 'lucide-react'
import { Reservation, Classroom } from '../types'
import './Reservations.css'

export default function Reservations() {
  const profile = useAuthStore((state) => state.profile)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    classroom_id: '',
    title: '',
    description: '',
    start_time: '',
    end_time: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reservationsRes, classroomsRes] = await Promise.all([
          supabase
            .from('reservations')
            .select('*')
            .eq('user_id', profile?.id)
            .order('start_time', { ascending: false }),
          supabase
            .from('classrooms')
            .select('*')
            .order('name', { ascending: true })
        ])

        setReservations(reservationsRes.data || [])
        setClassrooms(classroomsRes.data || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (profile?.id) {
      fetchData()
    }
  }, [profile?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      const { error } = await supabase.from('reservations').insert({
        classroom_id: formData.classroom_id,
        user_id: profile.id,
        title: formData.title,
        description: formData.description,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        status: 'pending'
      })

      if (error) throw error

      const { data } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', profile.id)
        .order('start_time', { ascending: false })

      setReservations(data || [])
      setFormData({ classroom_id: '', title: '', description: '', start_time: '', end_time: '' })
      setShowForm(false)
    } catch (error) {
      console.error('Error creating reservation:', error)
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'approved'
      case 'rejected':
        return 'rejected'
      case 'cancelled':
        return 'cancelled'
      default:
        return 'pending'
    }
  }

  const getClassroomName = (classroom_id: string) => {
    return classrooms.find((c) => c.id === classroom_id)?.name || 'Aula desconocida'
  }

  return (
    <div className="reservations">
      <div className="page-header">
        <h1>Reservas de Aulas</h1>
        <p>Gestiona tus reservas de espacios y salas de estudio</p>
      </div>

      <div className="action-bar">
        <button onClick={() => setShowForm(!showForm)} className="new-reservation-btn">
          <Plus size={20} />
          <span>Nueva Reserva</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="reservation-form">
          <div className="form-group">
            <label>Aula/Sala</label>
            <select
              value={formData.classroom_id}
              onChange={(e) => setFormData({ ...formData, classroom_id: e.target.value })}
              required
            >
              <option value="">Selecciona un aula</option>
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name} - {classroom.building} ({classroom.capacity} personas)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Título</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Estudio en grupo"
              required
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalles sobre la reserva"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Inicio</label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Fin</label>
              <input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-buttons">
            <button type="submit" className="submit-btn">Reservar</button>
            <button type="button" onClick={() => setShowForm(false)} className="cancel-btn">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading">Cargando reservas...</div>
      ) : reservations.length === 0 ? (
        <div className="empty-state">
          <Layers size={48} />
          <p>No tienes reservas</p>
        </div>
      ) : (
        <div className="reservations-list">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="reservation-item">
              <div className="reservation-header">
                <h3>{reservation.title}</h3>
                <span className={`status ${getStatusClass(reservation.status)}`}>
                  {reservation.status === 'pending' && 'Pendiente'}
                  {reservation.status === 'approved' && 'Aprobada'}
                  {reservation.status === 'rejected' && 'Rechazada'}
                  {reservation.status === 'cancelled' && 'Cancelada'}
                </span>
              </div>
              <div className="reservation-details">
                <p><strong>Aula:</strong> {getClassroomName(reservation.classroom_id)}</p>
                <p><strong>Inicio:</strong> {new Date(reservation.start_time).toLocaleString('es-ES')}</p>
                <p><strong>Fin:</strong> {new Date(reservation.end_time).toLocaleString('es-ES')}</p>
                {reservation.description && <p><strong>Descripción:</strong> {reservation.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
