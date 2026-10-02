export type Provider = 'cmsv6' | 'cartrack';

export interface LocationObservation {
  provider: Provider;
  latitude: number;
  longitude: number;
  gpsRecordedAt: Date;
  positioningStatus?: 'targeted' | 'untargeted' | 'unknown';
}

export interface ResolvedLocation {
  selected: LocationObservation | null;
  verification: 'verified' | 'single_source' | 'fallback' | 'conflict' | 'stale' | 'unavailable';
  distanceBetweenSourcesMeters: number | null;
  evidence: LocationObservation[];
  rejectedEvidence: LocationObservation[];
}

const EARTH_RADIUS_METERS = 6_371_000;

export function distanceMeters(a: LocationObservation, b: LocationObservation): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latDelta = radians(b.latitude - a.latitude);
  const lonDelta = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const h = Math.sin(latDelta / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(lonDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

export function resolveLocation(
  observations: LocationObservation[],
  now = new Date(),
  freshForMs = 2 * 60_000,
  staleAfterMs = 10 * 60_000,
  agreementMeters = 200,
): ResolvedLocation {
  const latest = new Map<Provider, LocationObservation>();
  for (const observation of observations) {
    const current = latest.get(observation.provider);
    if (!current || observation.gpsRecordedAt > current.gpsRecordedAt) latest.set(observation.provider, observation);
  }

  const evidence = [...latest.values()];
  const rejectedEvidence = evidence.filter((item) => item.positioningStatus === 'untargeted');
  const usable = evidence.filter((item) => item.positioningStatus !== 'untargeted');
  if (usable.length === 0) return { selected: null, verification: 'unavailable', distanceBetweenSourcesMeters: null, evidence, rejectedEvidence };

  const age = (item: LocationObservation) => Math.max(0, now.getTime() - item.gpsRecordedAt.getTime());
  const cmsv6 = usable.find((item) => item.provider === 'cmsv6');
  const cartrack = usable.find((item) => item.provider === 'cartrack');

  if (!cmsv6 || !cartrack) {
    const selected = cmsv6 ?? cartrack!;
    const verification = age(selected) > staleAfterMs ? 'stale' : rejectedEvidence.length > 0 ? 'fallback' : 'single_source';
    return { selected, verification, distanceBetweenSourcesMeters: null, evidence, rejectedEvidence };
  }

  const separation = distanceMeters(cmsv6, cartrack);
  const cmsFresh = age(cmsv6) <= freshForMs;
  const carFresh = age(cartrack) <= freshForMs;
  if (cmsFresh && carFresh && separation <= agreementMeters) return { selected: cmsv6, verification: 'verified', distanceBetweenSourcesMeters: separation, evidence, rejectedEvidence };
  if (cmsFresh && carFresh) return { selected: cmsv6, verification: 'conflict', distanceBetweenSourcesMeters: separation, evidence, rejectedEvidence };
  if (cmsFresh) return { selected: cmsv6, verification: 'fallback', distanceBetweenSourcesMeters: separation, evidence, rejectedEvidence };
  if (carFresh) return { selected: cartrack, verification: 'fallback', distanceBetweenSourcesMeters: separation, evidence, rejectedEvidence };

  const selected = cmsv6.gpsRecordedAt >= cartrack.gpsRecordedAt ? cmsv6 : cartrack;
  return { selected, verification: age(selected) > staleAfterMs ? 'stale' : 'fallback', distanceBetweenSourcesMeters: separation, evidence, rejectedEvidence };
}
