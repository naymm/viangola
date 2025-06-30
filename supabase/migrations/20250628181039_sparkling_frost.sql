/*
  # Schema Inicial do AutoVeritas

  1. Enums
    - user_role: Tipos de utilizador (operator, agent, citizen, company)
    - vehicle_status: Estados do veículo (active, sold, damaged, inactive)
    - driver_status: Estados da carta (valid, expiring, expired, suspended)
    - document_status: Estados do documento (valid, expiring, expired)
    - fine_status: Estados da multa (pending, paid, contested, cancelled)
    - notification_type: Tipos de notificação (expiry, fine, reminder, system)
    - notification_priority: Prioridades (high, medium, low)

  2. Tabelas
    - users: Utilizadores do sistema
    - vehicles: Veículos registados
    - drivers: Condutores e cartas de condução
    - documents: Documentos dos veículos
    - fines: Multas aplicadas
    - notifications: Notificações do sistema

  3. Segurança
    - RLS ativado em todas as tabelas
    - Políticas baseadas no papel do utilizador
*/

-- Criar enums
CREATE TYPE user_role AS ENUM ('operator', 'agent', 'citizen', 'company');
CREATE TYPE vehicle_status AS ENUM ('active', 'sold', 'damaged', 'inactive');
CREATE TYPE driver_status AS ENUM ('valid', 'expiring', 'expired', 'suspended');
CREATE TYPE document_status AS ENUM ('valid', 'expiring', 'expired');
CREATE TYPE fine_status AS ENUM ('pending', 'paid', 'contested', 'cancelled');
CREATE TYPE notification_type AS ENUM ('expiry', 'fine', 'reminder', 'system');
CREATE TYPE notification_priority AS ENUM ('high', 'medium', 'low');

-- Tabela de utilizadores
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL DEFAULT 'citizen',
  badge text,
  company text,
  photo text,
  phone text,
  address text,
  birth_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Tabela de veículos
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate text UNIQUE NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  color text,
  type text NOT NULL DEFAULT 'Ligeiro',
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  insurance_expiry date,
  circulation_expiry date,
  inspection_expiry date,
  status vehicle_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de condutores
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  license_number text UNIQUE NOT NULL,
  categories text[] NOT NULL DEFAULT '{}',
  issue_date date NOT NULL,
  expiry_date date NOT NULL,
  birth_date date NOT NULL,
  address text,
  phone text,
  email text,
  photo text,
  status driver_status DEFAULT 'valid',
  points integer DEFAULT 0,
  max_points integer DEFAULT 12,
  medical_exam date,
  company text,
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de documentos
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  vehicle_plate text NOT NULL,
  file_name text NOT NULL,
  file_url text,
  upload_date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date,
  status document_status DEFAULT 'valid',
  size text,
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de multas
CREATE TABLE IF NOT EXISTS fines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  vehicle_plate text NOT NULL,
  driver_name text NOT NULL,
  driver_license text NOT NULL,
  amount decimal(10,2) NOT NULL,
  points integer DEFAULT 0,
  location text NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  status fine_status DEFAULT 'pending',
  description text,
  agent_id uuid REFERENCES users(id) ON DELETE SET NULL,
  agent_name text,
  agent_badge text,
  photos text[],
  evidence text[],
  payment_date date,
  contest_date date,
  contest_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  vehicle_plate text,
  priority notification_priority DEFAULT 'medium',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ativar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Operators can read all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'operator'
    )
  );

CREATE POLICY "Operators can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'operator'
    )
  );

-- Políticas para vehicles
CREATE POLICY "Users can read own vehicles" ON vehicles
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can manage own vehicles" ON vehicles
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Operators and agents can read all vehicles" ON vehicles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('operator', 'agent')
    )
  );

CREATE POLICY "Operators can manage all vehicles" ON vehicles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'operator'
    )
  );

-- Políticas para drivers
CREATE POLICY "Users can read own drivers" ON drivers
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can manage own drivers" ON drivers
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Operators and agents can read all drivers" ON drivers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('operator', 'agent')
    )
  );

CREATE POLICY "Operators can manage all drivers" ON drivers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'operator'
    )
  );

-- Políticas para documents
CREATE POLICY "Users can read own documents" ON documents
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can manage own documents" ON documents
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Operators and agents can read all documents" ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('operator', 'agent')
    )
  );

CREATE POLICY "Operators can manage all documents" ON documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'operator'
    )
  );

-- Políticas para fines
CREATE POLICY "Users can read related fines" ON fines
  FOR SELECT USING (
    -- Cidadãos podem ver multas dos seus veículos/cartas
    EXISTS (
      SELECT 1 FROM vehicles v 
      WHERE v.plate = fines.vehicle_plate AND v.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM drivers d 
      WHERE d.license_number = fines.driver_license AND d.owner_id = auth.uid()
    ) OR
    -- Operadores e agentes podem ver todas
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('operator', 'agent')
    )
  );

CREATE POLICY "Agents can create fines" ON fines
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('operator', 'agent')
    )
  );

CREATE POLICY "Users can update own fines status" ON fines
  FOR UPDATE USING (
    -- Cidadãos podem pagar/contestar suas multas
    (
      EXISTS (
        SELECT 1 FROM vehicles v 
        WHERE v.plate = fines.vehicle_plate AND v.owner_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM drivers d 
        WHERE d.license_number = fines.driver_license AND d.owner_id = auth.uid()
      )
    ) OR
    -- Operadores podem atualizar qualquer multa
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'operator'
    )
  );

-- Políticas para notifications
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_drivers_owner_id ON drivers(owner_id);
CREATE INDEX IF NOT EXISTS idx_drivers_license_number ON drivers(license_number);
CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_vehicle_plate ON documents(vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_fines_vehicle_plate ON fines(vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_fines_driver_license ON fines(driver_license);
CREATE INDEX IF NOT EXISTS idx_fines_agent_id ON fines(agent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fines_updated_at BEFORE UPDATE ON fines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();