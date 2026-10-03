import { env } from 'cloudflare:workers';
import type { LiveVehicle } from '@/lib/live-vehicles';

export interface FleetGroup { id: string; name: string; parentId: string | null; source: 'cmsv6' | 'local' }

const now = () => Date.now();
const groupId = (name: string) => `group-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

export async function ensureFleetSchema() {
  const db = env.DB;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS vehicle_groups (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, parent_id TEXT, source TEXT DEFAULT 'local' NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`),
    db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_groups_name_parent ON vehicle_groups(name, parent_id)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS vehicle_group_assignments (vehicle_id TEXT PRIMARY KEY NOT NULL, group_id TEXT NOT NULL, updated_at INTEGER NOT NULL, FOREIGN KEY(group_id) REFERENCES vehicle_groups(id))`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_group ON vehicle_group_assignments(group_id)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS vehicles (id TEXT PRIMARY KEY NOT NULL, registration TEXT NOT NULL, normalized_registration TEXT NOT NULL, chassis_number TEXT, display_name TEXT, cmsv6_device_id TEXT, cartrack_vehicle_id TEXT, default_location_id TEXT, status TEXT DEFAULT 'available' NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`),
    db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(normalized_registration)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS saved_locations (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, kind TEXT NOT NULL, latitude REAL NOT NULL, longitude REAL NOT NULL, geofence_radius_meters INTEGER DEFAULT 150 NOT NULL, active INTEGER DEFAULT 1 NOT NULL, created_at INTEGER NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS trips (id TEXT PRIMARY KEY NOT NULL, vehicle_id TEXT NOT NULL, start_location_id TEXT NOT NULL, destination_location_id TEXT NOT NULL, return_location_id TEXT, next_trip_id TEXT, state TEXT DEFAULT 'assigned' NOT NULL, scheduled_start_at INTEGER, actual_start_at INTEGER, arrived_destination_at INTEGER, completed_at INTEGER, created_by TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_trips_vehicle_state ON trips(vehicle_id, state)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_trips_schedule ON trips(scheduled_start_at)`),
  ]);
  for (const name of ['Distribution', 'Semi', 'Excavator']) {
    await db.prepare(`INSERT OR IGNORE INTO vehicle_groups (id, name, parent_id, source, created_at, updated_at) VALUES (?, ?, NULL, 'cmsv6', ?, ?)`).bind(groupId(name), name, now(), now()).run();
  }
}

export async function getGroups(): Promise<FleetGroup[]> {
  await ensureFleetSchema();
  const result = await env.DB.prepare(`SELECT id, name, parent_id AS parentId, source FROM vehicle_groups ORDER BY parent_id, name`).all<FleetGroup>();
  return result.results;
}

export async function createGroup(name: string, parentId: string | null) {
  await ensureFleetSchema();
  const clean = name.trim();
  if (!clean) throw new Error('Group name is required');
  const id = `${groupId(clean)}-${crypto.randomUUID().slice(0, 6)}`;
  await env.DB.prepare(`INSERT INTO vehicle_groups (id, name, parent_id, source, created_at, updated_at) VALUES (?, ?, ?, 'local', ?, ?)`).bind(id, clean, parentId, now(), now()).run();
  return id;
}

export async function assignVehicle(vehicleId: string, groupIdValue: string) {
  await ensureFleetSchema();
  await env.DB.prepare(`INSERT INTO vehicle_group_assignments(vehicle_id, group_id, updated_at) VALUES (?, ?, ?) ON CONFLICT(vehicle_id) DO UPDATE SET group_id=excluded.group_id, updated_at=excluded.updated_at`).bind(vehicleId, groupIdValue, now()).run();
}

export async function attachGroups(vehicles: LiveVehicle[]): Promise<LiveVehicle[]> {
  await ensureFleetSchema();
  const db = env.DB;
  const groups = await getGroups();
  const byName = new Map(groups.map((group) => [group.name.toLowerCase(), group]));
  const assigned = await db.prepare(`SELECT vehicle_id AS vehicleId, group_id AS groupId FROM vehicle_group_assignments`).all<{ vehicleId: string; groupId: string }>();
  const assignment = new Map(assigned.results.map((row) => [row.vehicleId, row.groupId]));
  const timestamp = now();
  const writes: D1PreparedStatement[] = [];
  for (const vehicle of vehicles) {
    writes.push(db.prepare(`INSERT INTO vehicles(id, registration, normalized_registration, status, created_at, updated_at) VALUES (?, ?, ?, 'available', ?, ?) ON CONFLICT(id) DO UPDATE SET registration=excluded.registration, normalized_registration=excluded.normalized_registration, updated_at=excluded.updated_at`).bind(vehicle.id, vehicle.registration, vehicle.id, timestamp, timestamp));
    if (!assignment.has(vehicle.id) && vehicle.cmsGroup) {
      const matching = byName.get(vehicle.cmsGroup.toLowerCase());
      if (matching) { writes.push(db.prepare(`INSERT OR IGNORE INTO vehicle_group_assignments(vehicle_id, group_id, updated_at) VALUES (?, ?, ?)`).bind(vehicle.id, matching.id, timestamp)); assignment.set(vehicle.id, matching.id); }
    }
  }
  if (writes.length) await db.batch(writes);
  const groupById = new Map(groups.map((group) => [group.id, group]));
  return vehicles.map((vehicle) => { const id = assignment.get(vehicle.id) ?? null; return { ...vehicle, groupId: id, groupName: id ? groupById.get(id)?.name ?? null : null }; });
}
