/*
  # Add companies table and improve nota registration

  1. New Tables
    - `companies`
      - `cnpj` (text, primary key)
      - `nome` (text, company name)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on companies table
    - Add policies for read/write access
*/

CREATE TABLE IF NOT EXISTS companies (
  cnpj text PRIMARY KEY,
  nome text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read companies"
  ON companies
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert companies"
  ON companies
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);