-- SQL DDL for invoice holds

CREATE TABLE IF NOT EXISTS `invoice_hold` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoice_number` VARCHAR(100) DEFAULT NULL,
  `date_time` DATETIME DEFAULT NULL,
  `customer_id` INT UNSIGNED DEFAULT NULL,
  `net_total` DECIMAL(14,2) DEFAULT 0,
  `total_discount` DECIMAL(14,2) DEFAULT 0,
  `total_cost` DECIMAL(14,2) DEFAULT 0,
  `total_profit` DECIMAL(14,2) DEFAULT 0,
  `cash_payment` DECIMAL(14,2) DEFAULT 0,
  `card_payment` DECIMAL(14,2) DEFAULT 0,
  `card_info` VARCHAR(255) DEFAULT NULL,
  `user_name` VARCHAR(100) DEFAULT NULL,
  `remark` TEXT DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'hold',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX (`invoice_number`),
  INDEX (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invoice_hold_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `hold_id` INT UNSIGNED NOT NULL,
  `item_id` INT UNSIGNED DEFAULT NULL,
  `item_name` VARCHAR(255) DEFAULT NULL,
  `barcode` VARCHAR(255) DEFAULT NULL,
  `qty` DECIMAL(12,3) DEFAULT 0,
  `warranty` VARCHAR(255) DEFAULT NULL,
  `cost` DECIMAL(14,4) DEFAULT NULL,
  `market_price` DECIMAL(14,2) DEFAULT NULL,
  `selling_price` DECIMAL(14,2) DEFAULT NULL,
  `discount` DECIMAL(14,2) DEFAULT 0,
  `total_value` DECIMAL(16,2) DEFAULT NULL,
  `other` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX (`hold_id`),
  INDEX (`item_id`),
  CONSTRAINT `fk_invoice_hold_items_hold` FOREIGN KEY (`hold_id`) REFERENCES `invoice_hold` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
