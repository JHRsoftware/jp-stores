# 📊 MySQL Database Setup Guide

## 🎯 Scripts Folder Overview

Your `scripts` folder contains database migration files and utilities for your MySQL database:

### ✅ Active & Useful Files:

1. **`performance-test.js`** - Tests your app's performance (referenced in package.json)
2. **SQL Migration Files** - Database schema updates for MySQL
3. **`run-migrations.js`** - Utility to run SQL migrations

## 🛠 MySQL Database Setup

### Step 1: Database Configuration
Make sure your database connection is configured in your `.env` file:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=jp_stores
DB_PORT=3306
```

### Step 2: Core Database Tables
Run these SQL files in order to set up your database:

#### 1. Create Invoice Tables
```bash
mysql -u root -p jp_stores < scripts/create-invoice-tables.sql
```
**Purpose**: Creates `invoices` and `invoice_items` tables for billing system

#### 2. Create Invoice Hold Tables  
```bash
mysql -u root -p jp_stores < scripts/create-invoice-hold-tables.sql
```
**Purpose**: Creates tables for draft/temporary invoices

#### 3. Add Customer Names to Invoices
```bash
mysql -u root -p jp_stores < scripts/add-customer-name-to-invoices.sql
```
**Purpose**: Adds customer_name column to invoice tables

#### 4. Update Item Quantities to Decimal
```bash
mysql -u root -p jp_stores < scripts/alter-items-qty-to-decimal.sql
```
**Purpose**: Changes quantity fields to support decimal values (like 1.5kg)

#### 5. Add Invoice Status Migration
```bash
mysql -u root -p jp_stores < scripts/migrate-invoices-add-status.sql
```
**Purpose**: Adds status tracking for invoices (draft, completed, etc.)

#### 6. Add Price Hiding Feature
```bash
mysql -u root -p jp_stores < scripts/add-hide-sell-price-setting.sql
```
**Purpose**: Adds setting to hide selling prices from staff

### Step 3: Using the Migration Runner

You can also use the JavaScript migration runner:

```bash
node scripts/run-migrations.js
```

## 🚀 Quick Database Setup Commands

### Option 1: Manual Setup (Recommended)
```bash
# 1. Create database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS jp_stores CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Run migrations in order
mysql -u root -p jp_stores < scripts/create-invoice-tables.sql
mysql -u root -p jp_stores < scripts/create-invoice-hold-tables.sql  
mysql -u root -p jp_stores < scripts/add-customer-name-to-invoices.sql
mysql -u root -p jp_stores < scripts/alter-items-qty-to-decimal.sql
mysql -u root -p jp_stores < scripts/migrate-invoices-add-status.sql
mysql -u root -p jp_stores < scripts/add-hide-sell-price-setting.sql
```

### Option 2: PowerShell Batch Setup
```powershell
# Create a PowerShell script to run all migrations
$migrations = @(
    "create-invoice-tables.sql",
    "create-invoice-hold-tables.sql", 
    "add-customer-name-to-invoices.sql",
    "alter-items-qty-to-decimal.sql",
    "migrate-invoices-add-status.sql",
    "add-hide-sell-price-setting.sql"
)

foreach ($migration in $migrations) {
    Write-Host "Running $migration..."
    mysql -u root -p jp_stores < "scripts/$migration"
}
```

## 🔧 Database Connection Test

Test your database connection:

```bash
# Test performance and database connectivity
npm run test:performance
```

## 📋 Required MySQL Tables

After running all migrations, your database should have these tables:

- `invoices` - Main invoice records
- `invoice_items` - Line items for each invoice  
- `invoice_hold` - Draft/temporary invoices
- `customers` - Customer information
- `items` - Product/inventory items
- `suppliers` - Supplier information
- `categories` - Product categories
- `qty_types` - Quantity measurement types

## ⚡ Performance Features

Your database is optimized with:
- **Connection pooling** (15 concurrent connections)
- **Health checks** every 5 minutes
- **Prepared statements** for security
- **Proper indexing** for fast queries
- **UTF8MB4 charset** for full Unicode support

## 🎯 Next Steps

1. Run the SQL migrations in order
2. Update your `.env` file with correct database credentials
3. Test the connection with `npm run test:performance`
4. Start your app with `npm run dev`

Your MySQL database will be ready for the JP Stores application! 🚀