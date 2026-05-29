'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const CASABLANCA = { lat: 33.5731, lng: -7.5898 };

type MapPickerProps = {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
  height?: string;
};

function MapPickerInner({
  latitude,
  longitude,
  onChange,
  height = '280px',
}: MapPickerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    void import('leaflet/dist/leaflet.css');
  }, [mounted]);

  if (!mounted) {
    return (
      <div
        className="bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-500"
        style={{ height }}
      >
        Chargement carte…
      </div>
    );
  }

  return (
    <DynamicMap
      latitude={latitude}
      longitude={longitude}
      onChange={onChange}
      height={height}
    />
  );
}

function DynamicMap({
  latitude,
  longitude,
  onChange,
  height,
}: MapPickerProps) {
  const { MapContainer, TileLayer, Marker, useMapEvents } = require('react-leaflet');
  const L = require('leaflet');

  const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  function ClickHandler() {
    useMapEvents({
      click(e: { latlng: { lat: number; lng: number } }) {
        onChange(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  return (
    <div className="rounded-lg overflow-hidden border z-0" style={{ height }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler />
        <Marker
          position={[latitude, longitude]}
          icon={icon}
          draggable
          eventHandlers={{
            dragend: (e: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
              const pos = e.target.getLatLng();
              onChange(pos.lat, pos.lng);
            },
          }}
        />
      </MapContainer>
    </div>
  );
}

const MapPicker = dynamic(() => Promise.resolve(MapPickerInner), { ssr: false });

export { MapPicker, CASABLANCA };
