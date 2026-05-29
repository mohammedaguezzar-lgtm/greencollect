import { isInsideMorocco } from './bbox';

const BASE_URL = process.env.NOMINATIM_BASE_URL ?? 'https://nominatim.openstreetmap.org';
const USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ?? 'GreenCollect/1.0 (contact@greencollect.ma)';

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  displayName: string;
};

export async function geocodeQuery(query: string): Promise<GeocodeResult | null> {
  const url = new URL('/search', BASE_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'ma');

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;

  const first = data[0];
  if (!first) return null;

  const latitude = parseFloat(first.lat);
  const longitude = parseFloat(first.lon);
  if (!isInsideMorocco(latitude, longitude)) return null;

  return {
    latitude,
    longitude,
    displayName: first.display_name,
  };
}
