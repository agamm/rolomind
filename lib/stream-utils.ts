export function createJsonStream(generator: () => AsyncGenerator<unknown>) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const data of generator()) {
          const chunk = JSON.stringify(data) + '\n'
          controller.enqueue(encoder.encode(chunk))
        }
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
    },
  })
}

export async function* readJsonStream(response: Response) {
  if (!response.body) {
    throw new Error('No response body')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        if (buffer.trim()) {
          try {
            yield JSON.parse(buffer.trim())
          } catch (error) {
            console.warn('Failed to parse final buffer:', buffer)
          }
        }
        break
      }
      
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            yield JSON.parse(line)
          } catch (error) {
            console.warn('Failed to parse line:', line)
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}