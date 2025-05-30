import { useState, useCallback } from 'react'
import { readJsonStream } from '@/lib/stream-utils'

interface UseJsonStreamOptions<T> {
  onData?: (data: T) => void
  onError?: (error: Error) => void
  onComplete?: () => void
}

export function useJsonStream<T = unknown>(options: UseJsonStreamOptions<T> = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<T[]>([])

  const start = useCallback(async (url: string, init?: RequestInit) => {
    setIsLoading(true)
    setError(null)
    setData([])

    try {
      const response = await fetch(url, init)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      for await (const item of readJsonStream(response)) {
        const typedItem = item as T
        setData(prev => [...prev, typedItem])
        options.onData?.(typedItem)
      }

      options.onComplete?.()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      options.onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }, [options])

  const reset = useCallback(() => {
    setData([])
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    data,
    isLoading,
    error,
    start,
    reset
  }
}