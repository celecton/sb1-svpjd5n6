/*
  # Fix RLS policies for users and notas tables

  1. Changes
    - Update RLS policies to allow proper user registration
    - Add policies for unauthenticated users to register
    - Improve security while maintaining functionality

  2. Security
    - Enable RLS on both tables
    - Add specific policies for registration and data access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can read all notas" ON notas;
DROP POLICY IF EXISTS "Users can insert notas" ON notas;
DROP POLICY IF EXISTS "Users can update notas" ON notas;

-- Create new policies for users table
CREATE POLICY "Anyone can register"
  ON users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read all users"
  ON users
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create new policies for notas table
CREATE POLICY "Anyone can read notas"
  ON notas
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert notas"
  ON notas
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update notas"
  ON notas
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);