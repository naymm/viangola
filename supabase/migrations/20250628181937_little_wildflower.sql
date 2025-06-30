/*
  # Esquema Completo da Base de Dados AutoVeritas

  1. Tipos Personalizados (ENUMs)
    - user_role: Tipos de utilizador (operator, agent, citizen, company)
    - vehicle_status: Estados do veículo (active, sold, damaged, inactive)
    - document_status: Estados do documento (valid, expiring, expired)
    - fine_status: Estados da multa (pending, paid, contested, cancelled)
    - driver_status: Estados da carta (valid, expiring, expired, suspended)
    - notification_type: Tipos de notificação (expiry, fine, reminder, system)
    - notification_priority: Prioridades (high, medium, low)

  2. Tabelas Principais
    - users: Utilizadores do sistema
    - vehicles: Veículos registados
    - drivers: Condutores e cartas de condução
    - documents: Documentos dos veículos
    - fines: Multas e infrações
    - notifications: Notificações do sistema
    - audit_logs: Logs de auditoria
    - system_settings: Configurações do sistema

  3. Segurança
    - Row Level Security (RLS) ativado em todas as tabelas
    - Políticas baseadas em roles de utilizador
    - Auditoria automática de alterações

  4. Funcionalidades
    - Triggers para updated_at automático
    - Índices para performance
    - Constraints para integridade de dados
*/

-- Remover tipos existentes se existirem
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS vehicle_status CASCADE;
DROP TYPE IF EXISTS document_status CASCADE;
DROP TYPE IF EXISTS fine_status CASCADE;
DROP TYPE IF EXISTS driver_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS notification_priority CASCADE;
DROP TYPE IF EXISTS audit_action CASCADE;

-- Criar tipos personalizados
CREATE TYPE user_role AS ENUM ('operator', 'agent', 'citizen', 'company');
CREATE TYPE vehicle_status AS ENUM ('active', 'sold', 'damaged', 'inactive');
CREATE TYPE document_status AS ENUM ('valid', 'expiring', 'expired');
CREATE TYPE fine_status AS ENUM ('pending', 'paid', 'contested', 'cancelled');
CREATE TYPE driver_status AS ENUM ('valid', 'expiring', 'expired', 'suspended');
CREATE TYPE notification_type AS ENUM ('expiry', 'fine', 'reminder', 'system');
CREATE TYPE notification_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para auditoria
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, user_id)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

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
  last_login timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~* '^\+?[0-9\s\-\(\)]+$')
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
  vin text,
  engine_number text,
  fuel_type text DEFAULT 'Gasolina',
  displacement integer,
  power_kw integer,
  seats integer DEFAULT 5,
  weight_kg integer,
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  insurance_company text,
  insurance_policy text,
  insurance_expiry date,
  circulation_expiry date,
  inspection_expiry date,
  status vehicle_status DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_year CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
  CONSTRAINT valid_plate CHECK (plate ~* '^[0-9]{2}-[A-Z]{2}-[0-9]{2}$' OR plate ~* '^[A-Z]{2}-[0-9]{2}-[A-Z]{2}$'),
  CONSTRAINT valid_seats CHECK (seats > 0 AND seats <= 50)
);

-- Tabela de condutores
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  license_number text UNIQUE NOT NULL,
  categories text[] DEFAULT ARRAY['B'],
  issue_date date NOT NULL,
  expiry_date date NOT NULL,
  birth_date date NOT NULL,
  birth_place text,
  nationality text DEFAULT 'Portuguesa',
  address text,
  postal_code text,
  city text,
  phone text,
  email text,
  photo text,
  status driver_status DEFAULT 'valid',
  points integer DEFAULT 0,
  max_points integer DEFAULT 12,
  medical_exam date,
  medical_restrictions text,
  company text,
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_license_number CHECK (license_number ~* '^[0-9]{9}$'),
  CONSTRAINT valid_points CHECK (points >= 0 AND points <= max_points),
  CONSTRAINT valid_birth_date CHECK (birth_date <= CURRENT_DATE - INTERVAL '16 years'),
  CONSTRAINT valid_expiry_date CHECK (expiry_date > issue_date)
);

