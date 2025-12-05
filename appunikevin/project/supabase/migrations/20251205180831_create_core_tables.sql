/*
  # Crear tablas principales para plataforma universitaria

  1. Extensiones
    - uuid-ossp para generar UUIDs

  2. Tablas Principales (en orden de dependencias)
    - `profiles`: Perfiles de usuarios (estudiantes, profesores, admins)
    - `courses`: Cursos/Materias
    - `classrooms`: Aulas/Salas
    - `schedules`: Horarios de clases
    - `chat_rooms`: Salas de chat
    - `chat_room_members`: Miembros de chat
    - `messages`: Mensajes de chat
    - `books`: Catálogo de biblioteca digital
    - `reservations`: Reservas de aulas/salas
    - `occupancy_sensors`: Datos de sensores de ocupación
    - `notifications`: Notificaciones para usuarios
    - `campus_locations`: Ubicaciones del campus

  3. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas para verificar autenticación y permisos
    - Índices para performance
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de perfiles de usuarios
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  avatar_url text,
  student_id text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Tabla de cursos/materias
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  description text,
  teacher_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  department text,
  credits int DEFAULT 3,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

-- Tabla de aulas/salas
CREATE TABLE IF NOT EXISTS classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  building text NOT NULL,
  floor int,
  capacity int NOT NULL,
  amenities text[] DEFAULT '{}',
  has_sensor boolean DEFAULT false,
  location_lat float,
  location_lon float,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view classrooms"
  ON classrooms FOR SELECT
  TO authenticated
  USING (true);

-- Tabla de horarios
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  classroom_id uuid REFERENCES classrooms(id),
  day_of_week text NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view schedules"
  ON schedules FOR SELECT
  TO authenticated
  USING (true);

-- Tabla de salas de chat
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  room_type text NOT NULL DEFAULT 'course' CHECK (room_type IN ('course', 'group', 'direct')),
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  is_direct_chat boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

-- Tabla de miembros de chat
CREATE TABLE IF NOT EXISTS chat_room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(chat_room_id, user_id)
);

ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memberships"
  ON chat_room_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Chat room creators can view members"
  ON chat_room_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms WHERE id = chat_room_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Chat room members can view members"
  ON chat_room_members FOR SELECT
  TO authenticated
  USING (
    chat_room_id IN (
      SELECT chat_room_id FROM chat_room_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join chat rooms"
  ON chat_room_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Política para chat_rooms
CREATE POLICY "Users in chat room can view"
  ON chat_rooms FOR SELECT
  TO authenticated
  USING (
    room_type = 'course' OR
    EXISTS (
      SELECT 1 FROM chat_room_members 
      WHERE chat_room_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chat rooms"
  ON chat_rooms FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in accessible rooms"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      WHERE cr.id = chat_room_id AND (
        cr.room_type = 'course' OR
        EXISTS (
          SELECT 1 FROM chat_room_members 
          WHERE chat_room_id = cr.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Tabla de biblioteca digital
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  isbn text UNIQUE,
  description text,
  cover_url text,
  file_url text,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  publisher text,
  publication_year int,
  available_copies int DEFAULT 1,
  total_copies int DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view books"
  ON books FOR SELECT
  TO authenticated
  USING (true);

-- Tabla de reservas
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can create reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reservations"
  ON reservations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Tabla de sensores de ocupación
CREATE TABLE IF NOT EXISTS occupancy_sensors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  current_occupancy int DEFAULT 0,
  capacity int NOT NULL,
  occupancy_percentage int GENERATED ALWAYS AS (
    CASE WHEN capacity > 0 THEN (current_occupancy * 100) / capacity ELSE 0 END
  ) STORED,
  last_updated timestamptz DEFAULT now()
);

ALTER TABLE occupancy_sensors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view occupancy data"
  ON occupancy_sensors FOR SELECT
  TO authenticated
  USING (true);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'location', 'reservation', 'message', 'course')),
  is_read boolean DEFAULT false,
  trigger_radius float,
  location_lat float,
  location_lon float,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Tabla de ubicaciones del campus
CREATE TABLE IF NOT EXISTS campus_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('building', 'library', 'cafeteria', 'parking', 'restroom', 'other')),
  description text,
  latitude float NOT NULL,
  longitude float NOT NULL,
  address text,
  phone text,
  hours text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE campus_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view campus locations"
  ON campus_locations FOR SELECT
  TO authenticated
  USING (true);

-- Índices para performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_courses_teacher ON courses(teacher_id);
CREATE INDEX idx_schedules_course ON schedules(course_id);
CREATE INDEX idx_messages_chat_room ON messages(chat_room_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_classroom ON reservations(classroom_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);