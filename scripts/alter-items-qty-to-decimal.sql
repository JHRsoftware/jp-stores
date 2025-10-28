-- Alter items.qty to allow fractional quantities (MySQL)
-- Run this if your current `items.qty` column is an INT and you need decimals like 0.2, 0.5 etc.

ALTER TABLE `items`
  MODIFY `qty` DECIMAL(12,3) NOT NULL DEFAULT 0;

-- After running, verify with:
-- SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'items' AND COLUMN_NAME = 'qty' AND TABLE_SCHEMA = DATABASE();
