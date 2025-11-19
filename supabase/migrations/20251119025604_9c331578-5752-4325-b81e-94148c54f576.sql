-- Create function to execute SQL DDL statements
-- This is needed by the execute-ddl edge function
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Execute the SQL
  EXECUTE sql_query;
  RETURN 'Success';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
-- (authorization is handled in the edge function via has_role check)
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;