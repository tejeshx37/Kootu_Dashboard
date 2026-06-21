type GeocodeResult = { lat: number; lng: number; formatted: string };

const cache = new Map<string, GeocodeResult | null>();

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  const q = query.trim();
  if (!q) return null;
  if (cache.has(q)) return cache.get(q) ?? null;

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', q);
    url.searchParams.set('region', 'in');
    url.searchParams.set('key', apiKey);
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) {
      cache.set(q, null);
      return null;
    }
    const data: any = await res.json();
    if (data.status !== 'OK' || !data.results?.length) {
      cache.set(q, null);
      return null;
    }
    const top = data.results[0];
    const loc = top.geometry?.location;
    if (typeof loc?.lat !== 'number' || typeof loc?.lng !== 'number') {
      cache.set(q, null);
      return null;
    }
    const result: GeocodeResult = {
      lat: loc.lat,
      lng: loc.lng,
      formatted: top.formatted_address || q,
    };
    cache.set(q, result);
    return result;
  } catch (err) {
    console.error('[geocode] failed', err);
    cache.set(q, null);
    return null;
  }
}
