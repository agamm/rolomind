export const maxDuration = 30;

export async function POST() {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Generate numbers 1-10 with delay to simulate streaming
      const numbers = Array.from({ length: 10 }, (_, i) => i + 1);
      
      let index = 0;
      
      const sendNext = () => {
        if (index < numbers.length) {
          const chunk = JSON.stringify({ number: numbers[index] }) + '\n';
          controller.enqueue(encoder.encode(chunk));
          index++;
          setTimeout(sendNext, 200); // 200ms delay between numbers
        } else {
          controller.close();
        }
      };
      
      sendNext();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
    },
  });
}