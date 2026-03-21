CREATE TABLE `affiliate_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`originalPattern` text NOT NULL,
	`affiliateUrl` text NOT NULL,
	`keywords` text,
	`clickCount` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliate_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_targets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`automationId` int NOT NULL,
	`sendTargetId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automation_targets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`instanceId` int NOT NULL,
	`sourceGroupId` int NOT NULL,
	`campaignId` int,
	`useLlmSuggestion` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`sendDelay` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`color` varchar(20) DEFAULT '#22c55e',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monitored_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instanceId` int NOT NULL,
	`userId` int NOT NULL,
	`groupJid` varchar(255) NOT NULL,
	`groupName` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monitored_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`automationId` int,
	`instanceId` int NOT NULL,
	`sourceGroupJid` varchar(255) NOT NULL,
	`sourceGroupName` varchar(255),
	`senderJid` varchar(255),
	`senderName` varchar(255),
	`originalContent` text,
	`processedContent` text,
	`linksFound` int NOT NULL DEFAULT 0,
	`linksReplaced` int NOT NULL DEFAULT 0,
	`campaignId` int,
	`campaignName` varchar(255),
	`llmSuggestion` text,
	`mediaType` enum('text','image','video','document','sticker','audio') DEFAULT 'text',
	`mediaUrl` text,
	`status` enum('pending','processed','sent','failed','skipped') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `post_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `send_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postLogId` int NOT NULL,
	`targetJid` varchar(255) NOT NULL,
	`targetName` varchar(255),
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `send_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `send_targets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instanceId` int NOT NULL,
	`userId` int NOT NULL,
	`targetJid` varchar(255) NOT NULL,
	`targetName` varchar(255),
	`targetType` enum('group','contact') NOT NULL DEFAULT 'group',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `send_targets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_instances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`phoneNumber` varchar(30),
	`status` enum('disconnected','connecting','connected','qr_pending') NOT NULL DEFAULT 'disconnected',
	`qrCode` text,
	`sessionData` text,
	`lastConnectedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_instances_id` PRIMARY KEY(`id`)
);
