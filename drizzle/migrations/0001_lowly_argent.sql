CREATE TABLE `license_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`license_id` text NOT NULL,
	`assigned_user_id` text,
	`assigned_asset_id` text,
	`seat_number` text DEFAULT '' NOT NULL,
	`allocated_at` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `lic_assign_license_idx` ON `license_assignments` (`license_id`);--> statement-breakpoint
CREATE INDEX `lic_assign_user_idx` ON `license_assignments` (`assigned_user_id`);--> statement-breakpoint
CREATE INDEX `lic_assign_asset_idx` ON `license_assignments` (`assigned_asset_id`);--> statement-breakpoint
ALTER TABLE `licenses` ADD `license_key` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `licenses` ADD `vendor` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `licenses` ADD `license_type` text DEFAULT 'subscription' NOT NULL;--> statement-breakpoint
ALTER TABLE `licenses` ADD `total_seats` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `licenses` ADD `purchase_cost` real;--> statement-breakpoint
ALTER TABLE `licenses` ADD `purchase_date` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `licenses` ADD `expiry_date` text;--> statement-breakpoint
CREATE INDEX `asset_tx_asset_id_idx` ON `asset_transactions` (`asset_id`);--> statement-breakpoint
CREATE INDEX `assets_assigned_user_idx` ON `assets` (`assigned_user_id`);--> statement-breakpoint
CREATE INDEX `assets_category_idx` ON `assets` (`category_id`);--> statement-breakpoint
CREATE INDEX `assets_location_idx` ON `assets` (`location_id`);--> statement-breakpoint
CREATE INDEX `assets_status_idx` ON `assets` (`status`);--> statement-breakpoint
CREATE INDEX `audit_actor_idx` ON `audit_logs` (`actor_user_id`);--> statement-breakpoint
CREATE INDEX `audit_entity_idx` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `maint_asset_id_idx` ON `maintenance_logs` (`asset_id`);--> statement-breakpoint
CREATE INDEX `maint_status_idx` ON `maintenance_logs` (`status`);--> statement-breakpoint
CREATE INDEX `notif_user_id_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `requests_requester_idx` ON `requests` (`requester_id`);--> statement-breakpoint
CREATE INDEX `requests_status_idx` ON `requests` (`status`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `users_dept_idx` ON `users` (`department_id`);