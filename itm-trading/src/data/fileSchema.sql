-- File Management Schema untuk ITM Trading
-- Tambahkan ke supabase-setup.sql

-- File records table
CREATE TABLE IF NOT EXISTS public.files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  original_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text,
  uploaded_by uuid REFERENCES auth.users(id),
  folder_path text DEFAULT '/',
  is_public boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- File sharing/permissions table
CREATE TABLE IF NOT EXISTS public.file_shares (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id uuid REFERENCES public.files(id) ON DELETE CASCADE,
  shared_with uuid REFERENCES auth.users(id),
  permission text DEFAULT 'read', -- 'read', 'write', 'admin'
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- File activity logs
CREATE TABLE IF NOT EXISTS public.file_activities (
  id bigserial PRIMARY KEY,
  file_id uuid REFERENCES public.files(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL, -- 'upload', 'download', 'delete', 'share', 'rename'
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for files
CREATE POLICY "files_own_access" ON public.files 
  FOR ALL TO authenticated 
  USING (uploaded_by = auth.uid() OR is_public = true);

CREATE POLICY "files_shared_access" ON public.files 
  FOR SELECT TO authenticated 
  USING (
    id IN (
      SELECT file_id FROM public.file_shares 
      WHERE shared_with = auth.uid()
    )
  );

-- RLS Policies for file_shares
CREATE POLICY "file_shares_own" ON public.file_shares 
  FOR ALL TO authenticated 
  USING (created_by = auth.uid() OR shared_with = auth.uid());

-- RLS Policies for file_activities
CREATE POLICY "file_activities_view" ON public.file_activities 
  FOR SELECT TO authenticated 
  USING (
    user_id = auth.uid() OR 
    file_id IN (
      SELECT id FROM public.files 
      WHERE uploaded_by = auth.uid()
    )
  );

-- Storage bucket policy (run in Supabase Console)
-- CREATE POLICY "Allow authenticated uploads" ON storage.objects 
--   FOR INSERT TO authenticated 
--   WITH CHECK (bucket_id = 'documents');

-- CREATE POLICY "Allow users to view own files" ON storage.objects 
--   FOR SELECT TO authenticated 
--   USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.files;
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_shares;
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_activities;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS files_uploaded_by_idx ON public.files(uploaded_by);
CREATE INDEX IF NOT EXISTS files_folder_path_idx ON public.files(folder_path);
CREATE INDEX IF NOT EXISTS files_created_at_idx ON public.files(created_at DESC);
CREATE INDEX IF NOT EXISTS file_activities_file_id_idx ON public.file_activities(file_id);
CREATE INDEX IF NOT EXISTS file_activities_user_id_idx ON public.file_activities(user_id);



