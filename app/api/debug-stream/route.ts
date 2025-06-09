import { streamObject } from 'ai';
import { z } from 'zod';
import { createJsonStream } from '@/lib/stream-utils';
import { openrouter } from '@/lib/openrouter-config';

const greetingSchema = z.string().describe('A greeting in a different language');


export async function POST() {
  return createJsonStream(async function* () {
    const result = streamObject({
      model: openrouter('anthropic/claude-3-haiku'),
      output: 'array',
      schema: greetingSchema,
      prompt: 'Generate a 20 different ways to say hello in different languages. Only return the greeting text itself.',
      onFinish: (result) => {
        console.log("Finished", result);
      }
    });

    for await (const greeting of result.elementStream) {
      yield greeting;
      console.log("Greeting", greeting);
    }
  });
}