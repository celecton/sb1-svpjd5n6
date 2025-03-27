/*
  # Fix notas table schema

  1. Changes
    - Remove incorrect column references
    - Add proper column names matching the application code
    - Ensure all required fields are present

  2. Security
    - Maintain existing RLS policies
*/

-- Modify notas table to match application requirements
ALTER TABLE notas
  ADD COLUMN IF NOT EXISTS nome_empresa text,
  ADD COLUMN IF NOT EXISTS empresa_destino text;

-- Rename columns to match application expectations
ALTER TABLE notas 
  RENAME COLUMN nome_empresa TO "nomeEmpresa";

-- Update the table to ensure all required fields exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notas' AND column_name = 'numero_nota'
  ) THEN
    ALTER TABLE notas ADD COLUMN numero_nota text;
  END IF;
END $$;