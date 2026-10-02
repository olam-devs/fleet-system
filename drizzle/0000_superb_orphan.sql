CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`vehicle_id` text,
	`trip_id` text,
	`workshop_stay_id` text,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`due_at` integer NOT NULL,
	`sent_at` integer,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workshop_stay_id`) REFERENCES `workshop_stays`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_status_due` ON `notifications` (`status`,`due_at`);--> statement-breakpoint
CREATE TABLE `provider_observations` (
	`id` text PRIMARY KEY NOT NULL,
	`vehicle_id` text NOT NULL,
	`provider` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`speed_kph` real,
	`ignition` integer,
	`gps_recorded_at` integer NOT NULL,
	`received_at` integer NOT NULL,
	`provider_event_id` text,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_observations_vehicle_gps` ON `provider_observations` (`vehicle_id`,`gps_recorded_at`);--> statement-breakpoint
CREATE INDEX `idx_observations_provider_gps` ON `provider_observations` (`provider`,`gps_recorded_at`);--> statement-breakpoint
CREATE TABLE `saved_locations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`geofence_radius_meters` integer DEFAULT 150 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trip_events` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`type` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`source` text NOT NULL,
	`actor_id` text,
	`note` text,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_trip_events_trip_time` ON `trip_events` (`trip_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `trip_points` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`vehicle_id` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`gps_recorded_at` integer NOT NULL,
	`selected_provider` text NOT NULL,
	`verification` text NOT NULL,
	`distance_between_sources_meters` real,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_trip_points_trip_time` ON `trip_points` (`trip_id`,`gps_recorded_at`);--> statement-breakpoint
CREATE TABLE `trips` (
	`id` text PRIMARY KEY NOT NULL,
	`vehicle_id` text NOT NULL,
	`start_location_id` text NOT NULL,
	`destination_location_id` text NOT NULL,
	`return_location_id` text,
	`next_trip_id` text,
	`state` text DEFAULT 'assigned' NOT NULL,
	`scheduled_start_at` integer,
	`actual_start_at` integer,
	`arrived_destination_at` integer,
	`completed_at` integer,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`start_location_id`) REFERENCES `saved_locations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`destination_location_id`) REFERENCES `saved_locations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`return_location_id`) REFERENCES `saved_locations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_trips_vehicle_state` ON `trips` (`vehicle_id`,`state`);--> statement-breakpoint
CREATE INDEX `idx_trips_schedule` ON `trips` (`scheduled_start_at`);--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` text PRIMARY KEY NOT NULL,
	`registration` text NOT NULL,
	`normalized_registration` text NOT NULL,
	`chassis_number` text,
	`display_name` text,
	`cmsv6_device_id` text,
	`cartrack_vehicle_id` text,
	`default_location_id` text,
	`status` text DEFAULT 'available' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_vehicles_registration` ON `vehicles` (`normalized_registration`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_vehicles_cmsv6_id` ON `vehicles` (`cmsv6_device_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_vehicles_cartrack_id` ON `vehicles` (`cartrack_vehicle_id`);--> statement-breakpoint
CREATE TABLE `workshop_stays` (
	`id` text PRIMARY KEY NOT NULL,
	`vehicle_id` text NOT NULL,
	`workshop_location_id` text,
	`entered_at` integer NOT NULL,
	`allowed_days` integer NOT NULL,
	`expected_release_at` integer NOT NULL,
	`released_at` integer,
	`reason` text,
	`notes` text,
	`created_by` text NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workshop_location_id`) REFERENCES `saved_locations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_workshop_open_deadline` ON `workshop_stays` (`released_at`,`expected_release_at`);