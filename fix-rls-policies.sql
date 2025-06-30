-- Script para corrigir as políticas RLS para autenticação local
-- Execute este script no SQL Editor do Supabase Dashboard

-- Primeiro, desabilitar RLS temporariamente para limpar as políticas
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE fines DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Authenticated users can read users" ON users;
DROP POLICY IF EXISTS "Authenticated users can insert users" ON users;
DROP POLICY IF EXISTS "Authenticated users can update users" ON users;
DROP POLICY IF EXISTS "Authenticated users can read vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can manage vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can read drivers" ON drivers;
DROP POLICY IF EXISTS "Authenticated users can manage drivers" ON drivers;
DROP POLICY IF EXISTS "Authenticated users can read documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can manage documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can read fines" ON fines;
DROP POLICY IF EXISTS "Authenticated users can manage fines" ON fines;
DROP POLICY IF EXISTS "Authenticated users can read notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can manage notifications" ON notifications;

-- Reabilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Criar políticas que permitem acesso total para desenvolvimento
-- Em produção, estas políticas devem ser mais restritivas

-- Políticas para users
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true);

-- Políticas para vehicles
CREATE POLICY "Allow all operations on vehicles" ON vehicles
  FOR ALL USING (true);

-- Políticas para drivers
CREATE POLICY "Allow all operations on drivers" ON drivers
  FOR ALL USING (true);

-- Políticas para documents
CREATE POLICY "Allow all operations on documents" ON documents
  FOR ALL USING (true);

-- Políticas para fines
CREATE POLICY "Allow all operations on fines" ON fines
  FOR ALL USING (true);

-- Políticas para notifications
CREATE POLICY "Allow all operations on notifications" ON notifications
  FOR ALL USING (true);

-- Verificar se as políticas foram aplicadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname; 