/*
  # Add rejection observation field to notas table

  1. Changes
    - Add rejection observation field for CPD
    - Add rejection timestamp field
*/

-- Add new columns for rejection tracking
ALTER TABLE notas 
  ADD COLUMN IF NOT EXISTS "observacaoCPD" text,
  ADD COLUMN IF NOT EXISTS "timestampRejeicao" timestamptz;