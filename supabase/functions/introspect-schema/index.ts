import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as postgres from 'https://deno.land/x/postgres@v0.17.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tableName } = await req.json()

    if (!tableName) {
      return new Response(
        JSON.stringify({ error: 'tableName is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has admin role
    const { data: hasAdminRole, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    })

    if (roleError || !hasAdminRole) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Query information_schema using direct Postgres connection
    const databaseUrl = Deno.env.get('SUPABASE_DB_URL')
    
    if (!databaseUrl) {
      return new Response(
        JSON.stringify({ error: 'Database URL not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Postgres client
    const pool = new postgres.Pool(databaseUrl, 3, true)
    const connection = await pool.connect()

    try {
      // Get column information
      const columnsResult = await connection.queryObject<{
        column_name: string;
        data_type: string;
        is_nullable: string;
        column_default: string | null;
        character_maximum_length: number | null;
        numeric_precision: number | null;
        numeric_scale: number | null;
        udt_name: string;
      }>({
        text: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale,
            udt_name
          FROM information_schema.columns
          WHERE table_schema = 'public' 
            AND table_name = $1
          ORDER BY ordinal_position
        `,
        args: [tableName]
      })

      // Get foreign key constraints
      const fkResult = await connection.queryObject<{
        column_name: string;
        foreign_table: string;
        foreign_column: string;
        constraint_name: string;
      }>({
        text: `
          SELECT 
            kcu.column_name,
            ccu.table_name AS foreign_table,
            ccu.column_name AS foreign_column,
            tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage ccu 
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
            AND tc.table_name = $1
        `,
        args: [tableName]
      })

      // Get unique and check constraints
      const constraintsResult = await connection.queryObject<{
        column_name: string;
        constraint_type: string;
        constraint_name: string;
      }>({
        text: `
          SELECT 
            kcu.column_name,
            tc.constraint_type,
            tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          WHERE tc.table_schema = 'public'
            AND tc.table_name = $1
            AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY', 'CHECK')
        `,
        args: [tableName]
      })

      // Get indexes on the table
      const indexResult = await connection.queryObject<{
        index_name: string;
        column_name: string;
        index_definition: string;
      }>({
        text: `
          SELECT 
            i.indexname as index_name,
            a.attname as column_name,
            pg_get_indexdef(ix.indexrelid) as index_definition
          FROM pg_indexes i
          JOIN pg_class c ON c.relname = i.indexname
          JOIN pg_index ix ON ix.indexrelid = c.oid
          JOIN pg_attribute a ON a.attrelid = ix.indrelid AND a.attnum = ANY(ix.indkey)
          WHERE i.tablename = $1
          AND i.schemaname = 'public'
          AND NOT i.indexname LIKE '%_pkey'
          ORDER BY i.indexname, a.attnum
        `,
        args: [tableName]
      })

      return new Response(
        JSON.stringify({ 
          success: true,
          tableName,
          columns: columnsResult.rows,
          foreign_keys: fkResult.rows,
          constraints: constraintsResult.rows,
          indexes: indexResult.rows,
          count: columnsResult.rows.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } finally {
      connection.release()
    }

  } catch (error: unknown) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
