-- Add invoice print visibility settings to shop table
-- These columns control what elements to show/hide in invoice prints

-- Add hide_sell_price column
ALTER TABLE shop 
ADD COLUMN hide_sell_price BOOLEAN DEFAULT FALSE;

-- Add hide_total_discount column
ALTER TABLE shop 
ADD COLUMN hide_total_discount BOOLEAN DEFAULT FALSE;

-- Set defaults for existing shops (show all elements by default)
UPDATE shop SET hide_sell_price = FALSE WHERE hide_sell_price IS NULL;
UPDATE shop SET hide_total_discount = FALSE WHERE hide_total_discount IS NULL;

-- Add comments for documentation
ALTER TABLE shop MODIFY COLUMN hide_sell_price BOOLEAN DEFAULT FALSE 
COMMENT 'Controls visibility of Sell Price column in invoice prints (TRUE=hidden, FALSE=visible)';

ALTER TABLE shop MODIFY COLUMN hide_total_discount BOOLEAN DEFAULT FALSE 
COMMENT 'Controls visibility of Total Discount line in invoice prints (TRUE=hidden, FALSE=visible)';