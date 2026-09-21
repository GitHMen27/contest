'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { HUBS } from '@/constants/hubs';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-900 flex items-center justify-center text-purple-400 animate-pulse font-mono">
      Инициализация карты...
    </div>
  ),
});

export default function Home() {
  const [fromHub, setFromHub] = useState(HUBS[0].id);
  const [toHub, setToHub] = useState(HUBS[3].id);
  const [status, setStatus] = useState<'ready' | 'loading' | 'in_transit' | 'delivered' | 'error'>('ready');
  const [statusText, setStatusText] = useState('Система готова');

  const [activeRoute, setActiveRoute] = useState<[number, number][] | null>(null);
  const [truckPosition, setTruckPosition] = useState<[number, number] | null>(null);
  const [trackNumber, setTrackNumber] = useState<string | null>(null);

  const animFrameRef = useRef<number | null>(null);

  const stopAnimation = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAnimation();
  }, [stopAnimation]);

  const handleStartRoute = async () => {
    if (fromHub === toHub) {
      alert('Выберите разные склады');
      return;
    }

    stopAnimation();
    setStatus('loading');
    setStatusText('Построение маршрута...');

    const startObj = HUBS.find((h) => h.id === fromHub)!;
    const endObj = HUBS.find((h) => h.id === toHub)!;

    const track = `WB-${Math.floor(100000 + Math.random() * 900000)}`;
    setTrackNumber(track);

    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startObj.coords[1]},${startObj.coords[0]};${endObj.coords[1]},${endObj.coords[0]}?overview=full&geometries=geojson`
      );
      const data = await res.json();

      if (!data.routes?.length) {
        setStatus('error');
        setStatusText('Маршрут не найден');
        return;
      }

      const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]]
      );

      setActiveRoute(coords);
      setTruckPosition(coords[0]);
      setStatus('in_transit');
      setStatusText('В пути');

      const duration = 8000;
      let startTime: number | null = null;

      const animate = (time: number) => {
        if (!startTime) startTime = time;
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress < 1) {
          const index = Math.floor(progress * (coords.length - 1));
          setTruckPosition(coords[index]);
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          setTruckPosition(coords[coords.length - 1]);
          setStatus('delivered');
          setStatusText('Доставлен');
          animFrameRef.current = null;
        }
      };

      animFrameRef.current = requestAnimationFrame(animate);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setStatusText('Ошибка сети');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/30">
            WB
          </div>
          <h1 className="font-bold tracking-wide text-base">WB Logistics Tracker</h1>
        </div>
        <div className="bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 text-xs font-mono text-purple-300">
          {trackNumber ? `${trackNumber}: ${statusText}` : statusText}
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        <aside className="w-80 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between z-10">
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-purple-400">Управление</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Откуда</label>
                <select
                  value={fromHub}
                  onChange={(e) => setFromHub(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white"
                >
                  {HUBS.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Куда</label>
                <select
                  value={toHub}
                  onChange={(e) => setToHub(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white"
                >
                  {HUBS.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleStartRoute}
                disabled={status === 'loading'}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium py-2 rounded text-xs transition shadow-lg shadow-purple-600/20"
              >
                {status === 'loading' ? 'Загрузка...' : 'Запустить рейс'}
              </button>
            </div>
          </div>

          {/* Виджет состояния перенесён в нижнюю часть боковой панели */}
          <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl mt-auto">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
              Состояние трекера
            </div>
            
            <div className="flex items-center gap-3 mb-2">
              <span className="relative flex h-3 w-3">
                {status === 'in_transit' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    status === 'in_transit'
                      ? 'bg-emerald-500'
                      : status === 'delivered'
                      ? 'bg-purple-500'
                      : status === 'loading'
                      ? 'bg-amber-500'
                      : status === 'error'
                      ? 'bg-red-500'
                      : 'bg-slate-500'
                  }`}
                ></span>
              </span>
              <span className="font-bold text-sm text-white">{statusText}</span>
            </div>

            {trackNumber ? (
              <div className="text-xs font-mono text-purple-300 bg-slate-900/80 px-2 py-1 rounded border border-purple-500/20 mt-1">
                Трек: {trackNumber}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic mt-1">Ожидание запуска...</div>
            )}
          </div>
        </aside>

        <main className="flex-1 relative">
          <Map activeRoute={activeRoute} truckPosition={truckPosition} trackNumber={trackNumber} />
        </main>
      </div>
    </div>
  );
}