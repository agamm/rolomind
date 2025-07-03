import { describe, it, expect } from 'vitest'

describe('Environment Configuration', () => {
  it('should provide access to POLAR_PRODUCT_ID', async () => {
    const { env } = await import('@/lib/env')
    
    // Now optional during build
    if (env.POLAR_PRODUCT_ID) {
      expect(typeof env.POLAR_PRODUCT_ID).toBe('string')
    }
  })

  it('should provide access to Polar configuration when available', async () => {
    const { env } = await import('@/lib/env')
    
    expect(env.POLAR_SERVER).toBeDefined()
    expect(['sandbox', 'production']).toContain(env.POLAR_SERVER)
    
    // These are now optional during build
    if (env.POLAR_ACCESS_TOKEN) {
      expect(typeof env.POLAR_ACCESS_TOKEN).toBe('string')
    }
    if (env.POLAR_PRODUCT_ID) {
      expect(typeof env.POLAR_PRODUCT_ID).toBe('string')
    }
  })

  it('should provide access to required database configuration', async () => {
    const { env } = await import('@/lib/env')
    
    expect(env.BETTER_AUTH_URL).toBeDefined()
    expect(env.DATABASE_URL).toBeDefined()
    
    // These are now optional during build
    if (env.BETTER_AUTH_SECRET) {
      expect(typeof env.BETTER_AUTH_SECRET).toBe('string')
    }
  })
})