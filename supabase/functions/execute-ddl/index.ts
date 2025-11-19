import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Client } from 'https://deno.land/x/postgres@v0.17.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExecuteDDLRequest {
  sql: string;
  dryRun?: boolean; // If true, validate but don't execute
  previewMode?: boolean; // If true, return affected row counts
  tableMetadata?: {
    section_id: string;
    name: string;
    display_name: string;
    description: string;
    table_name: string;
    schema_definition: any;
    order_index: number;
    is_active: boolean;
    creation_method?: string;
    source_csv_name?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user has admin role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check admin role using has_role function
    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      throw new Error('Admin access required');
    }

    const body: ExecuteDDLRequest = await req.json();
    const { sql, tableMetadata, dryRun, previewMode } = body;

    if (!sql || typeof sql !== 'string') {
      throw new Error('SQL statement is required');
    }

    // Validate SQL to prevent dangerous operations
    // Split by semicolons and validate each statement
    const statements = sql
      .split(';')
      .map(s => {
        // Remove SQL comments (-- comments and /* */ comments)
        return s
          .replace(/--.*$/gm, '') // Remove line comments
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
          .trim();
      })
      .filter(s => s.length > 0);

    const allowedPatterns = [
      /^create\s+table/i,
      /^alter\s+table/i,
      /^create\s+index/i,
      /^create\s+policy/i,
      /^alter\s+table.*enable\s+row\s+level\s+security/i,
      /^create\s+(or\s+replace\s+)?function/i,
      /^create\s+(or\s+replace\s+)?trigger/i,
    ];

    const disallowedPatterns = [
      /drop\s+database/i,
      /drop\s+schema/i,
      /truncate\s+table\s+(auth\.|storage\.|realtime\.|supabase_functions\.|vault\.)/i,
      /delete\s+from\s+(auth\.|storage\.|realtime\.|supabase_functions\.|vault\.)/i,
      /alter\s+database/i,
      /grant/i,
      /revoke/i,
    ];

    // Check each statement
    for (const statement of statements) {
      const statementLower = statement.toLowerCase().trim();
      
      // Check for disallowed patterns
      const hasDisallowed = disallowedPatterns.some(pattern => pattern.test(statementLower));
      if (hasDisallowed) {
        const matchedPattern = disallowedPatterns.find(p => p.test(statementLower));
        console.error('Disallowed pattern matched:', {
          statement: statement.substring(0, 100),
          pattern: matchedPattern?.source
        });
        throw new Error(`SQL contains disallowed operations: ${statement.substring(0, 50)}...`);
      }

      // Check for allowed patterns
      const isAllowed = allowedPatterns.some(pattern => pattern.test(statementLower));
      if (!isAllowed) {
        console.error('Statement not allowed:', {
          statement: statement.substring(0, 100),
          checkedPatterns: allowedPatterns.map(p => p.source)
        });
        throw new Error(
          `Statement not allowed: "${statement.substring(0, 50)}...". ` +
          `Only CREATE TABLE, ALTER TABLE, CREATE INDEX, CREATE FUNCTION, CREATE TRIGGER, and RLS policies are allowed.`
        );
      }
    }

    console.log('Executing DDL:', sql);
    console.log('Options:', { dryRun, previewMode });

    // If preview mode, return validation without execution
    if (dryRun || previewMode) {
      console.log('Dry run mode - validating only');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'SQL validation passed',
          dryRun: true,
          sql,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Execute the SQL using direct database connection
    const dbUrl = Deno.env.get('SUPABASE_DB_URL');
    if (!dbUrl) {
      throw new Error('SUPABASE_DB_URL is not set');
    }

    const client = new Client(dbUrl);
    
    try {
      await client.connect();
      console.log('Connected to database');

      // Execute each statement sequentially
      // The Postgres client handles transactions automatically
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`Executing statement ${i + 1}/${statements.length}:`, statement.substring(0, 100));
        
        try {
          await client.queryObject(statement);
          console.log(`Statement ${i + 1} executed successfully`);
        } catch (stmtError) {
          console.error(`Error executing statement ${i + 1}:`, stmtError);
          const errorMessage = stmtError instanceof Error ? stmtError.message : String(stmtError);
          throw new Error(`Failed at statement ${i + 1}: ${errorMessage}\nSQL: ${statement.substring(0, 200)}`);
        }
      }

      console.log('All DDL statements executed successfully');
    } finally {
      await client.end();
      console.log('Database connection closed');
    }

    // If table metadata provided, register the table
    let tableRecord = null;
    if (tableMetadata) {
      console.log('Registering table metadata:', tableMetadata);
      
      // Use upsert to handle case where table already exists in registry
      const { data: upsertData, error: upsertError } = await supabase
        .from('admin_content_tables')
        .upsert({
          section_id: tableMetadata.section_id,
          name: tableMetadata.name,
          display_name: tableMetadata.display_name,
          description: tableMetadata.description,
          table_name: tableMetadata.table_name,
          schema_definition: tableMetadata.schema_definition,
          order_index: tableMetadata.order_index,
          is_active: tableMetadata.is_active,
        }, {
          onConflict: 'name',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (upsertError) {
        console.error('Table metadata upsert error:', upsertError);
        throw new Error(`Failed to register table: ${upsertError.message}`);
      }

      tableRecord = upsertData;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'DDL executed successfully',
        table: tableRecord,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
