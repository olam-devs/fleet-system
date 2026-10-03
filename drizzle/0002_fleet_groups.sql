CREATE TABLE `vehicle_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`parent_id` text,
	`source` text DEFAULT 'local' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_vehicle_groups_name_parent` ON `vehicle_groups` (`name`,`parent_id`);
--> statement-breakpoint
CREATE TABLE `vehicle_group_assignments` (
	`vehicle_id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `vehicle_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_vehicle_assignments_group` ON `vehicle_group_assignments` (`group_id`);
--> statement-breakpoint
PRAGMA optimize;
