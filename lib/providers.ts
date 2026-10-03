import type { ProviderVehicle } from '@/lib/live-vehicles';

export interface ProviderHealth {
  provider: 'cmsv6' | 'cartrack';
  configured: boolean;
  ok: boolean;
  message: string;
  vehicleCount: number;
}

const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};
const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const asString = (value: unknown): string => typeof value === 'string' || typeof value === 'number' ? String(value) : '';
const asNumber = (value: unknown): number | undefined => {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : undefined;
};
const validCoordinate = (lat?: number, lng?: number) => lat !== undefined && lng !== undefined && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
const normalizeIdentifier = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '');

export const hasRealRegistration = (registration: string, deviceId: string) => {
  const plate = normalizeIdentifier(registration);
  const device = normalizeIdentifier(deviceId);
  return plate.length > 0 && plate !== device;
};

function parseCmsTime(value: unknown): Date {
  const raw = asString(value);
  if (!raw) return new Date(0);
  const zoned = /(?:Z|[+-]\d\d:?\d\d)$/.test(raw) ? raw : `${raw.replace(' ', 'T')}+03:00`;
  const date = new Date(zoned);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function endpoint(base: string, action: string, params: Record<string, string | number | undefined>) {
  const url = new URL(action, base.endsWith('/') ? base : `${base}/`);
  for (const [key, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key, String(value));
  return url;
}

async function getJson(url: URL, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function fetchCmsv6Vehicles(): Promise<{ vehicles: ProviderVehicle[]; health: ProviderHealth }> {
  const base = process.env.CMSV6_BASE_URL;
  const account = process.env.CMSV6_USERNAME;
  const password = process.env.CMSV6_PASSWORD;
  if (!base || !account || !password) return { vehicles: [], health: { provider: 'cmsv6', configured: false, ok: false, message: 'Credentials not configured', vehicleCount: 0 } };

  try {
    const login = asRecord(await getJson(endpoint(base, 'StandardApiAction_login.action', { account, password })));
    const session = asString(login.jsession || login.JSESSIONID || login.jsessionid);
    if (!session) throw new Error(`Login rejected${login.result !== undefined ? ` (result ${login.result})` : ''}`);
    const fleet = asRecord(await getJson(endpoint(base, 'StandardApiAction_queryUserVehicle.action', { jsession: session, language: 'en' })));
    const status = asRecord(await getJson(endpoint(base, 'StandardApiAction_getDeviceStatus.action', { jsession: session, toMap: 1, geoaddress: 1, language: 'en' })));

    const byDevice = new Map<string, { registration: string; online: boolean }>();
    for (const item of asArray(fleet.vehicles ?? fleet.vehicle ?? fleet.data ?? fleet.onlines)) {
      const vehicle = asRecord(item);
      const registration = asString(vehicle.nm || vehicle.vehiName || vehicle.name || vehicle.plate || vehicle.id);
      const devices = asArray(vehicle.dl ?? vehicle.dev ?? vehicle.devices ?? vehicle.lstDevice ?? vehicle.device);
      if (devices.length === 0) byDevice.set(asString(vehicle.id), { registration, online: Number(vehicle.ol ?? vehicle.online ?? 0) > 0 });
      for (const rawDevice of devices) {
        const device = asRecord(rawDevice);
        byDevice.set(asString(device.id || device.devIdno || device.devIDNO), { registration, online: Number(vehicle.ol ?? device.ol ?? vehicle.online ?? device.online ?? 0) > 0 });
      }
    }

    const vehicles: ProviderVehicle[] = [];
    for (const item of asArray(status.status ?? status.datas ?? status.data)) {
      const row = asRecord(item);
      const providerId = asString(row.id || row.did || row.devIdno || row.devIDNO || row.vehiIdno);
      const joined = byDevice.get(providerId);
      const rawLat = asNumber(row.lat ?? row.wd ?? row.weiDu ?? row.latitude);
      const rawLng = asNumber(row.lng ?? row.jd ?? row.jingDu ?? row.longitude);
      const lat = rawLat && Math.abs(rawLat) > 90 ? rawLat / 1_000_000 : rawLat ?? asNumber(row.mlat);
      const lng = rawLng && Math.abs(rawLng) > 180 ? rawLng / 1_000_000 : rawLng ?? asNumber(row.mlng);
      if (!joined || !validCoordinate(lat, lng)) continue;
      if (!hasRealRegistration(joined.registration, providerId)) continue;
      const s1 = asNumber(row.s1 ?? row.status1) ?? 0;
      vehicles.push({
        provider: 'cmsv6', providerId, registration: joined.registration, latitude: lat!, longitude: lng!,
        gpsRecordedAt: parseCmsTime(row.gt ?? row.gpsTime), speedKph: (asNumber(row.sp ?? row.spd) ?? 0) / 10,
        heading: asNumber(row.hx ?? row.heading ?? row.direction),
        online: Number(row.ol ?? row.online ?? (joined.online ? 1 : 0)) > 0,
        positioningStatus: (s1 & 1) === 1 ? 'targeted' : 'untargeted', address: asString(row.ps ?? row.address) || undefined,
      });
    }
    return { vehicles, health: { provider: 'cmsv6', configured: true, ok: true, message: 'Connected', vehicleCount: vehicles.length } };
  } catch (error) {
    return { vehicles: [], health: { provider: 'cmsv6', configured: true, ok: false, message: error instanceof Error ? error.message : 'Connection failed', vehicleCount: 0 } };
  }
}

export async function fetchCartrackVehicles(): Promise<{ vehicles: ProviderVehicle[]; health: ProviderHealth }> {
  const base = process.env.CARTRACK_BASE_URL;
  const username = process.env.CARTRACK_USERNAME;
  const apiKey = process.env.CARTRACK_API_KEY;
  if (!base || !username || !apiKey) return { vehicles: [], health: { provider: 'cartrack', configured: false, ok: false, message: 'Restricted credential not configured', vehicleCount: 0 } };

  try {
    const url = endpoint(base, 'vehicles/status', {});
    const auth = btoa(`${username}:${apiKey}`);
    const payload = asRecord(await getJson(url, { headers: { Accept: 'application/json', Authorization: `Basic ${auth}` } }));
    const vehicles: ProviderVehicle[] = asArray(payload.data).flatMap((item) => {
      const row = asRecord(item);
      const location = asRecord(row.location);
      const latitude = asNumber(location.latitude);
      const longitude = asNumber(location.longitude);
      if (!validCoordinate(latitude, longitude)) return [];
      const fix = asNumber(location.gps_fix_type);
      const updated = asString(location.updated || row.event_ts || row.location_updated);
      const date = new Date(updated);
      return [{
        provider: 'cartrack' as const, providerId: asString(row.vehicle_id), registration: asString(row.registration),
        chassisNumber: asString(row.chassis_number) || undefined, latitude: latitude!, longitude: longitude!,
        gpsRecordedAt: Number.isNaN(date.getTime()) ? new Date(0) : date, speedKph: asNumber(row.speed),
        heading: asNumber(row.bearing ?? location.bearing ?? row.heading),
        ignition: typeof row.ignition === 'boolean' ? row.ignition : undefined, online: true,
        positioningStatus: fix === undefined ? 'unknown' as const : fix >= 2 ? 'targeted' as const : 'untargeted' as const,
        address: asString(location.position_description) || undefined,
      }];
    });
    return { vehicles, health: { provider: 'cartrack', configured: true, ok: true, message: 'Connected', vehicleCount: vehicles.length } };
  } catch (error) {
    return { vehicles: [], health: { provider: 'cartrack', configured: true, ok: false, message: error instanceof Error ? error.message : 'Connection failed', vehicleCount: 0 } };
  }
}
