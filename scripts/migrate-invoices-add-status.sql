-- Migration: add `status` column to invoices and change invoice_items.other to note field if needed

ALTER TABLE `invoices`
  ADD COLUMN `status` VARCHAR(50) DEFAULT 'draft';

-- Optionally, if you want to keep invoice_items.other as-is, skip changing it.
-- If you want invoice_items to also use `status` or rename `other`, add another statement here.

-- If your existing `other` column exists and you want to migrate its values to `status`, run something like:
-- UPDATE invoices SET status = other WHERE other IS NOT NULL AND other != '';
-- Then if desired, you can DROP COLUMN other;

