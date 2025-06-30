# 🗄️ Guia de Configuração do Supabase Storage

## ❌ Problema Identificado
O bucket `documents` não existe no seu projeto Supabase, por isso os uploads estão falhando com 0 bytes.

## ✅ Solução Passo a Passo

### 1. Acessar o Dashboard do Supabase
1. Vá para [https://supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione o projeto `viangola`

### 2. Criar o Bucket "documents"
1. No menu lateral, clique em **Storage**
2. Clique em **New bucket**
3. Configure o bucket:
   - **Name**: `documents`
   - **Public bucket**: ✅ Marque esta opção
   - **File size limit**: `50 MB`
   - **Allowed MIME types**: `image/jpeg, image/png, image/heic, application/pdf`
4. Clique em **Create bucket**

### 3. Configurar Políticas RLS (Row Level Security)
1. No bucket `documents`, clique na aba **Policies**
2. Clique em **New Policy**
3. Configure as seguintes políticas:

#### Política 1: Upload de Documentos
```sql
-- Nome: Users can upload documents
-- Operação: INSERT
-- Definição:
CREATE POLICY "Users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documents');
```

#### Política 2: Visualização de Documentos
```sql
-- Nome: Users can view documents
-- Operação: SELECT
-- Definição:
CREATE POLICY "Users can view documents" ON storage.objects
FOR SELECT USING (bucket_id = 'documents');
```

#### Política 3: Atualização de Documentos
```sql
-- Nome: Users can update documents
-- Operação: UPDATE
-- Definição:
CREATE POLICY "Users can update documents" ON storage.objects
FOR UPDATE USING (bucket_id = 'documents');
```

#### Política 4: Exclusão de Documentos
```sql
-- Nome: Users can delete documents
-- Operação: DELETE
-- Definição:
CREATE POLICY "Users can delete documents" ON storage.objects
FOR DELETE USING (bucket_id = 'documents');
```

### 4. Verificar Configuração
Execute o script de verificação:
```bash
node check-storage.js
```

Você deve ver:
```
✅ Bucket "documents" encontrado!
   - Nome: documents
   - Público: Sim
```

### 5. Testar Upload
1. Abra o app no Expo Go
2. Vá para a aba **Documentos**
3. Tente fazer upload de uma foto
4. Verifique se o arquivo aparece no bucket

## 🔧 Configuração Avançada (Opcional)

### Políticas Mais Restritivas
Se quiser mais segurança, use estas políticas:

```sql
-- Upload apenas para usuários autenticados
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);

-- Visualização apenas para o proprietário e operadores
CREATE POLICY "Users can view own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('operator', 'agent')
    )
  )
);
```

### Configuração de CORS (se necessário)
Se houver problemas de CORS, adicione no SQL Editor:

```sql
-- Permitir uploads de qualquer origem (desenvolvimento)
INSERT INTO storage.cors (bucket_id, allowed_origins, allowed_methods, allowed_headers, max_age_seconds)
VALUES ('documents', ARRAY['*'], ARRAY['GET', 'POST', 'PUT', 'DELETE'], ARRAY['*'], 3600);
```

## 🚨 Troubleshooting

### Erro: "Bucket not found"
- Verifique se o bucket foi criado corretamente
- Confirme o nome: `documents` (exatamente assim)

### Erro: "Access denied"
- Verifique se as políticas RLS estão configuradas
- Confirme se o bucket é público

### Erro: "File size too large"
- Aumente o limite no bucket para 50MB ou mais

### Erro: "Invalid MIME type"
- Verifique se o tipo de arquivo está na lista permitida

## 📞 Suporte
Se ainda houver problemas:
1. Verifique os logs no console do Expo
2. Teste com o script `check-storage.js`
3. Verifique as políticas no dashboard do Supabase 