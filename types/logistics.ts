// types/logistics.ts
export interface Hub {
  id: string;
  name: string;
  lat: number;
  lng: number;
  coords: [number, number];
}

export interface AiAnalyticsResult {
  distanceKm: number;
  estimatedHours: number;
  fuelCostRub: number;
  riskFactor: 'Низкий' | 'Средний' | 'Высокий';
  recommendedSpeedKmH: number;
}

export interface ActiveShipment {
  id: string;
  fromName: string;
  toName: string;
  isPriority: boolean;
  statusText: string;
  progress: number;
  routeCoords: [number, number][]; // Координаты пути
  currentPos: [number, number];   // Текущая точка на карте
}