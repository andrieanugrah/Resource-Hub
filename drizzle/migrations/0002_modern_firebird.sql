ALTER TABLE `assets` ADD `useful_life_years` integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `assets` ADD `salvage_value` real DEFAULT 0 NOT NULL;