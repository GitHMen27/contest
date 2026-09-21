export interface Hub {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface RouteRisk {
  type: 'weather' | 'traffic' | 'roadwork' | 'clear';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export interface AiAnalyticsResult {
  riskScore: number;          // Процент риска (0 - 100%)
  estimatedHours: number;     // Время в пути
  fuelConsumptionLitres: number; // Расход топлива в литрах
  co2EmissionsKg: number;     // Выбросы CO2 в кг
  recommendation: string;    // Текстовая рекомендация AI
  activeRisks: RouteRisk[];   // Список предупреждений
}

export interface ActiveShipment {
  id: string;
  fromHub: Hub;
  toHub: Hub;
  status: 'idle' | 'in_transit' | 'delivered';
  analytics?: AiAnalyticsResult;
}