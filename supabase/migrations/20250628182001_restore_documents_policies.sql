-- Restaurar políticas RLS para a tabela documents
-- Criado em: 2025-01-28

-- Habilitar RLS na tabela documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam seus próprios documentos
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('operator', 'agent')
    )
  );

-- Política para permitir que usuários criem seus próprios documentos
CREATE POLICY "Users can create their own documents" ON documents
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id
  );

-- Política para permitir que usuários atualizem seus próprios documentos
CREATE POLICY "Users can update their own documents" ON documents
  FOR UPDATE USING (
    auth.uid() = owner_id OR 
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('operator', 'agent')
    )
  );

-- Política para permitir que usuários deletem seus próprios documentos
CREATE POLICY "Users can delete their own documents" ON documents
  FOR DELETE USING (
    auth.uid() = owner_id OR 
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('operator', 'agent')
    )
  );

-- Política para operadores e agentes verem todos os documentos
CREATE POLICY "Operators and agents can view all documents" ON documents
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('operator', 'agent')
    )
  );

-- Política para operadores e agentes atualizarem todos os documentos
CREATE POLICY "Operators and agents can update all documents" ON documents
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('operator', 'agent')
    )
  );

-- Política para operadores e agentes deletarem todos os documentos
CREATE POLICY "Operators and agents can delete all documents" ON documents
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('operator', 'agent')
    )
  );

-- Comentários explicativos
COMMENT ON POLICY "Users can view their own documents" ON documents IS 'Permite que usuários vejam seus próprios documentos ou que operadores/agentes vejam todos';
COMMENT ON POLICY "Users can create their own documents" ON documents IS 'Permite que usuários criem seus próprios documentos';
COMMENT ON POLICY "Users can update their own documents" ON documents IS 'Permite que usuários atualizem seus próprios documentos ou que operadores/agentes atualizem todos';
COMMENT ON POLICY "Users can delete their own documents" ON documents IS 'Permite que usuários deletem seus próprios documentos ou que operadores/agentes deletem todos';
COMMENT ON POLICY "Operators and agents can view all documents" ON documents IS 'Permite que operadores e agentes vejam todos os documentos';
COMMENT ON POLICY "Operators and agents can update all documents" ON documents IS 'Permite que operadores e agentes atualizem todos os documentos';
COMMENT ON POLICY "Operators and agents can delete all documents" ON documents IS 'Permite que operadores e agentes deletem todos os documentos'; 