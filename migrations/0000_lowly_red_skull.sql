CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`company` text,
	`role` text,
	`location` text,
	`phones` text DEFAULT '[]' NOT NULL,
	`emails` text DEFAULT '[]' NOT NULL,
	`linkedin_url` text,
	`other_urls` text DEFAULT '[]' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`source` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
