import { vi } from 'vitest';

// Mock data for testing
export const mockTableSchema = {
  columns: [
    { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
    { name: 'name', type: 'text', nullable: false, default: null },
    { name: 'age', type: 'integer', nullable: true, default: null },
    { name: 'tags', type: 'text[]', nullable: true, default: null },
    { name: 'created_at', type: 'timestamp with time zone', nullable: false, default: 'now()' },
  ],
  foreignKeys: [],
  constraints: [
    { name: 'test_table_pkey', type: 'PRIMARY KEY', columns: ['id'] },
  ],
};

export const mockReverseForeignKeys = {
  data: [
    {
      table_name: 'related_table',
      constraint_name: 'related_table_test_id_fkey',
      column_name: 'test_id',
    },
  ],
};

export const mockRowCount = { count: 150000 };

export const mockNullCount = { count: 5 };

// Create mock Supabase client
export const createMockSupabaseClient = () => {
  const mockFrom = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      is: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: mockNullCount, error: null })),
      })),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    count: vi.fn(() => Promise.resolve({ count: mockRowCount.count, error: null })),
  }));

  const mockRpc = vi.fn((functionName: string, params?: any) => {
    if (functionName === 'introspect_schema') {
      return Promise.resolve({ data: mockTableSchema, error: null });
    }
    if (functionName === 'get_reverse_foreign_keys') {
      return Promise.resolve(mockReverseForeignKeys);
    }
    if (functionName === 'execute_ddl') {
      return Promise.resolve({ data: { success: true }, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  });

  return {
    from: mockFrom,
    rpc: mockRpc,
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null })),
    },
  };
};

// Mock functions module
export const mockFunctions = {
  invoke: vi.fn((functionName: string, options?: any) => {
    if (functionName === 'introspect-schema') {
      return Promise.resolve({ data: mockTableSchema, error: null });
    }
    if (functionName === 'execute-ddl') {
      return Promise.resolve({ data: { success: true, registeredTable: null }, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  }),
};
