/**
 * A simple semaphore implementation for limiting concurrent operations
 */
export class Semaphore {
  private permits: number
  private queue: Array<() => void> = []

  constructor(permits: number) {
    this.permits = permits
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--
      return Promise.resolve()
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve)
    })
  }

  release(): void {
    this.permits++
    
    if (this.queue.length > 0 && this.permits > 0) {
      this.permits--
      const resolve = this.queue.shift()!
      resolve()
    }
  }

  async withLock<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire()
    try {
      return await fn()
    } finally {
      this.release()
    }
  }
}

/**
 * Process items in batches with controlled concurrency
 */
export async function processBatchesWithSemaphore<T, R>(
  items: T[],
  batchSize: number,
  maxConcurrent: number,
  processFn: (item: T, index: number) => Promise<R>,
  onProgress?: (completed: number, total: number) => void
): Promise<(R | null)[]> {
  const semaphore = new Semaphore(maxConcurrent)
  const results: (R | null)[] = new Array(items.length).fill(null)
  let completed = 0
  
  // Process in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, Math.min(i + batchSize, items.length))
    
    // Process batch items with semaphore control
    const batchPromises = batch.map(async (item, batchIndex) => {
      const globalIndex = i + batchIndex
      return semaphore.withLock(async () => {
        try {
          const result = await processFn(item, globalIndex)
          completed++
          onProgress?.(completed, items.length)
          return { success: true, result, index: globalIndex }
        } catch (error) {
          completed++
          onProgress?.(completed, items.length)
          return { success: false, error, index: globalIndex }
        }
      })
    })
    
    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises)
    
    // Collect results in order
    for (const res of batchResults) {
      if (res.success && res.result !== undefined) {
        results[res.index] = res.result
      }
    }
    
    // Small delay between batches to avoid rate limits
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  return results
}