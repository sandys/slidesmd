CREATE TABLE `presentations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`public_id` text NOT NULL,
	`hashed_edit_key` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `presentations_public_id_unique` ON `presentations` (`public_id`);--> statement-breakpoint
CREATE TABLE `slides` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`order` integer NOT NULL,
	`presentation_id` integer NOT NULL,
	FOREIGN KEY (`presentation_id`) REFERENCES `presentations`(`id`) ON UPDATE no action ON DELETE cascade
);
