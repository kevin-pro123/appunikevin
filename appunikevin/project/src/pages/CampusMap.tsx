import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { MapPin } from 'lucide-react'
import { CampusLocation } from '../types'
import './CampusMap.css'

export default function CampusMap() {
  const [locations, setLocations] = useState<CampusLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | null>(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('campus_locations')
          .select('*')
          .order('type', { ascending: true })

        if (error) throw error
        setLocations(data || [])
      } catch (error) {
        console.error('Error fetching locations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()
  }, [])

  const filteredLocations = filter === 'all'
    ? locations
    : locations.filter((loc) => loc.type === filter)

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      building: 'Edificio',
      library: 'Biblioteca',
      cafeteria: 'Cafetería',
      parking: 'Estacionamiento',
      restroom: 'Servicios',
      other: 'Otro'
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      building: 'blue',
      library: 'green',
      cafeteria: 'orange',
      parking: 'purple',
      restroom: 'red',
      other: 'gray'
    }
    return colors[type] || 'gray'
  }

  return (
    <div className="campus-map">
      <div className="page-header">
        <h1>Mapa del Campus</h1>
        <p>Explora ubicaciones e instalaciones del campus</p>
      </div>

      <div className="filter-bar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Todos</option>
          <option value="building">Edificios</option>
          <option value="library">Biblioteca</option>
          <option value="cafeteria">Cafetería</option>
          <option value="parking">Estacionamiento</option>
          <option value="restroom">Servicios</option>
          <option value="other">Otros</option>
        </select>
      </div>

      <div className="map-container">
        {loading ? (
          <div className="loading">Cargando mapa...</div>
        ) : (
          <div className="map-content">
            <div className="map-view">
              <div className="map-placeholder">
                <MapPin size={64} />
                <p>Mapa interactivo del campus</p>
              </div>
            </div>

            <div className="locations-panel">
              <h3>Ubicaciones</h3>
              {filteredLocations.length === 0 ? (
                <p className="no-locations">No hay ubicaciones disponibles</p>
              ) : (
                <div className="locations-list">
                  {filteredLocations.map((location) => (
                    <button
                      key={location.id}
                      className={`location-item ${selectedLocation?.id === location.id ? 'active' : ''} ${getTypeColor(location.type)}`}
                      onClick={() => setSelectedLocation(location)}
                    >
                      <div className="location-name">{location.name}</div>
                      <div className="location-type">{getTypeLabel(location.type)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedLocation && (
        <div className="location-detail">
          <h2>{selectedLocation.name}</h2>
          <div className="detail-content">
            <p><strong>Tipo:</strong> {getTypeLabel(selectedLocation.type)}</p>
            {selectedLocation.address && <p><strong>Dirección:</strong> {selectedLocation.address}</p>}
            {selectedLocation.phone && <p><strong>Teléfono:</strong> {selectedLocation.phone}</p>}
            {selectedLocation.hours && <p><strong>Horarios:</strong> {selectedLocation.hours}</p>}
            {selectedLocation.description && <p><strong>Descripción:</strong> {selectedLocation.description}</p>}
            <div className="coordinates">
              <p><strong>Ubicación:</strong> ({selectedLocation.latitude}, {selectedLocation.longitude})</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
