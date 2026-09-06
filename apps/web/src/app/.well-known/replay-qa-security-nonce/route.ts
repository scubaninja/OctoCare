const SECURITY_NONCE =
  'loopqa-sec-iPxYBqKMC78MoNfVgklQAqGqLNr1kkC5bWkc5r7VdAI';

export function GET() {
  return new Response(SECURITY_NONCE, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
