import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Map, Layers, Navigation } from 'lucide-react';
import { MissionEvent, getEventTypeColor } from '@/data/missionEvents';
import { flightPath, mapCenter, mapZoom, getDronePosition } from '@/data/flightPath';

interface TacticalMapProps {
  currentTime: number;
  duration: number;
  triggeredEvents: MissionEvent[];
  rescuerPosition: [number, number] | null;
  gpsTrackingEnabled: boolean;
}

export const TacticalMap = ({
  currentTime,
  duration,
  triggeredEvents,
  rescuerPosition,
  gpsTrackingEnabled,
}: TacticalMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const droneMarker = useRef<mapboxgl.Marker | null>(null);
  const rescuerMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const eventMarkersMap = useRef<globalThis.Map<string, mapboxgl.Marker>>(new globalThis.Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [noToken, setNoToken] = useState(false);

  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    if (!mapContainer.current) return;
    
    if (!mapboxToken) {
      setNoToken(true);
      return;
    }

    (mapboxgl as any).accessToken = mapboxToken;

    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: mapCenter,
      zoom: mapZoom,
      pitch: 45,
      bearing: -17.6,
    });

    mapInstance.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    mapInstance.current.on('load', () => {
      setMapLoaded(true);

      // Add flight path line
      mapInstance.current?.addSource('flight-path', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: flightPath,
          },
        },
      });

      mapInstance.current?.addLayer({
        id: 'flight-path-line',
        type: 'line',
        source: 'flight-path',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#00ff88',
          'line-width': 2,
          'line-opacity': 0.6,
          'line-dasharray': [2, 2],
        },
      });

      // Create drone marker
      const droneEl = document.createElement('div');
      droneEl.className = 'drone-marker';
      droneEl.innerHTML = `
        <div style="
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #00ff88 0%, #00d4ff 100%);
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s ease-in-out infinite;
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="3">
            <path d="M12 2L12 22M2 12L22 12M7 7L17 17M17 7L7 17"/>
          </svg>
        </div>
      `;

      droneMarker.current = new mapboxgl.Marker({ element: droneEl })
        .setLngLat(flightPath[0] as [number, number])
        .addTo(mapInstance.current!);
    });

    return () => {
      mapInstance.current?.remove();
    };
  }, [mapboxToken]);

  // Update drone position
  useEffect(() => {
    if (!mapLoaded || !droneMarker.current || duration === 0) return;

    const progress = currentTime / duration;
    const position = getDronePosition(progress);
    droneMarker.current.setLngLat(position);
  }, [currentTime, duration, mapLoaded]);

  // Add event markers to the map
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return;

    triggeredEvents.forEach((event) => {
      if (!eventMarkersMap.current.has(event.id)) {
        const el = document.createElement('div');
        const color = getEventTypeColor(event.type);
        el.innerHTML = `
          <div style="
            width: 20px;
            height: 20px;
            background: ${color};
            border-radius: 50%;
            border: 2px solid #fff;
            box-shadow: 0 0 15px ${color}80;
            cursor: pointer;
          "></div>
        `;

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat(event.coordinates)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div style="color: #000; padding: 4px;">
                <strong>${event.type.toUpperCase()}</strong><br/>
                <span style="font-size: 12px;">${event.message}</span><br/>
                <span style="font-size: 11px; color: #666;">Confidence: ${event.probability}%</span>
              </div>
            `)
          )
          .addTo(mapInstance.current!);

        eventMarkersMap.current.set(event.id, marker);
      }
    });
  }, [triggeredEvents, mapLoaded]);

  // Rescuer position marker
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return;

    if (gpsTrackingEnabled && rescuerPosition) {
      if (!rescuerMarkerRef.current) {
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="
            width: 16px;
            height: 16px;
            background: #ffcc00;
            border-radius: 50%;
            border: 2px solid #fff;
            box-shadow: 0 0 15px #ffcc0080;
          "></div>
        `;

        rescuerMarkerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat(rescuerPosition as [number, number])
          .addTo(mapInstance.current);
      } else {
        rescuerMarkerRef.current.setLngLat(rescuerPosition);
      }
    } else if (rescuerMarkerRef.current) {
      rescuerMarkerRef.current.remove();
      rescuerMarkerRef.current = null;
    }
  }, [gpsTrackingEnabled, rescuerPosition, mapLoaded]);

  if (noToken) {
    return (
      <div className="panel h-full flex flex-col">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-primary" />
            <span className="panel-title">Tactical Map</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-background/50 cyber-grid">
          <div className="text-center p-6 max-w-sm">
            <Map className="w-12 h-12 text-warning mx-auto mb-4" />
            <p className="text-warning mb-2">Mapbox Token Required</p>
            <p className="text-xs text-muted-foreground">
              Set VITE_MAPBOX_ACCESS_TOKEN environment variable to enable tactical map display.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-primary" />
          <span className="panel-title">Tactical Map</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">SAT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Navigation className="w-3 h-3 text-accent" />
            <span className="text-xs text-accent">TRACKING</span>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm border border-border rounded-sm p-3 z-10">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Legend</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#00ff88]" />
              <span className="text-xs">Victim</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff3366]" />
              <span className="text-xs">Hazard</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#00d4ff]" />
              <span className="text-xs">Rescuer</span>
            </div>
            {gpsTrackingEnabled && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ffcc00]" />
                <span className="text-xs">Your Position</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
