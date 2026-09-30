CREATE TABLE `results` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`created` integer NOT NULL,
	`region` text NOT NULL,
	`correct` integer NOT NULL,
	`total` integer NOT NULL,
	`seconds` integer NOT NULL,
	`answers` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_results_owner_created` ON `results` (`owner`,`created`);