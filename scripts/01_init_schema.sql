-- Create users table (extends Supabase auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
  student_id TEXT UNIQUE,
  department TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create inventory items table
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  quantity_total INTEGER NOT NULL DEFAULT 0,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view inventory" ON inventory_items
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert inventory" ON inventory_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can update inventory" ON inventory_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can delete inventory" ON inventory_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create borrow requests table
CREATE TABLE borrow_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  quantity_requested INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'borrowed', 'returned')),
  approved_by UUID REFERENCES profiles(id),
  borrow_date TIMESTAMP,
  return_date TIMESTAMP,
  actual_return_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE borrow_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own requests" ON borrow_requests
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all requests" ON borrow_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Students can create borrow requests" ON borrow_requests
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can update requests" ON borrow_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create borrow history table
CREATE TABLE borrow_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  quantity INTEGER NOT NULL,
  borrow_date TIMESTAMP NOT NULL,
  return_date TIMESTAMP,
  status TEXT DEFAULT 'returned',
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE borrow_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own history" ON borrow_history
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all history" ON borrow_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('approval', 'rejection', 'reminder', 'alert')),
  related_item_id UUID REFERENCES inventory_items(id),
  related_request_id UUID REFERENCES borrow_requests(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_borrow_requests_student ON borrow_requests(student_id);
CREATE INDEX idx_borrow_requests_item ON borrow_requests(item_id);
CREATE INDEX idx_borrow_requests_status ON borrow_requests(status);
CREATE INDEX idx_borrow_history_student ON borrow_history(student_id);
CREATE INDEX idx_inventory_category ON inventory_items(category);
CREATE INDEX idx_notifications_user ON notifications(user_id);
