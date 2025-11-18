# Profile Insertion Fix - Step by Step Guide

## Problem

Empty error object `{}` when trying to insert profile during signup:

```
Failed to upsert profile - Error object: {}
```

This indicates a RLS (Row Level Security) policy issue or missing column.

## Root Causes

1. **Missing `avatar_url` column** in profiles table
2. **Missing `role` column default** - signup doesn't specify role
3. **RLS policies too restrictive** - INSERT policy missing or invalid

## Solution Steps

### Step 1: Verify Profile Schema

Run this in Supabase SQL Editor to see current table structure:

```
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

**Expected columns:**

- `id` (UUID, NOT NULL) - References auth.users
- `email` (TEXT, NOT NULL)
- `full_name` (TEXT, nullable)
- `student_id` (TEXT, UNIQUE, nullable)
- `role` (TEXT, NOT NULL) - Should default to 'student'
- `department` (TEXT, nullable)
- `avatar_url` (TEXT, nullable) - **May be missing**
- `created_at` (TIMESTAMP) - Should have default NOW()

### Step 2: Add Missing Columns & Defaults

Run `scripts/17_fix_role_column.sql` to:

- Add `avatar_url` column if missing
- Set proper defaults for role column
- Ensure NOT NULL constraints

### Step 3: Fix RLS Policies

Run `scripts/15_fix_profile_insert.sql` to:

- Drop all problematic policies
- Create new INSERT policy allowing users to insert own profile
- Recreate SELECT/UPDATE policies for security
- Ensure RLS is properly enabled

### Step 4: Test Signup

1. Open browser DevTools (F12)
2. Go to Console tab
3. Attempt signup with test data:

   - Nama Lengkap: Test User
   - NIS: 2024999
   - Email: test2024@school.com
   - Password: TestPass123
   - Avatar: Any image

4. Check console output:
   - **Success**: "Profile upserted successfully:" message
   - **Error**: See detailed error output with code and details
   - **Empty Error**: Still means RLS blocking - check policies again

### Step 5: Verify Data in Database

After successful signup:

1. Go to Supabase Dashboard
2. Click "Table Editor" → "profiles"
3. Look for new row with:
   - `id` matching the user UUID
   - `full_name`, `student_id`, `email` filled
   - `role` = 'student'
   - `avatar_url` filled if image uploaded

## Common Issues & Solutions

### Issue: "Failed to upsert profile - Error object: {}"

**Causes:**

1. RLS INSERT policy missing
2. Column doesn't exist but code tries to insert it
3. Constraint violated (e.g., duplicate student_id)

**Solutions:**

1. Run script 15 to fix RLS policies
2. Run script 17 to ensure columns exist
3. Check browser console for full error details

### Issue: "Column 'avatar_url' does not exist"

**Solution:** Run script 17 to add missing column

### Issue: "Permission denied for role authenticated"

**Meaning:** RLS policy `profiles_insert_own` missing or misconfigured
**Solution:** Run script 15 to recreate policies

### Issue: Signup succeeds but profile not created

**Causes:**

1. Error silently caught in try-catch
2. RLS policy exists but uses wrong user check

**Solution:**

- Check browser console for detailed error
- Verify policy uses `auth.uid() = id` (current implementation)

## Debugging Checklist

- [ ] Run `scripts/16_verify_profiles_schema.sql` to see current columns
- [ ] Run `scripts/17_fix_role_column.sql` to add missing columns/defaults
- [ ] Run `scripts/15_fix_profile_insert.sql` to fix RLS policies
- [ ] Open browser DevTools Console tab
- [ ] Attempt signup and check console output
- [ ] Verify profile appears in Supabase table editor
- [ ] Check that avatar_url, role, student_id are populated

## Files Updated

- `scripts/15_fix_profile_insert.sql` - Fixed RLS policies and adds avatar_url column
- `scripts/16_verify_profiles_schema.sql` - Verification query for schema
- `scripts/17_fix_role_column.sql` - Ensures role column defaults and constraints
- `app/auth/sign-up/page.tsx` - Enhanced error logging with code/details/hint output
