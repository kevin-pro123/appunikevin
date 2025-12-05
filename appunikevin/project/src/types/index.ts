export type UserRole = 'student' | 'teacher' | 'admin'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  email: string
  phone?: string
  avatar_url?: string
  student_id?: string
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  name: string
  code: string
  description?: string
  teacher_id: string
  department?: string
  credits: number
  created_at: string
}

export interface Schedule {
  id: string
  course_id: string
  classroom_id?: string
  day_of_week: string
  start_time: string
  end_time: string
  created_at: string
}

export interface Classroom {
  id: string
  name: string
  building: string
  floor?: number
  capacity: number
  amenities: string[]
  has_sensor: boolean
  location_lat?: number
  location_lon?: number
  created_at: string
}

export interface ChatRoom {
  id: string
  name: string
  description?: string
  room_type: 'course' | 'group' | 'direct'
  created_by: string
  course_id?: string
  is_direct_chat: boolean
  created_at: string
}

export interface Message {
  id: string
  chat_room_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  user?: Profile
}

export interface Book {
  id: string
  title: string
  author: string
  isbn?: string
  description?: string
  cover_url?: string
  file_url?: string
  course_id?: string
  publisher?: string
  publication_year?: number
  available_copies: number
  total_copies: number
  created_at: string
}

export interface Reservation {
  id: string
  classroom_id: string
  user_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  created_at: string
  approved_by?: string
  approved_at?: string
}

export interface OccupancySensor {
  id: string
  classroom_id: string
  current_occupancy: number
  capacity: number
  occupancy_percentage: number
  last_updated: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'general' | 'location' | 'reservation' | 'message' | 'course'
  is_read: boolean
  trigger_radius?: number
  location_lat?: number
  location_lon?: number
  created_at: string
}

export interface CampusLocation {
  id: string
  name: string
  type: 'building' | 'library' | 'cafeteria' | 'parking' | 'restroom' | 'other'
  description?: string
  latitude: number
  longitude: number
  address?: string
  phone?: string
  hours?: string
  image_url?: string
  created_at: string
}
