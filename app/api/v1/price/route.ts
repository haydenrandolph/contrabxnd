import { authenticateApiKey, apiResponse } from '@/lib/api-auth';
import { getBitcoinPrice } from '@/lib/price';

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth.ok) return auth.response;

  const result = await getBitcoinPrice();
  if (!result) return new Response(JSON.stringify({ error: 'Price data unavailable' }), { status: 502 });

  return apiResponse(
    {
      price: result.data.price,
      change24h: result.data.change24h,
      marketCap: result.data.marketCap,
      volume24h: result.data.volume24h,
    },
    auth,
    result.cached,
  );
}
