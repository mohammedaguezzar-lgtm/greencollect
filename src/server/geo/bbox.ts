export const MOROCCO_BBOX = {
  minLat: 27.0,
  maxLat: 36.0,
  minLng: -13.5,
  maxLng: -0.5,
};

export function isInsideMorocco(lat: number, lng: number): boolean {
  return (
    lat >= MOROCCO_BBOX.minLat &&
    lat <= MOROCCO_BBOX.maxLat &&
    lng >= MOROCCO_BBOX.minLng &&
    lng <= MOROCCO_BBOX.maxLng
  );
}
