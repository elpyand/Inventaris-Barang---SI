-- Test script to simulate overdue borrow and test fine calculation
-- IMPORTANT: Run this script AFTER:
-- 1. scripts/01_init_schema.sql
-- 2. scripts/11_add_fine_balance.sql
-- 3. At least one borrow_request exists in the database

-- Step 1: Find an existing borrow_request with status 'borrowed' (or 'pending'/'approved')
-- Replace the REQUEST_ID below with an actual ID from your database
-- SELECT id, student_id, item_id, status, borrow_date, return_date FROM borrow_requests LIMIT 5;

-- Step 2: Update that request to have a return_date in the past (for testing)
-- Example: set return_date to 5 days ago (so fine = 5 * 5000 = 25000)
-- Uncomment and modify the following query:

-- UPDATE borrow_requests
-- SET 
--   status = 'borrowed',
--   borrow_date = NOW() - INTERVAL '12 days',
--   return_date = NOW() - INTERVAL '5 days'  -- 5 days past due
-- WHERE id = 'REQUEST_ID_HERE';

-- Step 3: Verify the request was updated
-- SELECT id, student_id, item_id, status, borrow_date, return_date, actual_return_date FROM borrow_requests WHERE id = 'REQUEST_ID_HERE';

-- Step 4: Then in the app UI (as admin):
-- 1. Go to Permintaan Peminjaman
-- 2. Find the request you just updated
-- 3. Click "Tandai Dikembalikan" (Mark as Returned)
-- 4. The fine should be calculated and added to profiles.fine_balance

-- Step 5: Verify fine was applied:
-- SELECT id, full_name, fine_balance FROM profiles WHERE fine_balance > 0;

-- Step 6: Check notifications sent to the student:
-- SELECT id, user_id, title, message, type, created_at FROM notifications WHERE type = 'reminder' ORDER BY created_at DESC LIMIT 5;