-- Tabela de documentos
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  vehicle_plate text,
  driver_license text,
  file_name text NOT NULL,
  file_url text,
  file_path text,
  mime_type text,
  upload_date date DEFAULT CURRENT_DATE,
  expiry_date date,
  issue_date date,
  issuing_authority text,
  document_number text,
  status document_status DEFAULT 'valid',
  size text,
  checksum text,
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  verified_by uuid REFERENCES users(id),
  verified_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_document_type CHECK (type IN ('Seguro', 'Livrete', 'Inspeção', 'Título de Propriedade', 'Carta de Condução', 'Certificado Médico', 'Autorização Especial')),
  CONSTRAINT valid_expiry CHECK (expiry_date IS NULL OR expiry_date >= upload_date)
);

-- Tabela de multas
CREATE TABLE IF NOT EXISTS fines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fine_number text UNIQUE,
  type text NOT NULL,
  vehicle_plate text NOT NULL,
  driver_name text,
  driver_license text,
  amount decimal(10,2) NOT NULL,
  points integer DEFAULT 0,
  location text NOT NULL,
  coordinates point,
  date date NOT NULL,
  time time NOT NULL,
  speed_limit integer,
  recorded_speed integer,
  weather_conditions text,
  road_conditions text,
  status fine_status DEFAULT 'pending',
  description text,
  legal_article text,
  agent_id uuid REFERENCES users(id),
  agent_name text,
  agent_badge text,
  supervisor_id uuid REFERENCES users(id),
  photos text[],
  evidence text[],
  payment_date date,
  payment_method text,
  payment_reference text,
  contest_date date,
  contest_reason text,
  contest_decision text,
  contest_decided_by uuid REFERENCES users(id),
  contest_decided_at timestamptz,
  due_date date,
  late_fee decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_amount CHECK (amount > 0),
  CONSTRAINT valid_points CHECK (points >= 0),
  CONSTRAINT valid_speeds CHECK (speed_limit IS NULL OR recorded_speed IS NULL OR speed_limit > 0),
  CONSTRAINT valid_payment_date CHECK (payment_date IS NULL OR payment_date >= date)
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  vehicle_plate text,
  driver_license text,
  fine_id uuid REFERENCES fines(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  priority notification_priority DEFAULT 'medium',
  read boolean DEFAULT false,
  read_at timestamptz,
  action_url text,
  action_label text,
  expires_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action audit_action NOT NULL,
  old_data jsonb,
  new_data jsonb,
  user_id uuid,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_action_data CHECK (
    (action = 'INSERT' AND old_data IS NULL AND new_data IS NOT NULL) OR
    (action = 'UPDATE' AND old_data IS NOT NULL AND new_data IS NOT NULL) OR
    (action = 'DELETE' AND old_data IS NOT NULL AND new_data IS NULL)
  )
);

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  category text DEFAULT 'general',
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de sessões de utilizador
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  device_info jsonb,
  ip_address inet,
  location text,
  expires_at timestamptz NOT NULL,
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Ativar Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela users
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Operators can read all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND role = 'operator'
    )
  );

CREATE POLICY "Operators can manage users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND role = 'operator'
    )
  );

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Políticas para a tabela vehicles
CREATE POLICY "Users can read own vehicles" ON vehicles
  FOR SELECT USING (
    owner_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND role IN ('operator', 'agent')
    )
  );

CREATE POLICY "Users can manage own vehicles" ON vehicles
  FOR ALL USING (
    owner_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND role IN ('operator', 'agent')
    )
  );

-- Políticas para a tabela drivers
CREATE POLICY "Users can read accessible drivers" ON drivers
  FOR SELECT USING (
    owner_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND role IN ('operator', 'agent')
    )
  );

CREATE POLICY "Users can manage own drivers" ON drivers
  FOR ALL USING (
    owner_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND role IN ('operator', 'agent')
    )
  );

-- Políticas para a tabela documents
CREATE POLICY "Users can read own documents" ON documents
  FOR SELECT USING (
    owner_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND role IN ('operator', 'agent')
    )
  );

CREATE POLICY "Users can manage own documents" ON documents
  FOR ALL USING (
    owner_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND role IN ('operator', 'agent')
    )
  );

-- Políticas para a tabela fines
CREATE POLICY "Users can read relevant fines" ON fines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vehicles v 
      WHERE v.plate = fines.vehicle_plate AND v.owner_id::text = auth.uid()::text
    ) OR
    EXISTS (
      SELECT 1 FROM drivers d 
      WHERE d.license_number = fines.driver_license AND d.owner_id::text = auth.uid()::text
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND role IN ('operator', 'agent')
    )
  );

