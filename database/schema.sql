-- 1. TABELA USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'PARTICIPANTE' CHECK (role IN ('ADMIN', 'PARTICIPANTE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA EVENTS
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  banner_url TEXT,
  location VARCHAR(255) NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 100,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'ativo' CHECK (status IN ('ativo', 'encerrado', 'lotado')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA REGISTRATIONS
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  qr_code TEXT NOT NULL, -- QR Code em formato Base64 Data URL ou texto correspondente
  unique_token UUID UNIQUE DEFAULT gen_random_uuid(),
  checkin_done BOOLEAN DEFAULT FALSE,
  checkin_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_event_user UNIQUE (event_id, user_id)
);

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_registrations_token ON registrations(unique_token);

-- Inserir um administrador padrão de teste
-- Hash correspondente à senha 'admin123'
INSERT INTO users (name, email, phone, password_hash, role)
VALUES ('Organizador Admin', 'admin@eventflow.com', '(11) 99999-9999', '$2a$10$7wQ.YskqZ8p1hW7FpU5yK.mQk99J4Z89kE7q4J5z2G2m3L2a7K8iG', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- Inserir um participante padrão de teste
-- Hash correspondente à senha 'user123'
INSERT INTO users (name, email, phone, password_hash, role)
VALUES ('Participante Teste', 'participante@gmail.com', '(11) 98888-8888', '$2a$10$7wQ.YskqZ8p1hW7FpU5yK.mQk99J4Z89kE7q4J5z2G2m3L2a7K8iG', 'PARTICIPANTE')
ON CONFLICT (email) DO NOTHING;
