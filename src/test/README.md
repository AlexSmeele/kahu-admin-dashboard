# Testing Framework

This project uses **Vitest** as the testing framework for unit and integration tests.

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with UI (visual test runner)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

- **`src/test/setup.ts`** - Global test setup and configuration
- **`src/test/mocks/`** - Mock implementations for Supabase and other dependencies
- **`src/test/validation.test.ts`** - Unit tests for schema migration validation logic
- **`src/components/**/__tests__/`** - Component-specific test files

## Writing Tests

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Testing with Mocks

```typescript
import { createMockSupabaseClient } from '@/test/mocks/supabase';

describe('Database Operations', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  it('should query database', async () => {
    const result = await mockSupabase.from('table').select();
    expect(result.data).toBeDefined();
  });
});
```

## Test Coverage

Current test coverage focuses on:

- ✅ Type conversion validation (text to number, array to scalar, etc.)
- ✅ Foreign key impact detection
- ✅ NOT NULL constraint validation
- ✅ Large table impact estimation
- ✅ SQL generation for migrations
- ✅ Migration impact categorization (safe, warnings, blockers)
- ✅ Edge cases (empty tables, NULL data, mixed data)

## Configuration

Test configuration is in `vitest.config.ts`:

- **Environment**: jsdom (browser-like environment)
- **Coverage**: v8 provider with HTML/JSON/text reports
- **Globals**: Enabled (no need to import `describe`, `it`, `expect`)
- **Path aliases**: `@/` resolves to `src/`

## Mocking Strategy

The test suite uses mock implementations that simulate Supabase client behavior without requiring actual database connections. This allows fast, reliable tests that don't depend on external services.

### Available Mocks

- **`createMockSupabaseClient()`** - Mock Supabase client with `.from()`, `.rpc()`, `.auth` methods
- **`mockTableSchema`** - Sample table schema data
- **`mockReverseForeignKeys`** - Sample foreign key relationship data
- **`mockRowCount`** - Sample row count data
- **`mockNullCount`** - Sample NULL value count data

## CI/CD Integration

To add tests to CI/CD pipeline, add these scripts to your workflow:

```yaml
- name: Run tests
  run: npm run test

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Best Practices

1. **Test behavior, not implementation** - Focus on what the code does, not how it does it
2. **Use descriptive test names** - Clearly describe what is being tested and expected outcome
3. **Arrange-Act-Assert** - Structure tests with setup, execution, and verification
4. **Mock external dependencies** - Isolate unit tests from external services
5. **Test edge cases** - Include tests for NULL, empty, and boundary conditions
6. **Keep tests fast** - Unit tests should complete in milliseconds
7. **Avoid test interdependence** - Each test should be independent and isolated
