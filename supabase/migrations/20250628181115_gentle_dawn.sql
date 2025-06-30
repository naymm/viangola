/*
  # Dados de Demonstração

  1. Utilizadores de demonstração
  2. Veículos de exemplo
  3. Condutores de exemplo
  4. Documentos de exemplo
  5. Multas de exemplo
  6. Notificações de exemplo
*/

-- Inserir utilizadores de demonstração
INSERT INTO users (id, email, name, role, badge, company, photo, phone, address, birth_date) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'operador@autoveritas.pt', 'Admin Sistema', 'operator', 'OP001', NULL, 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', '+351 910 000 001', 'Rua do Sistema, 1, Lisboa', '1980-01-01'),
  ('550e8400-e29b-41d4-a716-446655440002', 'agente@autoveritas.pt', 'João Silva Santos', 'agent', 'AG001234', NULL, 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', '+351 912 345 678', 'Rua das Flores, 123, Lisboa', '1985-06-20'),
  ('550e8400-e29b-41d4-a716-446655440003', 'cidadao@autoveritas.pt', 'Maria João Ferreira', 'citizen', NULL, NULL, 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', '+351 923 456 789', 'Av. da República, 456, Porto', '1992-11-15'),
  ('550e8400-e29b-41d4-a716-446655440004', 'empresa@autoveritas.pt', 'Carlos Manuel Costa', 'company', NULL, 'TransLisboa Lda.', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop', '+351 934 567 890', 'Rua Central, 789, Coimbra', '1978-04-08')
ON CONFLICT (id) DO NOTHING;

-- Inserir veículos de exemplo
INSERT INTO vehicles (id, plate, brand, model, year, color, type, owner_id, insurance_expiry, circulation_expiry, inspection_expiry, status) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '12-AB-34', 'Mercedes-Benz', 'C-Class', 2020, 'Preto', 'Ligeiro', '550e8400-e29b-41d4-a716-446655440003', '2025-03-15', '2025-12-31', '2025-06-20', 'active'),
  ('660e8400-e29b-41d4-a716-446655440002', '56-CD-78', 'BMW', 'X5', 2019, 'Branco', 'SUV', '550e8400-e29b-41d4-a716-446655440004', '2024-12-15', '2025-12-31', '2024-11-10', 'active'),
  ('660e8400-e29b-41d4-a716-446655440003', '90-EF-12', 'Audi', 'A4', 2021, 'Azul', 'Ligeiro', '550e8400-e29b-41d4-a716-446655440003', '2025-08-20', '2025-12-31', '2025-04-15', 'active')
ON CONFLICT (plate) DO NOTHING;

-- Inserir condutores de exemplo
INSERT INTO drivers (id, name, license_number, categories, issue_date, expiry_date, birth_date, address, phone, email, photo, status, points, max_points, medical_exam, company, owner_id) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', 'João Silva Santos', '123456789', ARRAY['B', 'A1'], '2018-03-15', '2028-03-15', '1985-06-20', 'Rua das Flores, 123, Lisboa', '+351 912 345 678', 'joao.silva@email.com', 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', 'valid', 2, 12, '2026-06-20', NULL, '550e8400-e29b-41d4-a716-446655440004'),
  ('770e8400-e29b-41d4-a716-446655440002', 'Maria João Ferreira', '987654321', ARRAY['B'], '2020-01-10', '2030-01-10', '1992-11-15', 'Av. da República, 456, Porto', '+351 923 456 789', 'maria.ferreira@email.com', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', 'valid', 0, 12, '2024-12-15', NULL, '550e8400-e29b-41d4-a716-446655440004'),
  ('770e8400-e29b-41d4-a716-446655440003', 'Carlos Manuel Costa', '456789123', ARRAY['B', 'C', 'D'], '2015-09-20', '2025-09-20', '1978-04-08', 'Rua Central, 789, Coimbra', '+351 934 567 890', 'carlos.costa@email.com', 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', 'suspended', 12, 12, '2025-04-08', 'TransLisboa Lda.', NULL)
ON CONFLICT (license_number) DO NOTHING;

-- Inserir documentos de exemplo
INSERT INTO documents (id, type, vehicle_plate, file_name, upload_date, expiry_date, status, size, owner_id) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', 'Seguro', '12-AB-34', 'seguro_mercedes_2024.pdf', '2024-01-15', '2025-03-15', 'valid', '2.4 MB', '550e8400-e29b-41d4-a716-446655440003'),
  ('880e8400-e29b-41d4-a716-446655440002', 'Livrete', '12-AB-34', 'livrete_mercedes.pdf', '2024-01-10', '2030-12-31', 'valid', '1.8 MB', '550e8400-e29b-41d4-a716-446655440003'),
  ('880e8400-e29b-41d4-a716-446655440003', 'Inspeção', '56-CD-78', 'inspecao_bmw_2024.pdf', '2023-11-20', '2024-11-20', 'expiring', '3.1 MB', '550e8400-e29b-41d4-a716-446655440004'),
  ('880e8400-e29b-41d4-a716-446655440004', 'Título de Propriedade', '90-EF-12', 'titulo_audi.pdf', '2024-02-01', '2030-12-31', 'valid', '1.2 MB', '550e8400-e29b-41d4-a716-446655440003')
ON CONFLICT (id) DO NOTHING;

-- Inserir multas de exemplo
INSERT INTO fines (id, type, vehicle_plate, driver_name, driver_license, amount, points, location, date, time, status, description, agent_id, agent_name, agent_badge, photos) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', 'Excesso de Velocidade', '12-AB-34', 'João Silva Santos', '123456789', 120.00, 2, 'Av. da Liberdade, Lisboa', '2024-02-20', '14:30', 'pending', 'Velocidade registada: 80km/h em zona de 50km/h', '550e8400-e29b-41d4-a716-446655440002', 'João Silva Santos', 'AG001234', ARRAY['https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=400']),
  ('990e8400-e29b-41d4-a716-446655440002', 'Estacionamento Indevido', '56-CD-78', 'Maria João Ferreira', '987654321', 60.00, 0, 'Rua Augusta, Lisboa', '2024-02-19', '16:45', 'paid', 'Estacionamento em local proibido', '550e8400-e29b-41d4-a716-446655440002', 'João Silva Santos', 'AG001234', NULL),
  ('990e8400-e29b-41d4-a716-446655440003', 'Uso de Telemóvel', '90-EF-12', 'Carlos Manuel Costa', '456789123', 120.00, 2, 'Marquês de Pombal, Lisboa', '2024-02-18', '09:15', 'contested', 'Uso de telemóvel durante a condução', '550e8400-e29b-41d4-a716-446655440002', 'João Silva Santos', 'AG001234', NULL)
ON CONFLICT (id) DO NOTHING;

-- Atualizar multas com datas de pagamento/contestação
UPDATE fines SET payment_date = '2024-02-25' WHERE id = '990e8400-e29b-41d4-a716-446655440002';
UPDATE fines SET contest_date = '2024-02-28', contest_reason = 'Estava a usar sistema mãos-livres' WHERE id = '990e8400-e29b-41d4-a716-446655440003';

-- Inserir notificações de exemplo
INSERT INTO notifications (id, user_id, type, title, description, vehicle_plate, priority, read) VALUES
  ('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'expiry', 'Seguro a Expirar', 'O seguro do seu Mercedes-Benz C-Class expira em 15 dias', '12-AB-34', 'high', false),
  ('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'fine', 'Nova Multa Registada', 'Foi registada uma multa por excesso de velocidade', '12-AB-34', 'high', false),
  ('aa0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'expiry', 'Inspeção Periódica', 'A inspeção do BMW X5 expira em 30 dias', '56-CD-78', 'medium', true),
  ('aa0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'reminder', 'Renovação de Documentos', 'Lembre-se de renovar os documentos que expiram este mês', NULL, 'medium', true),
  ('aa0e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'system', 'Atualização da App', 'Nova versão disponível com melhorias de segurança', NULL, 'low', true)
ON CONFLICT (id) DO NOTHING;