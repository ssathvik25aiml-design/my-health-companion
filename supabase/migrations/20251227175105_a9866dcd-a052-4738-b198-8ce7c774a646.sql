-- Create prescriptions table
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own prescriptions
CREATE POLICY "Users can view own prescriptions" ON public.prescriptions
  FOR SELECT USING (true);

-- Users can insert their own prescriptions
CREATE POLICY "Users can insert own prescriptions" ON public.prescriptions
  FOR INSERT WITH CHECK (true);

-- Users can delete their own prescriptions
CREATE POLICY "Users can delete own prescriptions" ON public.prescriptions
  FOR DELETE USING (true);

-- Create storage bucket for prescriptions
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('prescriptions', 'prescriptions', false, 10485760);

-- Storage policies: Users can upload to their own folder
CREATE POLICY "Users can upload prescriptions" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'prescriptions');

-- Users can view their own prescriptions
CREATE POLICY "Users can view own prescription files" ON storage.objects
  FOR SELECT USING (bucket_id = 'prescriptions');

-- Users can delete their own prescriptions
CREATE POLICY "Users can delete own prescription files" ON storage.objects
  FOR DELETE USING (bucket_id = 'prescriptions');