-- SQL DDL for invoices and invoice_items (MySQL)
-- Note: `invoice_items.discount` stores per-unit discount (market_price - selling_price) or provided value.

CREATE TABLE IF NOT EXISTS `invoices` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoice_number` VARCHAR(100) NOT NULL,
  `date_time` DATETIME NOT NULL,
  `customer_id` INT UNSIGNED NOT NULL,
  `net_total` DECIMAL(12,2) DEFAULT 0,
  `total_discount` DECIMAL(12,2) DEFAULT 0,
  `total_cost` DECIMAL(12,2) DEFAULT 0,
  `total_profit` DECIMAL(12,2) DEFAULT 0,
  `cash_payment` DECIMAL(12,2) DEFAULT 0,
  `card_payment` DECIMAL(12,2) DEFAULT 0,
  `card_info` VARCHAR(255) DEFAULT NULL,
  `user_name` VARCHAR(100) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'draft',
  PRIMARY KEY (`id`),
  INDEX (`invoice_number`),
  INDEX (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoice_id` INT UNSIGNED NOT NULL,
  `item_id` INT UNSIGNED DEFAULT NULL,
  `qty` DECIMAL(12,3) DEFAULT 0,
  `warranty` VARCHAR(255) DEFAULT NULL,
  `cost` DECIMAL(12,4) DEFAULT NULL,
  `market_price` DECIMAL(12,2) DEFAULT NULL,
  `selling_price` DECIMAL(12,2) DEFAULT NULL,
  `discount` DECIMAL(12,2) DEFAULT 0,
  `total_value` DECIMAL(14,2) DEFAULT NULL,
  `other` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX (`invoice_id`),
  INDEX (`item_id`),
  CONSTRAINT `fk_invoice_items_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
