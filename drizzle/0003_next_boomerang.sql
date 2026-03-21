CREATE TABLE `group_targets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceGroupId` int NOT NULL,
	`targetGroupId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `group_targets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `monitored_groups` ADD `buscarOfertas` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `monitored_groups` ADD `espelharConteudo` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `monitored_groups` ADD `enviarOfertas` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `monitored_groups` ADD `substituirImagem` boolean DEFAULT false NOT NULL;