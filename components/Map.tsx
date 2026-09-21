"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { HUBS } from "@/constants/hubs";

interface MapProps {
  activeRoute: [number, number][] | null;
  truckPosition: [number, number] | null;
  trackNumber: string | null;
}

export default function Map({
  activeRoute,
  truckPosition,
  trackNumber,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const truckMarkerRef = useRef<L.Marker | null>(null);

  // 1. Единоразовая инициализация карты
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Настройка стандартных иконок
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
      ._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    // Создаем экземпляр карты
    const map = L.map(mapContainerRef.current).setView(
      [55.751244, 37.618423],
      5,
    );

    L.tileLayer(
      "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
        maxZoom: 19,
      },
    ).addTo(map);

    // Добавляем маркеры складов
    HUBS.forEach((hub) => {
      L.marker(hub.coords)
        .addTo(map)
        .bindPopup(
          `<div style="color: #0f172a; font-family: sans-serif;"><strong>${hub.name}</strong><br/>Сортировочный центр WB</div>`,
        );
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Прямое обновление маршрутной линии (без перерендера React)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    if (activeRoute && activeRoute.length > 0) {
      const line = L.polyline(activeRoute, {
        color: "#c084fc",
        weight: 4,
        opacity: 0.8,
      }).addTo(map);

      routeLineRef.current = line;
      map.fitBounds(line.getBounds(), { padding: [50, 50] });
    }
  }, [activeRoute]);

  // 3. Прямая мутация маркера фуры (60 FPS без затрат React reconciliation)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!truckPosition) {
      if (truckMarkerRef.current) {
        map.removeLayer(truckMarkerRef.current);
        truckMarkerRef.current = null;
      }
      return;
    }

    if (!truckMarkerRef.current) {
      const truckIcon = L.icon({
        iconUrl: "https://img.icons8.ru/?size=100&id=BQjcRKZrKIEj&format=png&color=000000",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      truckMarkerRef.current = L.marker(truckPosition, {
        icon: truckIcon,
      }).addTo(map);
    } else {
      truckMarkerRef.current.setLatLng(truckPosition);
    }

    if (trackNumber) {
      truckMarkerRef.current.bindPopup(
        `<div style="color: #0f172a; font-family: sans-serif;">
          <span style="background: #9333ea; color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold;">В ПУТИ</span><br/>
          <strong>Трек: ${trackNumber}</strong>
        </div>`,
      );
    }
  }, [truckPosition, trackNumber]);

  return <div ref={mapContainerRef} className="w-full h-full z-0" />;
}
