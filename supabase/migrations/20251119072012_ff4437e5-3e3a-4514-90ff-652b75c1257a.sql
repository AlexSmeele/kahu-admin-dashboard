-- Create migration history table
CREATE TABLE IF NOT EXISTS public.schema_migration_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES public.admin_content_tables(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  migration_type TEXT NOT NULL,
  changes JSONB NOT NULL,
  sql_executed TEXT,
  executed_by UUID REFERENCES auth.users(id),
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  affected_rows INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for migration history
ALTER TABLE public.schema_migration_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view migration history"
ON public.schema_migration_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert migration history"
ON public.schema_migration_history
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX idx_migration_history_table_id ON public.schema_migration_history(table_id);
CREATE INDEX idx_migration_history_executed_at ON public.schema_migration_history(executed_at DESC);