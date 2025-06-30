console.log('🔧 Políticas RLS para restaurar na tabela documents\n');

console.log('📋 Execute estas queries no SQL Editor do Supabase:\n');

console.log('1. Habilitar RLS:');
console.log('ALTER TABLE documents ENABLE ROW LEVEL SECURITY;\n');

console.log('2. Políticas de acesso:');
console.log(`
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
`);

console.log('\n📝 Instruções:');
console.log('1. Acesse o painel do Supabase');
console.log('2. Vá para SQL Editor');
console.log('3. Cole e execute as queries acima');
console.log('4. Verifique se as políticas foram criadas em Authentication > Policies');

console.log('\n🔍 Para verificar se funcionou:');
console.log('- Vá para Authentication > Policies');
console.log('- Procure pela tabela "documents"');
console.log('- Deve mostrar 7 políticas criadas');

console.log('\n✅ Após aplicar, teste o upload de documentos no app!'); 