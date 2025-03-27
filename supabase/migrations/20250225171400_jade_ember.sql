/*
  # Fix column names in notas table

  1. Changes
    - Standardize column naming convention
    - Add missing columns
    - Fix data types

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns with correct names
ALTER TABLE notas 
  ADD COLUMN IF NOT EXISTS "empresaDestino" text,
  ADD COLUMN IF NOT EXISTS "numeroNota" text,
  ADD COLUMN IF NOT EXISTS "cpdResponsavelCPF" text REFERENCES users(cpf),
  ADD COLUMN IF NOT EXISTS "finalizadaPorCPF" text REFERENCES users(cpf),
  ADD COLUMN IF NOT EXISTS "cpf" text REFERENCES users(cpf),
  ADD COLUMN IF NOT EXISTS "timestampCadastro" timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "timestampFinalizacao" timestamptz,
  ADD COLUMN IF NOT EXISTS "observacaoConferente" text,
  ADD COLUMN IF NOT EXISTS "numeroTransacao" text;

-- Copy data from old columns to new ones (if they exist)
DO $$ 
BEGIN
  -- empresa_destino to empresaDestino
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notas' AND column_name = 'empresa_destino'
  ) THEN
    UPDATE notas SET "empresaDestino" = empresa_destino;
    ALTER TABLE notas DROP COLUMN empresa_destino;
  END IF;

  -- numero_nota to numeroNota
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notas' AND column_name = 'numero_nota'
  ) THEN
    UPDATE notas SET "numeroNota" = numero_nota;
    ALTER TABLE notas DROP COLUMN numero_nota;
  END IF;

  -- cpf_cpd to cpdResponsavelCPF
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notas' AND column_name = 'cpf_cpd'
  ) THEN
    UPDATE notas SET "cpdResponsavelCPF" = cpf_cpd;
    ALTER TABLE notas DROP COLUMN cpf_cpd;
  END IF;

  -- cpf_conferente to finalizadaPorCPF
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notas' AND column_name = 'cpf_conferente'
  ) THEN
    UPDATE notas SET "finalizadaPorCPF" = cpf_conferente;
    ALTER TABLE notas DROP COLUMN cpf_conferente;
  END IF;

  -- cpf_motorista to cpf
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notas' AND column_name = 'cpf_motorista'
  ) THEN
    UPDATE notas SET "cpf" = cpf_motorista;
    ALTER TABLE notas DROP COLUMN cpf_motorista;
  END IF;

  -- timestamp_cadastro to timestampCadastro
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notas' AND column_name = 'timestamp_cadastro'
  ) THEN
    UPDATE notas SET "timestampCadastro" = timestamp_cadastro;
    ALTER TABLE notas DROP COLUMN timestamp_cadastro;
  END IF;

  -- timestamp_finalizacao to timestampFinalizacao
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notas' AND column_name = 'timestamp_finalizacao'
  ) THEN
    UPDATE notas SET "timestampFinalizacao" = timestamp_finalizacao;
    ALTER TABLE notas DROP COLUMN timestamp_finalizacao;
  END IF;

  -- observacao_conferente to observacaoConferente
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notas' AND column_name = 'observacao_conferente'
  ) THEN
    UPDATE notas SET "observacaoConferente" = observacao_conferente;
    ALTER TABLE notas DROP COLUMN observacao_conferente;
  END IF;
END $$;