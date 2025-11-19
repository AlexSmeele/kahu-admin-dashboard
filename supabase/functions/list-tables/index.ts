import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify the user is authenticated and is an admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    console.log('Checking admin role for user:', user.id);
    const { data: hasAdminRole, error: roleError } = await supabaseClient.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'admin' 
    });
    
    console.log('Role check result:', { hasAdminRole, roleError });
    
    if (roleError || !hasAdminRole) {
      console.error('Admin access denied:', { roleError, hasAdminRole });
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required', details: roleError?.message }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Connect to database using connection string
    const dbUrl = Deno.env.get('SUPABASE_DB_URL');
    if (!dbUrl) {
      throw new Error('Database URL not configured');
    }

    const { Client } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts');
    const client = new Client(dbUrl);
    await client.connect();

    try {
      console.log('Fetching all public schema tables...');

      // Query to get all tables in public schema with metadata
      const tablesQuery = `
        SELECT 
          t.table_name,
          t.table_schema,
          pg_catalog.obj_description(c.oid, 'pg_class') as table_comment,
          c.reltuples::bigint as estimated_rows
        FROM information_schema.tables t
        LEFT JOIN pg_catalog.pg_class c ON c.relname = t.table_name
        LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
          AND t.table_name NOT LIKE 'pg_%'
          AND t.table_name NOT LIKE '_prisma%'
          AND t.table_name NOT LIKE 'supabase_%'
        ORDER BY t.table_name;
      `;

      const result = await client.queryObject(tablesQuery);
      
      console.log(`Found ${result.rows.length} tables in public schema`);

      return new Response(
        JSON.stringify({
          tables: result.rows,
          count: result.rows.length
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } finally {
      await client.end();
    }

  } catch (error) {
    console.error('Error listing tables:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to list tables',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
