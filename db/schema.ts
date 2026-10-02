import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const vehicles = sqliteTable('vehicles', {
  id: text('id').primaryKey(),
  registration: text('registration').notNull(),
  normalizedRegistration: text('normalized_registration').notNull(),
  chassisNumber: text('chassis_number'),
  displayName: text('display_name'),
  cmsv6DeviceId: text('cmsv6_device_id'),
  cartrackVehicleId: text('cartrack_vehicle_id'),
  defaultLocationId: text('default_location_id'),
  status: text('status', { enum: ['available', 'assigned', 'in_trip', 'workshop', 'inactive'] }).notNull().default('available'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [
  uniqueIndex('idx_vehicles_registration').on(table.normalizedRegistration),
  uniqueIndex('idx_vehicles_cmsv6_id').on(table.cmsv6DeviceId),
  uniqueIndex('idx_vehicles_cartrack_id').on(table.cartrackVehicleId),
]);

export const savedLocations = sqliteTable('saved_locations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  kind: text('kind', { enum: ['base', 'start', 'destination', 'workshop', 'other'] }).notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  geofenceRadiusMeters: integer('geofence_radius_meters').notNull().default(150),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const trips = sqliteTable('trips', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id),
  startLocationId: text('start_location_id').notNull().references(() => savedLocations.id),
  destinationLocationId: text('destination_location_id').notNull().references(() => savedLocations.id),
  returnLocationId: text('return_location_id').references(() => savedLocations.id),
  nextTripId: text('next_trip_id'),
  state: text('state', { enum: ['assigned', 'to_start', 'at_start', 'outbound', 'at_destination', 'to_next_start', 'returning', 'completed', 'cancelled'] }).notNull().default('assigned'),
  scheduledStartAt: integer('scheduled_start_at', { mode: 'timestamp_ms' }),
  actualStartAt: integer('actual_start_at', { mode: 'timestamp_ms' }),
  arrivedDestinationAt: integer('arrived_destination_at', { mode: 'timestamp_ms' }),
  completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  createdBy: text('created_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [
  index('idx_trips_vehicle_state').on(table.vehicleId, table.state),
  index('idx_trips_schedule').on(table.scheduledStartAt),
]);

export const providerObservations = sqliteTable('provider_observations', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id),
  provider: text('provider', { enum: ['cmsv6', 'cartrack'] }).notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  speedKph: real('speed_kph'),
  ignition: integer('ignition', { mode: 'boolean' }),
  positioningStatus: text('positioning_status', { enum: ['targeted', 'untargeted', 'unknown'] }).notNull().default('unknown'),
  gpsRecordedAt: integer('gps_recorded_at', { mode: 'timestamp_ms' }).notNull(),
  receivedAt: integer('received_at', { mode: 'timestamp_ms' }).notNull(),
  providerEventId: text('provider_event_id'),
}, (table) => [
  index('idx_observations_vehicle_gps').on(table.vehicleId, table.gpsRecordedAt),
  index('idx_observations_provider_gps').on(table.provider, table.gpsRecordedAt),
]);

export const tripPoints = sqliteTable('trip_points', {
  id: text('id').primaryKey(),
  tripId: text('trip_id').notNull().references(() => trips.id),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  gpsRecordedAt: integer('gps_recorded_at', { mode: 'timestamp_ms' }).notNull(),
  selectedProvider: text('selected_provider', { enum: ['cmsv6', 'cartrack'] }).notNull(),
  verification: text('verification', { enum: ['verified', 'single_source', 'fallback', 'conflict', 'stale'] }).notNull(),
  distanceBetweenSourcesMeters: real('distance_between_sources_meters'),
}, (table) => [
  index('idx_trip_points_trip_time').on(table.tripId, table.gpsRecordedAt),
]);

export const tripEvents = sqliteTable('trip_events', {
  id: text('id').primaryKey(),
  tripId: text('trip_id').notNull().references(() => trips.id),
  type: text('type').notNull(),
  occurredAt: integer('occurred_at', { mode: 'timestamp_ms' }).notNull(),
  source: text('source', { enum: ['automatic', 'manual', 'system'] }).notNull(),
  actorId: text('actor_id'),
  note: text('note'),
}, (table) => [index('idx_trip_events_trip_time').on(table.tripId, table.occurredAt)]);

export const workshopStays = sqliteTable('workshop_stays', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id),
  workshopLocationId: text('workshop_location_id').references(() => savedLocations.id),
  enteredAt: integer('entered_at', { mode: 'timestamp_ms' }).notNull(),
  allowedDays: integer('allowed_days').notNull(),
  expectedReleaseAt: integer('expected_release_at', { mode: 'timestamp_ms' }).notNull(),
  releasedAt: integer('released_at', { mode: 'timestamp_ms' }),
  reason: text('reason'),
  notes: text('notes'),
  createdBy: text('created_by').notNull(),
}, (table) => [index('idx_workshop_open_deadline').on(table.releasedAt, table.expectedReleaseAt)]);

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  vehicleId: text('vehicle_id').references(() => vehicles.id),
  tripId: text('trip_id').references(() => trips.id),
  workshopStayId: text('workshop_stay_id').references(() => workshopStays.id),
  title: text('title').notNull(),
  body: text('body').notNull(),
  status: text('status', { enum: ['pending', 'sent', 'read', 'failed'] }).notNull().default('pending'),
  dueAt: integer('due_at', { mode: 'timestamp_ms' }).notNull(),
  sentAt: integer('sent_at', { mode: 'timestamp_ms' }),
}, (table) => [index('idx_notifications_status_due').on(table.status, table.dueAt)]);
