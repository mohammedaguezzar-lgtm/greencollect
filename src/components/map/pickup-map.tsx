'use client';

import dynamic from 'next/dynamic';

export type MapPin = {
  id: string;
  latitude: number;
  longitude: number;
  label?: string;
};

type PickupMapProps = {
  pins: MapPin[];
  center?: { lat: number; lng: number };
  height?: string;
};

function PickupMapInner({ pins, center, height = '320px' }: PickupMapProps) {
  const { MapContainer, TileLayer, Marker, Popup } = require('react-leaflet');
  const L = require('leaflet');
  require('leaflet/dist/leaflet.css');

  const c = center ?? (pins[0]
    ? { lat: pins[0].latitude, lng: pins[0].longitude }
    : { lat: 33.5731, lng: -7.5898 });

  const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  return (
    <div className="rounded-lg overflow-hidden border z-0" style={{ height }}>
      <MapContainer center={[c.lat, c.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pins.map((p, i) => (
          <Marker key={p.id} position={[p.latitude, p.longitude]} icon={icon}>
            <Popup>
              {p.label ?? `Stop ${i + 1}`}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <p className="text-xs text-gray-500 mt-1">© OpenStreetMap contributors</p>
    </div>
  );
}

export const PickupMap = dynamic(() => Promise.resolve(PickupMapInner), { ssr: false });
