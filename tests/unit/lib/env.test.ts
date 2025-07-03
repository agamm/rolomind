import { describe, it, expect } from 'vitest'

describe('Environment Configuration', () => {
  it('should provide access to POLAR_PRODUCT_ID', async () => {
    const { env } = await import('@/lib/env')
    
    // In test environment, this will be mocked
    expect(env.POLAR_PRODUCT_ID).toBeDefined()
    expect(typeof env.POLAR_PRODUCT_ID).toBe('string')
  })

  it('should provide access to all required Polar configuration', async () => {
    const { env } = await import('@/lib/env')
    
    expect(env.POLAR_ACCESS_TOKEN).toBeDefined()
    expect(env.POLAR_SERVER).toBeDefined()
    expect(env.POLAR_PRODUCT_ID).toBeDefined()
    
    expect(['sandbox', 'production']).toContain(env.POLAR_SERVER)
  })

  it('should provide access to auth configuration', async () => {
    const { env } = await import('@/lib/env')
    
    expect(env.BETTER_AUTH_URL).toBeDefined()
    expect(env.BETTER_AUTH_SECRET).toBeDefined()
    expect(env.DATABASE_URL).toBeDefined()
  })
})