import { resolveLocation, type LocationObservation, type Provider } from '@/domain/location-resolution';

export interface ProviderVehicle {
  provider: Provider;
  providerId: string;
  registration: string;
  chassisNumber?: string;
  latitude: number;
  longitude: number;
  gpsRecordedAt: Date;
  speedKph?: number;
  heading?: number;
  ignition?: boolean;
  online: boolean;
  positioningStatus: 'targeted' | 'untargeted' | 'unknown';
  address?: string;
}

export interface LiveVehicle {
  id: string;
  registration: string;
  latitude: number;
  longitude: number;
  gpsRecordedAt: string;
  speedKph: number | null;
  heading: number | null;
  ignition: boolean | null;
  online: boolean;
  address: string | null;
  selectedProvider: Provider;
  sources: Provider[];
  verification: 'verified' | 'single_source' | 'fallback' | 'conflict' | 'stale';
  positioningStatus: 'targeted' | 'unknown';
  sourceDistanceMeters: number | null;
}

export const normalizeRegistration = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '');

export function mergeProviderVehicles(rows: ProviderVehicle[], now = new Date()): LiveVehicle[] {
  const grouped = new Map<string, ProviderVehicle[]>();
  for (const row of rows) {
    const key = normalizeRegistration(row.registration) || `${row.provider}:${row.providerId}`;
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }

  return [...grouped.entries()].flatMap(([id, records]) => {
    const observations: LocationObservation[] = records.map((row) => ({
      provider: row.provider,
      latitude: row.latitude,
      longitude: row.longitude,
      gpsRecordedAt: row.gpsRecordedAt,
      positioningStatus: row.positioningStatus,
    }));
    const resolved = resolveLocation(observations, now);
    if (!resolved.selected || resolved.verification === 'unavailable') return [];
    const selectedRecord = records.find((row) => row.provider === resolved.selected?.provider) ?? records[0];
    return [{
      id,
      registration: records.find((row) => row.provider === 'cmsv6')?.registration ?? selectedRecord.registration,
      latitude: resolved.selected.latitude,
      longitude: resolved.selected.longitude,
      gpsRecordedAt: resolved.selected.gpsRecordedAt.toISOString(),
      speedKph: selectedRecord.speedKph ?? null,
      heading: selectedRecord.heading ?? null,
      ignition: selectedRecord.ignition ?? null,
      online: selectedRecord.online,
      address: selectedRecord.address ?? null,
      selectedProvider: resolved.selected.provider,
      sources: [...new Set(records.map((row) => row.provider))],
      verification: resolved.verification,
      positioningStatus: resolved.selected.positioningStatus === 'targeted' ? 'targeted' : 'unknown',
      sourceDistanceMeters: resolved.distanceBetweenSourcesMeters,
    } satisfies LiveVehicle];
  }).sort((a, b) => a.registration.localeCompare(b.registration));
}
