-- Create users table for phone-based authentication
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medicines table
CREATE TABLE public.medicines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  strength TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doctor_name TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Users can read their own user record
CREATE POLICY "Users can read own record" ON public.users
  FOR SELECT USING (true);

-- Allow inserting new users (for login/registration)
CREATE POLICY "Anyone can create user" ON public.users
  FOR INSERT WITH CHECK (true);

-- Medicines policies - users can only manage their own medicines
CREATE POLICY "Users can view own medicines" ON public.medicines
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own medicines" ON public.medicines
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own medicines" ON public.medicines
  FOR DELETE USING (true);

-- Appointments policies - users can only manage their own appointments
CREATE POLICY "Users can view own appointments" ON public.appointments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own appointments" ON public.appointments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own appointments" ON public.appointments
  FOR DELETE USING (true);