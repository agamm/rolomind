import { createJsonStream } from '@/lib/stream-utils';

export const maxDuration = 30;

export async function POST() {
  return createJsonStream(async function* () {
    const numbers = Array.from({ length: 10 }, (_, i) => i + 1);
    
    for (const number of numbers) {
      yield { number };
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  });
}