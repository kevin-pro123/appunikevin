import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Clock } from 'lucide-react'
import './Schedules.css'

interface ScheduleWithCourse {
  id: string
  day_of_week: string
  start_time: string
  end_time: string
  course?: {
    name: string
    code: string
  }
  classroom?: {
    name: string
    building: string
  }
}

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAYS_ES = {
  Monday: 'Lunes',
  Tuesday: 'Martes',
  Wednesday: 'Miércoles',
  Thursday: 'Jueves',
  Friday: 'Viernes',
  Saturday: 'Sábado'
}

export default function Schedules() {
  const [schedules, setSchedules] = useState<ScheduleWithCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const { data, error } = await supabase
          .from('schedules')
          .select(`
            id,
            day_of_week,
            start_time,
            end_time,
            courses(name, code),
            classrooms(name, building)
          `)

        if (error) throw error

        const formattedData = (data || []).map((schedule: any) => ({
          id: schedule.id,
          day_of_week: schedule.day_of_week,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          course: schedule.courses ? { name: schedule.courses.name, code: schedule.courses.code } : undefined,
          classroom: schedule.classrooms ? { name: schedule.classrooms.name, building: schedule.classrooms.building } : undefined
        }))

        setSchedules(formattedData)
      } catch (error) {
        console.error('Error fetching schedules:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSchedules()
  }, [])

  const groupedByDay = DAYS_ORDER.reduce((acc, day) => {
    acc[day] = schedules.filter((s) => s.day_of_week === day)
    return acc
  }, {} as Record<string, ScheduleWithCourse[]>)

  return (
    <div className="schedules">
      <div className="page-header">
        <h1>Mi Horario</h1>
        <p>Visualiza tus clases y ubicaciones</p>
      </div>

      {loading ? (
        <div className="loading">Cargando horarios...</div>
      ) : schedules.length === 0 ? (
        <div className="empty-state">
          <Clock size={48} />
          <p>No hay horarios registrados</p>
        </div>
      ) : (
        <div className="schedule-grid">
          {DAYS_ORDER.map((day) => (
            <div key={day} className="day-column">
              <h3 className="day-title">{DAYS_ES[day as keyof typeof DAYS_ES]}</h3>
              {groupedByDay[day].length === 0 ? (
                <p className="no-classes">Sin clases</p>
              ) : (
                <div className="schedule-items">
                  {groupedByDay[day].map((schedule) => (
                    <div key={schedule.id} className="schedule-item">
                      <div className="time-slot">
                        <span className="start-time">{schedule.start_time}</span>
                        <span className="end-time">{schedule.end_time}</span>
                      </div>
                      <div className="schedule-details">
                        <p className="course-name">{schedule.course?.name}</p>
                        <p className="course-code">{schedule.course?.code}</p>
                        {schedule.classroom && (
                          <p className="classroom-info">
                            {schedule.classroom.name} - {schedule.classroom.building}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
