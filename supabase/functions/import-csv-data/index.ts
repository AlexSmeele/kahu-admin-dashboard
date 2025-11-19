import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ColumnMapping {
  csvColumn: string;
  targetField: string;
  dataType: string;
  transform?: string;
}

interface ColumnGroup {
  name: string;
  columns: string[];
  targetField: string;
}

interface ImportRequest {
  tableName: string;
  data: Record<string, any>[];
  columnMappings: ColumnMapping[];
  columnGroups: ColumnGroup[];
  conflictStrategy: 'fail' | 'skip' | 'upsert';
  primaryKeys?: string[];
  deleteExisting?: boolean;
}

interface ImportResponse {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: hasRole, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !hasRole) {
      throw new Error('Admin role required');
    }

    const requestData: ImportRequest = await req.json();
    console.log('Import request:', {
      table: requestData.tableName,
      rowCount: requestData.data.length,
      mappingCount: requestData.columnMappings.length,
      groupCount: requestData.columnGroups.length,
      strategy: requestData.conflictStrategy
    });

    const {
      tableName,
      data,
      columnMappings,
      columnGroups,
      conflictStrategy,
      primaryKeys = ['id'],
      deleteExisting = false
    } = requestData;

    // Validate table exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (tableCheckError) {
      throw new Error(`Table validation failed: ${tableCheckError.message}`);
    }

    const result: ImportResponse = {
      success: true,
      imported: 0,
      failed: 0,
      errors: []
    };

    // Transform data rows
    const transformedRows = data.map((row, index) => {
      try {
        const transformedRow: Record<string, any> = {};

        // Process column groups first (for JSONB arrays)
        columnGroups.forEach(group => {
          const values: string[] = [];
          group.columns.forEach(csvCol => {
            const value = row[csvCol];
            if (value !== null && value !== undefined && value !== '') {
              values.push(String(value).trim());
            }
          });
          if (values.length > 0) {
            transformedRow[group.targetField] = values;
          }
        });

        // Process individual column mappings
        columnMappings.forEach(mapping => {
          // Skip if this column is part of a group
          const isInGroup = columnGroups.some(g => g.columns.includes(mapping.csvColumn));
          if (isInGroup) return;

          const value = row[mapping.csvColumn];
          transformedRow[mapping.targetField] = transformValue(value, mapping.dataType);
        });

        return { success: true, data: transformedRow };
      } catch (error: any) {
        return {
          success: false,
          error: `Row ${index + 1}: ${error?.message || 'Unknown error'}`
        };
      }
    });

    // Check for transformation errors
    const transformErrors = transformedRows.filter(r => !r.success);
    if (transformErrors.length > 0) {
      transformErrors.forEach((err, idx) => {
        result.errors.push({ row: idx + 1, error: err.error || 'Unknown error' });
      });
      result.failed = transformErrors.length;
    }

    const validRows = transformedRows
      .filter(r => r.success)
      .map(r => r.data);

    if (validRows.length === 0) {
      return new Response(
        JSON.stringify({
          ...result,
          success: false,
          message: 'No valid rows to import'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete existing records if requested
    if (deleteExisting) {
      console.log(`Deleting existing records from ${tableName}`);
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw new Error(`Failed to delete existing records: ${deleteError.message}`);
      }
    }

    // Import data in batches
    const BATCH_SIZE = 100;
    const batches = [];
    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      batches.push(validRows.slice(i, i + BATCH_SIZE));
    }

    console.log(`Importing ${validRows.length} rows in ${batches.length} batches`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} rows)`);

      try {
        if (conflictStrategy === 'upsert' && primaryKeys.length > 0) {
          const { error: upsertError } = await supabase
            .from(tableName)
            .upsert(batch, {
              onConflict: primaryKeys.join(',')
            });

          if (upsertError) {
            console.error(`Batch ${i + 1} upsert error:`, upsertError);
            batch.forEach((_, idx) => {
              result.errors.push({
                row: i * BATCH_SIZE + idx + 1,
                error: upsertError.message
              });
            });
            result.failed += batch.length;
          } else {
            result.imported += batch.length;
          }
        } else if (conflictStrategy === 'skip') {
          const { error: insertError } = await supabase
        .from(tableName)
        .insert(batch);

          if (insertError) {
            console.error(`Batch ${i + 1} insert error:`, insertError);
            batch.forEach((_, idx) => {
              result.errors.push({
                row: i * BATCH_SIZE + idx + 1,
                error: insertError.message
              });
            });
            result.failed += batch.length;
          } else {
            result.imported += batch.length;
          }
        } else {
          // fail strategy - stop on first error
          const { error: insertError } = await supabase
            .from(tableName)
            .insert(batch);

          if (insertError) {
            console.error(`Batch ${i + 1} insert error:`, insertError);
            throw new Error(`Import failed at batch ${i + 1}: ${insertError.message}`);
          }
          result.imported += batch.length;
        }
      } catch (error: any) {
        console.error(`Batch ${i + 1} error:`, error);
        result.errors.push({
          row: i * BATCH_SIZE + 1,
          error: `Batch error: ${error?.message || 'Unknown error'}`
        });
        result.failed += batch.length;
        
        if (conflictStrategy === 'fail') {
          result.success = false;
          break;
        }
      }
    }

    console.log('Import complete:', result);

    return new Response(
      JSON.stringify({
        ...result,
        message: `Successfully imported ${result.imported} of ${validRows.length} rows`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        imported: 0,
        failed: 0,
        errors: [{ row: 0, error: error?.message || 'Unknown error' }],
        message: error?.message || 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function transformValue(value: any, targetType: string): any {
  if (value === null || value === undefined || value === '') return null;

  const strValue = String(value).trim();

  try {
    switch (targetType.toLowerCase()) {
      case 'integer':
      case 'bigint':
        return strValue === '' ? null : parseInt(strValue, 10);
      
      case 'number':
      case 'numeric':
      case 'decimal':
      case 'real':
      case 'double precision':
        return strValue === '' ? null : parseFloat(strValue);
      
      case 'boolean':
        const lowerValue = strValue.toLowerCase();
        if (['true', 't', 'yes', 'y', '1'].includes(lowerValue)) return true;
        if (['false', 'f', 'no', 'n', '0'].includes(lowerValue)) return false;
        return null;
      
      case 'jsonb':
      case 'json':
        try {
          return JSON.parse(strValue);
        } catch {
          return strValue;
        }
      
      case 'text[]':
      case 'integer[]':
      case 'uuid[]':
        try {
          const parsed = JSON.parse(strValue);
          return Array.isArray(parsed) ? parsed : [strValue];
        } catch {
          return [strValue];
        }
      
      case 'timestamp':
      case 'timestamp with time zone':
      case 'date':
        return strValue === '' ? null : strValue;
      
      case 'uuid':
      case 'text':
      default:
        return strValue;
    }
  } catch (error) {
    console.error(`Transform error for value "${value}" to type "${targetType}":`, error);
    return null;
  }
}