CREATE POLICY "Agents can create fines" ON fines
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND role IN ('operator', 'agent')
    )
  );

CREATE POLICY "Agents can update fines" ON fines
  FOR UPDATE USING (
    agent_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND role = 'operator'
    )
  );

-- Políticas para a tabela notifications
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id::text = auth.uid()::text);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Políticas para audit_logs
CREATE POLICY "Operators can read audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND role = 'operator'
    )
  );

-- Políticas para system_settings
CREATE POLICY "Everyone can read public settings" ON system_settings
  FOR SELECT USING (is_public = true);

CREATE POLICY "Operators can manage settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND role = 'operator'
    )
  );

-- Políticas para user_sessions
CREATE POLICY "Users can read own sessions" ON user_sessions
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can manage own sessions" ON user_sessions
  FOR ALL USING (user_id::text = auth.uid()::text);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_expiry ON vehicles(insurance_expiry, circulation_expiry, inspection_expiry);

CREATE INDEX IF NOT EXISTS idx_drivers_owner_id ON drivers(owner_id);
CREATE INDEX IF NOT EXISTS idx_drivers_license ON drivers(license_number);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_expiry ON drivers(expiry_date);

CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_vehicle ON documents(vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_documents_driver ON documents(driver_license);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

CREATE INDEX IF NOT EXISTS idx_fines_vehicle_plate ON fines(vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_fines_driver_license ON fines(driver_license);
CREATE INDEX IF NOT EXISTS idx_fines_agent_id ON fines(agent_id);
CREATE INDEX IF NOT EXISTS idx_fines_status ON fines(status);
CREATE INDEX IF NOT EXISTS idx_fines_date ON fines(date);
CREATE INDEX IF NOT EXISTS idx_fines_location ON fines USING gin(to_tsvector('portuguese', location));

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Criar triggers para updated_at
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

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar triggers de auditoria
CREATE TRIGGER audit_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_vehicles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_drivers_trigger
  AFTER INSERT OR UPDATE OR DELETE ON drivers
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_fines_trigger
  AFTER INSERT OR UPDATE OR DELETE ON fines
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Função para gerar número de multa automático
CREATE OR REPLACE FUNCTION generate_fine_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.fine_number IS NULL THEN
    NEW.fine_number := 'MUL' || TO_CHAR(CURRENT_DATE, 'YYYY') || 
                       LPAD(NEXTVAL('fine_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar sequência para números de multa
CREATE SEQUENCE IF NOT EXISTS fine_number_seq START 1;

-- Trigger para gerar número de multa
CREATE TRIGGER generate_fine_number_trigger
  BEFORE INSERT ON fines
  FOR EACH ROW EXECUTE FUNCTION generate_fine_number();

-- Função para atualizar status baseado em datas
CREATE OR REPLACE FUNCTION update_expiry_status()
RETURNS void AS $$
BEGIN
  -- Atualizar status de documentos
  UPDATE documents SET status = 
    CASE 
      WHEN expiry_date IS NULL THEN 'valid'
      WHEN expiry_date < CURRENT_DATE THEN 'expired'
      WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring'
      ELSE 'valid'
    END
  WHERE status != 
    CASE 
      WHEN expiry_date IS NULL THEN 'valid'
      WHEN expiry_date < CURRENT_DATE THEN 'expired'
      WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring'
      ELSE 'valid'
    END;

  -- Atualizar status de condutores
  UPDATE drivers SET status = 
    CASE 
      WHEN expiry_date < CURRENT_DATE THEN 'expired'
      WHEN expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'expiring'
      WHEN points >= max_points THEN 'suspended'
      ELSE 'valid'
    END
  WHERE status != 
    CASE 
      WHEN expiry_date < CURRENT_DATE THEN 'expired'
      WHEN expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'expiring'
      WHEN points >= max_points THEN 'suspended'
      ELSE 'valid'
    END;
END;
$$ language 'plpgsql';

-- Inserir configurações do sistema
INSERT INTO system_settings (key, value, description, category, is_public) VALUES
  ('app_name', '"AutoVeritas"', 'Nome da aplicação', 'general', true),
  ('app_version', '"1.0.0"', 'Versão da aplicação', 'general', true),
  ('max_file_size', '10485760', 'Tamanho máximo de ficheiro em bytes (10MB)', 'uploads', false),
  ('allowed_file_types', '["pdf", "jpg", "jpeg", "png"]', 'Tipos de ficheiro permitidos', 'uploads', false),
  ('fine_payment_deadline_days', '30', 'Prazo para pagamento de multas em dias', 'fines', true),
  ('driver_license_expiry_warning_days', '90', 'Dias de antecedência para avisar sobre expiração de carta', 'notifications', false),
  ('document_expiry_warning_days', '30', 'Dias de antecedência para avisar sobre expiração de documentos', 'notifications', false),
  ('max_driver_points', '12', 'Pontos máximos na carta de condução', 'drivers', true),
  ('notification_retention_days', '365', 'Dias para manter notificações', 'notifications', false),
  ('audit_log_retention_days', '2555', 'Dias para manter logs de auditoria (7 anos)', 'audit', false)
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = now();

-- Inserir utilizadores de demonstração
INSERT INTO users (id, email, name, role, badge, company, photo, phone, address, birth_date) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'operador@autoveritas.pt', 'Admin Sistema', 'operator', 'OP001', NULL, 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', '+351 910 000 001', 'Rua do Sistema, 1, Lisboa', '1980-01-01'),
  ('550e8400-e29b-41d4-a716-446655440002', 'agente@autoveritas.pt', 'João Silva Santos', 'agent', 'AG001234', NULL, 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', '+351 912 345 678', 'Rua das Flores, 123, Lisboa', '1985-06-20'),
  ('550e8400-e29b-41d4-a716-446655440003', 'cidadao@autoveritas.pt', 'Maria João Ferreira', 'citizen', NULL, NULL, 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', '+351 923 456 789', 'Av. da República, 456, Porto', '1992-11-15'),
  ('550e8400-e29b-41d4-a716-446655440004', 'empresa@autoveritas.pt', 'Carlos Manuel Costa', 'company', NULL, 'TransLisboa Lda.', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', '+351 934 567 890', 'Rua Central, 789, Coimbra', '1978-04-08')
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = now();

-- Inserir veículos de demonstração
INSERT INTO vehicles (id, plate, brand, model, year, color, type, owner_id, insurance_expiry, circulation_expiry, inspection_expiry, status) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '12-AB-34', 'Mercedes-Benz', 'C-Class', 2020, 'Preto', 'Ligeiro', '550e8400-e29b-41d4-a716-446655440003', '2025-03-15', '2025-12-31', '2025-06-20', 'active'),
  ('660e8400-e29b-41d4-a716-446655440002', '56-CD-78', 'BMW', 'X5', 2019, 'Branco', 'SUV', '550e8400-e29b-41d4-a716-446655440004', '2024-12-15', '2025-12-31', '2024-11-10', 'active'),
  ('660e8400-e29b-41d4-a716-446655440003', '90-EF-12', 'Audi', 'A4', 2021, 'Azul', 'Ligeiro', '550e8400-e29b-41d4-a716-446655440003', '2025-08-20', '2025-12-31', '2025-04-15', 'active')
ON CONFLICT (plate) DO UPDATE SET 
  brand = EXCLUDED.brand,
  model = EXCLUDED.model,
  updated_at = now();

-- Inserir condutores de demonstração
INSERT INTO drivers (id, name, license_number, categories, issue_date, expiry_date, birth_date, address, phone, email, photo, status, points, max_points, medical_exam, company, owner_id) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', 'João Silva Santos', '123456789', ARRAY['B', 'A1'], '2018-03-15', '2028-03-15', '1985-06-20', 'Rua das Flores, 123, Lisboa', '+351 912 345 678', 'joao.silva@email.com', 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', 'valid', 2, 12, '2026-06-20', NULL, '550e8400-e29b-41d4-a716-446655440004'),
  ('770e8400-e29b-41d4-a716-446655440002', 'Maria João Ferreira', '987654321', ARRAY['B'], '2020-01-10', '2030-01-10', '1992-11-15', 'Av. da República, 456, Porto', '+351 923 456 789', 'maria.ferreira@email.com', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', 'valid', 0, 12, '2024-12-15', NULL, '550e8400-e29b-41d4-a716-446655440004'),
  ('770e8400-e29b-41d4-a716-446655440003', 'Carlos Manuel Costa', '456789123', ARRAY['B', 'C', 'D'], '2015-09-20', '2025-09-20', '1978-04-08', 'Rua Central, 789, Coimbra', '+351 934 567 890', 'carlos.costa@email.com', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', 'suspended', 12, 12, '2025-04-08', 'TransLisboa Lda.', NULL)
ON CONFLICT (license_number) DO UPDATE SET 
  name = EXCLUDED.name,
  updated_at = now();

-- Inserir documentos de demonstração
INSERT INTO documents (id, type, vehicle_plate, file_name, upload_date, expiry_date, status, size, owner_id) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', 'Seguro', '12-AB-34', 'seguro_mercedes_2024.pdf', '2024-01-15', '2025-03-15', 'valid', '2.4 MB', '550e8400-e29b-41d4-a716-446655440003'),
  ('880e8400-e29b-41d4-a716-446655440002', 'Livrete', '12-AB-34', 'livrete_mercedes.pdf', '2024-01-10', '2030-12-31', 'valid', '1.8 MB', '550e8400-e29b-41d4-a716-446655440003'),
  ('880e8400-e29b-41d4-a716-446655440003', 'Inspeção', '56-CD-78', 'inspecao_bmw_2024.pdf', '2023-11-20', '2024-11-20', 'expiring', '3.1 MB', '550e8400-e29b-41d4-a716-446655440004'),
  ('880e8400-e29b-41d4-a716-446655440004', 'Título de Propriedade', '90-EF-12', 'titulo_audi.pdf', '2024-02-01', '2030-12-31', 'valid', '1.2 MB', '550e8400-e29b-41d4-a716-446655440003')
ON CONFLICT (id) DO UPDATE SET 
  type = EXCLUDED.type,
  updated_at = now();

-- Inserir multas de demonstração
INSERT INTO fines (id, type, vehicle_plate, driver_name, driver_license, amount, points, location, date, time, status, description, agent_id, agent_name, agent_badge, photos) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', 'Excesso de Velocidade', '12-AB-34', 'João Silva Santos', '123456789', 120.00, 2, 'Av. da Liberdade, Lisboa', '2024-02-20', '14:30', 'pending', 'Velocidade registada: 80km/h em zona de 50km/h', '550e8400-e29b-41d4-a716-446655440002', 'João Silva Santos', 'AG001234', ARRAY['https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=400']),
  ('990e8400-e29b-41d4-a716-446655440002', 'Estacionamento Indevido', '56-CD-78', 'Maria João Ferreira', '987654321', 60.00, 0, 'Rua Augusta, Lisboa', '2024-02-19', '16:45', 'paid', 'Estacionamento em local proibido', '550e8400-e29b-41d4-a716-446655440002', 'João Silva Santos', 'AG001234', NULL),
  ('990e8400-e29b-41d4-a716-446655440003', 'Uso de Telemóvel', '90-EF-12', 'Carlos Manuel Costa', '456789123', 120.00, 2, 'Marquês de Pombal, Lisboa', '2024-02-18', '09:15', 'contested', 'Uso de telemóvel durante a condução', '550e8400-e29b-41d4-a716-446655440002', 'João Silva Santos', 'AG001234', NULL)
ON CONFLICT (id) DO UPDATE SET 
  type = EXCLUDED.type,
  updated_at = now();

-- Atualizar multas com datas de pagamento/contestação
UPDATE fines SET payment_date = '2024-02-25' WHERE id = '990e8400-e29b-41d4-a716-446655440002';
UPDATE fines SET contest_date = '2024-02-28', contest_reason = 'Estava a usar sistema mãos-livres' WHERE id = '990e8400-e29b-41d4-a716-446655440003';

-- Inserir notificações de demonstração
INSERT INTO notifications (id, user_id, type, title, description, vehicle_plate, priority, read) VALUES
  ('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'expiry', 'Seguro a Expirar', 'O seguro do seu Mercedes-Benz C-Class expira em 15 dias', '12-AB-34', 'high', false),
  ('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'fine', 'Nova Multa Registada', 'Foi registada uma multa por excesso de velocidade', '12-AB-34', 'high', false),
  ('aa0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'expiry', 'Inspeção Periódica', 'A inspeção do BMW X5 expira em 30 dias', '56-CD-78', 'medium', true),
  ('aa0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'reminder', 'Renovação de Documentos', 'Lembre-se de renovar os documentos que expiram este mês', NULL, 'medium', true),
  ('aa0e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'system', 'Atualização da App', 'Nova versão disponível com melhorias de segurança', NULL, 'low', true)
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  updated_at = now();

-- Executar atualização de status baseado em datas
SELECT update_expiry_status();