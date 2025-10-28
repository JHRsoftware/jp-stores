
import mysql from 'mysql2/promise';

// Performance-optimized connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'harshana_Jude',
  password: process.env.DB_PASSWORD || 'Harshana@123',
  database: process.env.DB_NAME || 'harshana_jp_stores',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  multipleStatements: false,
  dateStrings: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
  charset: 'utf8mb4',
});

// Warn in development if DB_NAME isn't set so it's obvious which database will be used
if (process.env.NODE_ENV !== 'production' && !process.env.DB_NAME) {
  console.warn("Warning: DB_NAME is not set in environment; falling back to default 'jp_stores'. Set DB_NAME in .env.local or your deployment environment.");
}
// Connection health check
let lastHealthCheck = Date.now();
const HEALTH_CHECK_INTERVAL = 300000; // 5 minutes

async function checkPoolHealth() {
  const now = Date.now();
  if (now - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
    try {
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      lastHealthCheck = now;
    } catch (error) {
      console.error('Database health check failed:', error);
    }
  }
}

export async function getDbConnection() {
  try {
    // Perform health check periodically
    await checkPoolHealth();
    return pool;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw new Error('Database connection failed');
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database connections...');
  await pool.end();
  process.exit(0);
});

export default pool;
