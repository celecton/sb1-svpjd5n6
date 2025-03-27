/*
  # Initial Schema Setup

  1. New Tables
    - `users`
      - `cpf` (text, primary key) - User's CPF
      - `nome` (text) - User's name
      - `telefone` (text) - User's phone number
      - `funcao` (text) - User's role
      - `created_at` (timestamptz) - Creation timestamp
    
    - `notas`
      - `id` (uuid, primary key) - Note ID
      - `cnpj` (text) - Company CNPJ
      - `nome_empresa` (text) - Company name
      - `empresa_destino` (text) - Destination company
      - `numero_nota` (text) - Note number
      - `perecivel` (text) - If perishable
      - `observacao` (text) - Observation
      - `status` (text) - Note status
      - `temperatura` (numeric) - Temperature (for perishable)
      - `numero_transacao` (text) - Transaction number
      - `observacao_conferente` (text) - Conferente observation
      - `timestamp_cadastro` (timestamptz) - Creation timestamp
      - `timestamp_finalizacao` (timestamptz) - Completion timestamp
      - `cpf_motorista` (text) - Driver's CPF (foreign key)
      - `cpf_cpd` (text) - CPD's CPF (foreign key)
      - `cpf_conferente` (text) - Conferente's CPF (foreign key)
      - `fotos` (text[]) - Array of photo URLs
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  cpf text PRIMARY KEY,
  nome text NOT NULL,
  telefone text NOT NULL,
  funcao text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create notas table
CREATE TABLE IF NOT EXISTS notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj text NOT NULL,
  nome_empresa text NOT NULL,
  empresa_destino text NOT NULL,
  numero_nota text NOT NULL,
  perecivel text NOT NULL,
  observacao text,
  status text NOT NULL,
  temperatura numeric,
  numero_transacao text,
  observacao_conferente text,
  timestamp_cadastro timestamptz NOT NULL DEFAULT now(),
  timestamp_finalizacao timestamptz,
  cpf_motorista text REFERENCES users(cpf),
  cpf_cpd text REFERENCES users(cpf),
  cpf_conferente text REFERENCES users(cpf),
  fotos text[],
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for notas table
CREATE POLICY "Users can read all notas"
  ON notas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert notas"
  ON notas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update notas"
  ON notas
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);