-- Cria a tabela para armazenar tokens de push notification dos dispositivos
CREATE TABLE device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text,
  created_at timestamp with time zone DEFAULT now()
);

-- Garante que cada usuário pode ter múltiplos tokens, mas não duplicados
CREATE UNIQUE INDEX device_tokens_user_token_idx ON device_tokens(user_id, token); 