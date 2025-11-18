-- Allow inserts into borrow_history by the student who owns the record or by admins
-- Run this in Supabase SQL Editor as a project owner or using the service role.

-- Drop existing policy with the same name if present
DROP POLICY IF EXISTS "Students or Admins can insert history" ON public.borrow_history;

CREATE POLICY "Students or Admins can insert history" ON public.borrow_history
  FOR INSERT WITH CHECK (
    auth.uid() = student_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Optionally, allow admins to update/delete history
DROP POLICY IF EXISTS "Admins can update history" ON public.borrow_history;
CREATE POLICY "Admins can update history" ON public.borrow_history
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete history" ON public.borrow_history;
CREATE POLICY "Admins can delete history" ON public.borrow_history
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Note: Be careful with RLS policies. If you prefer to have the server insert history using a service role, use an RPC or edge function instead.
