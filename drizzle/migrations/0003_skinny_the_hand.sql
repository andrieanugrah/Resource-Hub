ALTER TABLE `categories` ADD `specifications` text;--> statement-breakpoint
ALTER TABLE `requests` ADD `department_asset` integer DEFAULT false NOT NULL;