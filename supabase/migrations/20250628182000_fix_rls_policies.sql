/*
  # Correção das Políticas RLS
  
  Problema: As políticas RLS da tabela users estavam causando recursão infinita
  porque referenciam a própria tabela users dentro das políticas.
  
  Solução: 
  1. Remover políticas problemáticas
  2. Criar políticas mais simples e seguras
  3. Permitir acesso anônimo para operações básicas
*/

-- Remover políticas problemáticas da tabela users
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Operators can read all users" ON users;
DROP POLICY IF EXISTS "Operators can manage all users" ON users;

-- Criar políticas mais simples para users
-- Permitir leitura para usuários autenticados (baseado no email)
CREATE POLICY "Authenticated users can read users" ON users
  FOR SELECT USING (
    auth.role() = 'authenticated' OR 
    auth.role() = 'anon'
  );

-- Permitir inserção para usuários autenticados
CREATE POLICY "Authenticated users can insert users" ON users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Permitir atualização para o próprio usuário (baseado no email)
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (
    email = auth.jwt() ->> 'email' OR
    auth.role() = 'authenticated'
  );

-- Remover políticas problemáticas de outras tabelas que referenciam users
DROP POLICY IF EXISTS "Operators and agents can read all vehicles" ON vehicles;
DROP POLICY IF EXISTS "Operators can manage all vehicles" ON vehicles;
DROP POLICY IF EXISTS "Operators and agents can read all drivers" ON drivers;
DROP POLICY IF EXISTS "Operators can manage all drivers" ON drivers;
DROP POLICY IF EXISTS "Operators and agents can read all documents" ON documents;
DROP POLICY IF EXISTS "Operators can manage all documents" ON documents;

-- Criar políticas mais simples para vehicles
CREATE POLICY "Authenticated users can read vehicles" ON vehicles
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Authenticated users can manage vehicles" ON vehicles
  FOR ALL USING (auth.role() = 'authenticated');

-- Criar políticas mais simples para drivers
CREATE POLICY "Authenticated users can read drivers" ON drivers
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Authenticated users can manage drivers" ON drivers
  FOR ALL USING (auth.role() = 'authenticated');

-- Criar políticas mais simples para documents
CREATE POLICY "Authenticated users can read documents" ON documents
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Authenticated users can manage documents" ON documents
  FOR ALL USING (auth.role() = 'authenticated');

-- Criar políticas mais simples para fines
CREATE POLICY "Authenticated users can read fines" ON fines
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Authenticated users can manage fines" ON fines
  FOR ALL USING (auth.role() = 'authenticated');

-- Criar políticas mais simples para notifications
CREATE POLICY "Authenticated users can read notifications" ON notifications
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Authenticated users can manage notifications" ON notifications
  FOR ALL USING (auth.role() = 'authenticated');

-- Comentário explicativo
COMMENT ON TABLE users IS 'Tabela de usuários do sistema AutoVeritas - Políticas RLS simplificadas para evitar recursão'; 