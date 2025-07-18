import { beforeEach, afterEach, vi, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Mock environment variables
vi.mock('@/lib/env', () => ({
  env: {
    DATABASE_URL: 'file:./test.db',
    DATABASE_AUTH_TOKEN: undefined,
    BETTER_AUTH_URL: 'http://localhost:3000',
    BETTER_AUTH_SECRET: '12345678901234567890123456789012',
    POLAR_ACCESS_TOKEN: 'test-polar-token',
    POLAR_SERVER: 'sandbox' as const,
    POLAR_PRODUCT_ID: 'test-product-id-12345'
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

// Mock Dexie for tests
vi.mock('dexie', () => {
  const mockDb = {
    contacts: {
      toArray: vi.fn().mockResolvedValue([]),
      get: vi.fn().mockResolvedValue(undefined),
      add: vi.fn().mockResolvedValue('mock-id'),
      bulkAdd: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      bulkPut: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      bulkDelete: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      count: vi.fn().mockResolvedValue(0),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
    }
  }
  
  return {
    default: class Dexie {
      contacts = mockDb.contacts
      version() { return this }
      stores() { return this }
    }
  }
})

// Mock dexie-react-hooks
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn((fn) => {
    // Return undefined on first render, then the result
    return undefined
  })
}))

beforeEach(async () => {
  // Clear all mocks before each test
  vi.clearAllMocks()
})

afterEach(async () => {
  // Clear all mocks after each test
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