ALTER TABLE `user` ADD `openrouter_api_key` text;--> statement-breakpoint
ALTER TABLE `user` ADD `openai_api_key` text;--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `usage_cap_cents`;