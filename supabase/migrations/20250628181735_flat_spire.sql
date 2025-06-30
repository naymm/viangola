/*
  # Complete AutoVeritas Database Schema and Demo Data

  1. New Tables
    - `users` - System users with different roles
    - `vehicles` - Vehicle registration data
    - `drivers` - Driver license information
    - `documents` - Vehicle and driver documents
    - `fines` - Traffic violations and penalties
    - `notifications` - User notifications

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control

  3. Demo Data
    - Sample users for each role type
    - Example vehicles, drivers, documents, fines, and notifications
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('operator', 'agent', 'citizen', 'company');
CREATE TYPE vehicle_status AS ENUM ('active', 'sold', 'damaged', 'inactive');
CREATE TYPE document_status AS ENUM ('valid', 'expiring', 'expired');
CREATE TYPE fine_status AS ENUM ('pending', 'paid', 'contested');
CREATE TYPE driver_status AS ENUM ('valid', 'expiring', 'expired', 'suspended');
CREATE TYPE notification_type AS ENUM ('expiry', 'fine', 'reminder', 'system');
CREATE TYPE notification_priority AS ENUM ('high', 'medium', 'low');

-- Create users table
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
  updated_at timestamptz DEFAULT now()
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate text UNIQUE NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  color text,
  type text NOT NULL DEFAULT 'Ligeiro',
  owner_id uuid REFERENCES users(id),
  insurance_expiry date,
  circulation_expiry date,
  inspection_expiry date,
  status vehicle_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  license_number text UNIQUE NOT NULL,
  categories text[] DEFAULT ARRAY['B'],
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
  owner_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  vehicle_plate text,
  driver_license text,
  file_name text NOT NULL,
  file_url text,
  upload_date date DEFAULT CURRENT_DATE,
  expiry_date date,
  status document_status DEFAULT 'valid',
  size text,
  owner_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create fines table
CREATE TABLE IF NOT EXISTS fines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  vehicle_plate text NOT NULL,
  driver_name text,
  driver_license text,
  amount decimal(10,2) NOT NULL,
  points integer DEFAULT 0,
  location text NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  status fine_status DEFAULT 'pending',
  description text,
  agent_id uuid REFERENCES users(id),
  agent_name text,
  agent_badge text,
  photos text[],
  payment_date date,
  contest_date date,
  contest_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
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

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data" ON users
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

-- Create policies for vehicles table
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
      WHERE id::text = auth.uid()::text AND role = 'operator'
    )
  );

-- Create policies for drivers table
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
      WHERE id::text = auth.uid()::text AND role = 'operator'
    )
  );

-- Create policies for documents table
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
      WHERE id::text = auth.uid()::text AND role = 'operator'
    )
  );

-- Create policies for fines table
CREATE POLICY "Users can read relevant fines" ON fines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vehicles v 
      WHERE v.plate = fines.vehicle_plate AND v.owner_id::text = auth.uid()::text
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
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text AND role IN ('operator', 'agent')
    )
  );

-- Create policies for notifications table
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id::text = auth.uid()::text);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_drivers_owner_id ON drivers(owner_id);
CREATE INDEX IF NOT EXISTS idx_drivers_license ON drivers(license_number);
CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_fines_vehicle_plate ON fines(vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_fines_agent_id ON fines(agent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
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

-- Insert demo users
INSERT INTO users (id, email, name, role, badge, company, photo, phone, address, birth_date) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'operador@autoveritas.pt', 'Admin Sistema', 'operator', 'OP001', NULL, 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', '+351 910 000 001', 'Rua do Sistema, 1, Lisboa', '1980-01-01'),
  ('550e8400-e29b-41d4-a716-446655440002', 'agente@autoveritas.pt', 'João Silva Santos', 'agent', 'AG001234', NULL, 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', '+351 912 345 678', 'Rua das Flores, 123, Lisboa', '1985-06-20'),
  ('550e8400-e29b-41d4-a716-446655440003', 'cidadao@autoveritas.pt', 'Maria João Ferreira', 'citizen', NULL, NULL, 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', '+351 923 456 789', 'Av. da República, 456, Porto', '1992-11-15'),
  ('550e8400-e29b-41d4-a716-446655440004', 'empresa@autoveritas.pt', 'Carlos Manuel Costa', 'company', NULL, 'TransLisboa Lda.', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', '+351 934 567 890', 'Rua Central, 789, Coimbra', '1978-04-08')
ON CONFLICT (id) DO NOTHING;

-- Insert demo vehicles
INSERT INTO vehicles (id, plate, brand, model, year, color, type, owner_id, insurance_expiry, circulation_expiry, inspection_expiry, status) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '12-AB-34', 'Mercedes-Benz', 'C-Class', 2020, 'Preto', 'Ligeiro', '550e8400-e29b-41d4-a716-446655440003', '2025-03-15', '2025-12-31', '2025-06-20', 'active'),
  ('660e8400-e29b-41d4-a716-446655440002', '56-CD-78', 'BMW', 'X5', 2019, 'Branco', 'SUV', '550e8400-e29b-41d4-a716-446655440004', '2024-12-15', '2025-12-31', '2024-11-10', 'active'),
  ('660e8400-e29b-41d4-a716-446655440003', '90-EF-12', 'Audi', 'A4', 2021, 'Azul', 'Ligeiro', '550e8400-e29b-41d4-a716-446655440003', '2025-08-20', '2025-12-31', '2025-04-15', 'active')
ON CONFLICT (plate) DO NOTHING;

-- Insert demo drivers
INSERT INTO drivers (id, name, license_number, categories, issue_date, expiry_date, birth_date, address, phone, email, photo, status, points, max_points, medical_exam, company, owner_id) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', 'João Silva Santos', '123456789', ARRAY['B', 'A1'], '2018-03-15', '2028-03-15', '1985-06-20', 'Rua das Flores, 123, Lisboa', '+351 912 345 678', 'joao.silva@email.com', 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', 'valid', 2, 12, '2026-06-20', NULL, '550e8400-e29b-41d4-a716-446655440004'),
  ('770e8400-e29b-41d4-a716-446655440002', 'Maria João Ferreira', '987654321', ARRAY['B'], '2020-01-10', '2030-01-10', '1992-11-15', 'Av. da República, 456, Porto', '+351 923 456 789', 'maria.ferreira@email.com', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', 'valid', 0, 12, '2024-12-15', NULL, '550e8400-e29b-41d4-a716-446655440004'),
  ('770e8400-e29b-41d4-a716-446655440003', 'Carlos Manuel Costa', '456789123', ARRAY['B', 'C', 'D'], '2015-09-20', '2025-09-20', '1978-04-08', 'Rua Central, 789, Coimbra', '+351 934 567 890', 'carlos.costa@email.com', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', 'suspended', 12, 12, '2025-04-08', 'TransLisboa Lda.', NULL)
ON CONFLICT (license_number) DO NOTHING;

-- Insert demo documents
INSERT INTO documents (id, type, vehicle_plate, file_name, upload_date, expiry_date, status, size, owner_id) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', 'Seguro', '12-AB-34', 'seguro_mercedes_2024.pdf', '2024-01-15', '2025-03-15', 'valid', '2.4 MB', '550e8400-e29b-41d4-a716-446655440003'),
  ('880e8400-e29b-41d4-a716-446655440002', 'Livrete', '12-AB-34', 'livrete_mercedes.pdf', '2024-01-10', '2030-12-31', 'valid', '1.8 MB', '550e8400-e29b-41d4-a716-446655440003'),
  ('880e8400-e29b-41d4-a716-446655440003', 'Inspeção', '56-CD-78', 'inspecao_bmw_2024.pdf', '2023-11-20', '2024-11-20', 'expiring', '3.1 MB', '550e8400-e29b-41d4-a716-446655440004'),
  ('880e8400-e29b-41d4-a716-446655440004', 'Título de Propriedade', '90-EF-12', 'titulo_audi.pdf', '2024-02-01', '2030-12-31', 'valid', '1.2 MB', '550e8400-e29b-41d4-a716-446655440003')
ON CONFLICT (id) DO NOTHING;

-- Insert demo fines
INSERT INTO fines (id, type, vehicle_plate, driver_name, driver_license, amount, points, location, date, time, status, description, agent_id, agent_name, agent_badge, photos) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', 'Excesso de Velocidade', '12-AB-34', 'João Silva Santos', '123456789', 120.00, 2, 'Av. da Liberdade, Lisboa', '2024-02-20', '14:30', 'pending', 'Velocidade registada: 80km/h em zona de 50km/h', '550e8400-e29b-41d4-a716-446655440002', 'João Silva Santos', 'AG001234', ARRAY['https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=400']),
  ('990e8400-e29b-41d4-a716-446655440002', 'Estacionamento Indevido', '56-CD-78', 'Maria João Ferreira', '987654321', 60.00, 0, 'Rua Augusta, Lisboa', '2024-02-19', '16:45', 'paid', 'Estacionamento em local proibido', '550e8400-e29b-41d4-a716-446655440002', 'João Silva Santos', 'AG001234', NULL),
  ('990e8400-e29b-41d4-a716-446655440003', 'Uso de Telemóvel', '90-EF-12', 'Carlos Manuel Costa', '456789123', 120.00, 2, 'Marquês de Pombal, Lisboa', '2024-02-18', '09:15', 'contested', 'Uso de telemóvel durante a condução', '550e8400-e29b-41d4-a716-446655440002', 'João Silva Santos', 'AG001234', NULL)
ON CONFLICT (id) DO NOTHING;

-- Update fines with payment/contest dates
UPDATE fines SET payment_date = '2024-02-25' WHERE id = '990e8400-e29b-41d4-a716-446655440002';
UPDATE fines SET contest_date = '2024-02-28', contest_reason = 'Estava a usar sistema mãos-livres' WHERE id = '990e8400-e29b-41d4-a716-446655440003';

-- Insert demo notifications
INSERT INTO notifications (id, user_id, type, title, description, vehicle_plate, priority, read) VALUES
  ('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'expiry', 'Seguro a Expirar', 'O seguro do seu Mercedes-Benz C-Class expira em 15 dias', '12-AB-34', 'high', false),
  ('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'fine', 'Nova Multa Registada', 'Foi registada uma multa por excesso de velocidade', '12-AB-34', 'high', false),
  ('aa0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'expiry', 'Inspeção Periódica', 'A inspeção do BMW X5 expira em 30 dias', '56-CD-78', 'medium', true),
  ('aa0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'reminder', 'Renovação de Documentos', 'Lembre-se de renovar os documentos que expiram este mês', NULL, 'medium', true),
  ('aa0e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'system', 'Atualização da App', 'Nova versão disponível com melhorias de segurança', NULL, 'low', true)
ON CONFLICT (id) DO NOTHING;