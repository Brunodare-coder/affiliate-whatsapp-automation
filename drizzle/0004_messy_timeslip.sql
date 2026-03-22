CREATE TABLE `aliexpress_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`trackId` varchar(255),
	`cookie` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aliexpress_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `aliexpress_config_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `amazon_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tag` varchar(255),
	`cookieSession` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `amazon_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `amazon_config_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `bot_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scheduleEnabled` boolean NOT NULL DEFAULT false,
	`scheduleWindows` json,
	`delayMinutes` int NOT NULL DEFAULT 0,
	`delayPerGroup` boolean NOT NULL DEFAULT false,
	`delayGlobal` boolean NOT NULL DEFAULT false,
	`includeGroupLink` boolean NOT NULL DEFAULT false,
	`feedGlobalEnabled` boolean NOT NULL DEFAULT false,
	`feedGlobalTargets` json,
	`clickablePreview` boolean NOT NULL DEFAULT false,
	`linkOrder` enum('first','last') NOT NULL DEFAULT 'first',
	`cmdStickerEnabled` boolean NOT NULL DEFAULT false,
	`cmdDeleteLinksEnabled` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bot_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `bot_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `magazine_luiza_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tag` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `magazine_luiza_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `magazine_luiza_config_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `shopee_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`appId` varchar(255),
	`secret` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shopee_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `shopee_config_userId_unique` UNIQUE(`userId`)
);
