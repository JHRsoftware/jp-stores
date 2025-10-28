const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function run() {
  const sqlFile = path.join(__dirname, '..', 'migrations', '20251007_create_price_and_expired.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jp_stores',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    multipleStatements: true,
  });
  try {
    console.log('Running migration...');
    const [result] = await conn.query(sql);
    console.log('Migration completed.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

run();
