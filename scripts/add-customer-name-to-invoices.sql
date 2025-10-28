-- Migration: add customer_name to invoices and invoice_hold
-- This script is safe to run multiple times on MySQL 8.0+ (uses IF NOT EXISTS)
-- Run with: mysql -u <user> -p <database> < scripts/add-customer-name-to-invoices.sql

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255) DEFAULT NULL AFTER customer_id;

ALTER TABLE invoice_hold
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255) DEFAULT NULL AFTER customer_id;

-- Optional: create index if you plan to query by customer_name frequently
-- CREATE INDEX IF NOT EXISTS idx_invoices_customer_name ON invoices(customer_name);
-- CREATE INDEX IF NOT EXISTS idx_invoice_hold_customer_name ON invoice_hold(customer_name);
