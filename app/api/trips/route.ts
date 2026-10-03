import { env } from 'cloudflare:workers';
import { ensureFleetSchema } from '@/lib/fleet-store';
import { mergeProviderVehicles } from '@/lib/live-vehicles';
import { fetchCartrackVehicles, fetchCmsv6Vehicles } from '@/lib/providers';

export const dynamic = 'force-dynamic';

interface TripRow {
  id: string; vehicleId: string; registration: string; state: string; scheduledStartAt: number | null;
  actualStartAt: number | null; arrivedDestinationAt: number | null; completedAt: number | null; createdAt: number;
  startName: string; startLat: number; startLng: number; startRadius: number;
  destinationName: string; destinationLat: number; destinationLng: number; destinationRadius: number;
  returnName: string | null; returnLat: number | null; returnLng: number | null; returnRadius: number | null;
}

const distanceMeters = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const rad = Math.PI / 180; const dLat = (bLat - aLat) * rad; const dLng = (bLng - aLng) * rad;
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

async function tripRows() {
  const result = await env.DB.prepare(`SELECT t.id, t.vehicle_id AS vehicleId, v.registration, t.state, t.scheduled_start_at AS scheduledStartAt, t.actual_start_at AS actualStartAt, t.arrived_destination_at AS arrivedDestinationAt, t.completed_at AS completedAt, t.created_at AS createdAt, s.name AS startName, s.latitude AS startLat, s.longitude AS startLng, s.geofence_radius_meters AS startRadius, d.name AS destinationName, d.latitude AS destinationLat, d.longitude AS destinationLng, d.geofence_radius_meters AS destinationRadius, r.name AS returnName, r.latitude AS returnLat, r.longitude AS returnLng, r.geofence_radius_meters AS returnRadius FROM trips t JOIN vehicles v ON v.id=t.vehicle_id JOIN saved_locations s ON s.id=t.start_location_id JOIN saved_locations d ON d.id=t.destination_location_id LEFT JOIN saved_locations r ON r.id=t.return_location_id ORDER BY t.created_at ASC`).all<TripRow>();
  return result.results;
}

export async function GET() {
  await ensureFleetSchema();
  const [cmsv6, cartrack] = await Promise.all([fetchCmsv6Vehicles(), fetchCartrackVehicles()]);
  const live = mergeProviderVehicles([...cmsv6.vehicles, ...cartrack.vehicles]);
  const liveById = new Map(live.map((vehicle) => [vehicle.id, vehicle]));
  const rows = await tripRows(); const timestamp = Date.now();
  const activeByVehicle = new Map<string, string>();
  for (const trip of rows) if (!['completed', 'cancelled'].includes(trip.state) && !activeByVehicle.has(trip.vehicleId)) activeByVehicle.set(trip.vehicleId, trip.id);
  for (const trip of rows) {
    const vehicle = liveById.get(trip.vehicleId); if (!vehicle || trip.state === 'completed' || trip.state === 'cancelled') continue;
    Object.assign(trip, { current: vehicle });
    if (activeByVehicle.get(trip.vehicleId) !== trip.id) continue;
    const nextTrip = rows.find((candidate) => candidate.vehicleId === trip.vehicleId && candidate.id !== trip.id && !['completed', 'cancelled'].includes(candidate.state));
    const toStart = distanceMeters(vehicle.latitude, vehicle.longitude, trip.startLat, trip.startLng);
    const toDestination = distanceMeters(vehicle.latitude, vehicle.longitude, trip.destinationLat, trip.destinationLng);
    const returnLat = nextTrip?.startLat ?? trip.returnLat ?? trip.startLat; const returnLng = nextTrip?.startLng ?? trip.returnLng ?? trip.startLng; const returnRadius = nextTrip?.startRadius ?? trip.returnRadius ?? trip.startRadius;
    const toReturn = distanceMeters(vehicle.latitude, vehicle.longitude, returnLat, returnLng);
    let state = trip.state; let actualStartAt = trip.actualStartAt; let arrivedDestinationAt = trip.arrivedDestinationAt; let completedAt = trip.completedAt;
    if (['assigned', 'to_start'].includes(state)) state = toStart <= trip.startRadius ? 'at_start' : 'to_start';
    else if (state === 'at_start' && toStart > trip.startRadius) { state = 'outbound'; actualStartAt ??= timestamp; }
    else if (state === 'outbound' && toDestination <= trip.destinationRadius) { state = 'at_destination'; arrivedDestinationAt ??= timestamp; }
    else if (state === 'at_destination' && toDestination > trip.destinationRadius) state = nextTrip ? 'to_next_start' : 'returning';
    else if (['returning', 'to_next_start'].includes(state) && toReturn <= returnRadius) { state = 'completed'; completedAt ??= timestamp; if (nextTrip) { nextTrip.state = 'at_start'; await env.DB.prepare(`UPDATE trips SET state='at_start', updated_at=? WHERE id=?`).bind(timestamp, nextTrip.id).run(); } }
    if (state !== trip.state || actualStartAt !== trip.actualStartAt || arrivedDestinationAt !== trip.arrivedDestinationAt || completedAt !== trip.completedAt) await env.DB.prepare(`UPDATE trips SET state=?, actual_start_at=?, arrived_destination_at=?, completed_at=?, updated_at=? WHERE id=?`).bind(state, actualStartAt, arrivedDestinationAt, completedAt, timestamp, trip.id).run();
    Object.assign(trip, { state, actualStartAt, arrivedDestinationAt, completedAt, current: vehicle, distanceToStartMeters: Math.round(toStart), distanceToDestinationMeters: Math.round(toDestination), distanceToReturnMeters: Math.round(toReturn), nextStartName: nextTrip?.startName ?? null });
  }
  return Response.json({ trips: rows.reverse() });
}

