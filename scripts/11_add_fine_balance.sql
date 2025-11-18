-- Add fine_balance column to profiles to track outstanding fines per user
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS fine_balance BIGINT DEFAULT 0;

-- Optional: ensure column is non-negative
ALTER TABLE public.profiles
ALTER COLUMN fine_balance SET DEFAULT 0;

-- Note: run this in Supabase SQL Editor or via psql with a service role.
