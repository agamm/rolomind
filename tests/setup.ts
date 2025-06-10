import { beforeEach, afterEach, vi } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import * as schema from '@/db/schema'

// Mock environment variables
vi.mock('@/lib/env', () => ({
  env: {
    DATABASE_URL: 'file:./test.db',
    DATABASE_AUTH_TOKEN: undefined,
    OPENROUTER_API_KEY: 'test-api-key'
  }
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}))

// Global test database instance
let testDb: ReturnType<typeof drizzle>

beforeEach(async () => {
  // Create in-memory SQLite for tests
  const client = createClient({
    url: ':memory:'
  })
  
  testDb = drizzle(client, { schema })
  
  // Run migrations
  await migrate(testDb, {
    migrationsFolder: './migrations'
  })
  
  // Make test database available globally
  global.testDb = testDb
})

afterEach(async () => {
  // Clean up database
  if (testDb) {
    await testDb.delete(schema.contacts).execute()
  }
  
  // Clear all mocks
  vi.clearAllMocks()
})

// Make fetch available in tests
global.fetch = vi.fn()

// Mock FormData and File for Node.js environment
if (typeof FormData === 'undefined') {
  global.FormData = class FormData {
    private data = new Map()
    
    append(key: string, value: any) {
      this.data.set(key, value)
    }
    
    get(key: string) {
      return this.data.get(key)
    }
  } as any
}

if (typeof File === 'undefined') {
  global.File = class File {
    constructor(
      private parts: any[],
      public name: string,
      private options: { type?: string } = {}
    ) {}
    
    get type() {
      return this.options.type || ''
    }
    
    async text() {
      return this.parts.join('')
    }
  } as any
}

// Suppress console errors in tests unless explicitly needed
const originalError = console.error
beforeEach(() => {
  console.error = vi.fn()
})

afterEach(() => {
  console.error = originalError
})