export async function POST(request: Request) {
  await ensureFleetSchema();
  const body = await request.json() as { vehicleId?: string; registration?: string; scheduledStartAt?: string; start?: { name?: string; latitude?: number; longitude?: number; radius?: number }; destination?: { name?: string; latitude?: number; longitude?: number; radius?: number }; returnLocation?: { name?: string; latitude?: number; longitude?: number; radius?: number } };
  if (!body.vehicleId || !body.registration || !body.start?.name || !body.destination?.name || !Number.isFinite(body.start.latitude) || !Number.isFinite(body.start.longitude) || !Number.isFinite(body.destination.latitude) || !Number.isFinite(body.destination.longitude)) return Response.json({ error: 'Vehicle, start point, and destination are required' }, { status: 400 });
  const timestamp = Date.now(); const tripId = crypto.randomUUID(); const startId = crypto.randomUUID(); const destinationId = crypto.randomUUID(); const returnId = crypto.randomUUID(); const returnLocation = body.returnLocation?.name ? body.returnLocation : body.start;
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO vehicles(id, registration, normalized_registration, status, created_at, updated_at) VALUES (?, ?, ?, 'assigned', ?, ?) ON CONFLICT(id) DO UPDATE SET registration=excluded.registration, status='assigned', updated_at=excluded.updated_at`).bind(body.vehicleId, body.registration, body.vehicleId, timestamp, timestamp),
    env.DB.prepare(`INSERT INTO saved_locations(id, name, kind, latitude, longitude, geofence_radius_meters, active, created_at) VALUES (?, ?, 'start', ?, ?, ?, 1, ?)`).bind(startId, body.start.name.trim(), body.start.latitude, body.start.longitude, body.start.radius ?? 200, timestamp),
    env.DB.prepare(`INSERT INTO saved_locations(id, name, kind, latitude, longitude, geofence_radius_meters, active, created_at) VALUES (?, ?, 'destination', ?, ?, ?, 1, ?)`).bind(destinationId, body.destination.name.trim(), body.destination.latitude, body.destination.longitude, body.destination.radius ?? 200, timestamp),
    env.DB.prepare(`INSERT INTO saved_locations(id, name, kind, latitude, longitude, geofence_radius_meters, active, created_at) VALUES (?, ?, 'base', ?, ?, ?, 1, ?)`).bind(returnId, returnLocation.name!.trim(), returnLocation.latitude, returnLocation.longitude, returnLocation.radius ?? 200, timestamp),
    env.DB.prepare(`INSERT INTO trips(id, vehicle_id, start_location_id, destination_location_id, return_location_id, state, scheduled_start_at, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'assigned', ?, 'local-operator', ?, ?)`).bind(tripId, body.vehicleId, startId, destinationId, returnId, body.scheduledStartAt ? new Date(body.scheduledStartAt).getTime() : null, timestamp, timestamp),
  ]);
  return Response.json({ id: tripId }, { status: 201 });
}
