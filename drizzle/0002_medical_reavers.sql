CREATE TABLE `mercado_livre_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tag` varchar(255),
	`cookieSsid` text,
	`mattToolId` varchar(100),
	`socialTag` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mercado_livre_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `mercado_livre_config_userId_unique` UNIQUE(`userId`)
);
