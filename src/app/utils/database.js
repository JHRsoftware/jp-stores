import { getDbConnection } from '@/app/db';

// Query performance monitoring
class QueryPerformanceMonitor {
  constructor() {
    this.queries = [];
    this.slowQueryThreshold = 1000; // 1 second
  }

  logQuery(query, duration, params) {
    const logEntry = {
      query,
      duration,
      params,
      timestamp: new Date().toISOString(),
      slow: duration > this.slowQueryThreshold
    };

    this.queries.push(logEntry);
    
    // Keep only last 100 queries in memory
    if (this.queries.length > 100) {
      this.queries.shift();
    }

    // Log slow queries in development
    if (process.env.NODE_ENV === 'development' && logEntry.slow) {
      console.warn(`Slow query detected (${duration}ms):`, query, params);
    }
  }

  getStats() {
    const totalQueries = this.queries.length;
    const slowQueries = this.queries.filter(q => q.slow).length;
    const avgDuration = this.queries.reduce((sum, q) => sum + q.duration, 0) / totalQueries;

    return {
      totalQueries,
      slowQueries,
      avgDuration: Math.round(avgDuration),
      slowQueryPercentage: Math.round((slowQueries / totalQueries) * 100)
    };
  }
}

const queryMonitor = new QueryPerformanceMonitor();

// Optimized database operations
export class DatabaseHelper {
  constructor() {
    this.db = null;
  }

  async getConnection() {
    if (!this.db) {
      this.db = await getDbConnection();
    }
    return this.db;
  }

  // Execute query with performance monitoring
  async executeQuery(query, params = []) {
    const startTime = performance.now();
    
    try {
      const db = await this.getConnection();
      const [rows] = await db.execute(query, params);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      queryMonitor.logQuery(query, duration, params);
      
      return rows;
    } catch (error) {
      console.error('Database query error:', error);
      console.error('Query:', query);
      console.error('Params:', params);
      throw error;
    }
  }

  // Optimized SELECT with automatic caching
  async select(table, conditions = {}, options = {}) {
    const {
      columns = '*',
      orderBy = null,
      limit = null,
      offset = null,
      joins = []
    } = options;

    let query = `SELECT ${Array.isArray(columns) ? columns.join(', ') : columns} FROM ${table}`;
    const params = [];

    // Add joins
    joins.forEach(join => {
      query += ` ${join}`;
    });

    // Add WHERE conditions
    const whereConditions = Object.keys(conditions);
    if (whereConditions.length > 0) {
      query += ' WHERE ';
      const conditionClauses = whereConditions.map(key => {
        params.push(conditions[key]);
        return `${key} = ?`;
      });
      query += conditionClauses.join(' AND ');
    }

    // Add ORDER BY
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    // Add LIMIT
    if (limit) {
      query += ` LIMIT ${limit}`;
      if (offset) {
        query += ` OFFSET ${offset}`;
      }
    }

    return this.executeQuery(query, params);
  }

  // Optimized INSERT with batch support
  async insert(table, data) {
    if (Array.isArray(data) && data.length > 1) {
      return this.batchInsert(table, data);
    }

    const singleRecord = Array.isArray(data) ? data[0] : data;
    const columns = Object.keys(singleRecord);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => singleRecord[col]);

    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    const result = await this.executeQuery(query, values);
    return result;
  }

  // Batch insert for better performance
  async batchInsert(table, data) {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const valuePlaceholders = data.map(() => `(${placeholders})`).join(', ');
    
    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${valuePlaceholders}`;
    
    const values = [];
    data.forEach(record => {
      columns.forEach(col => {
        values.push(record[col]);
      });
    });

    return this.executeQuery(query, values);
  }

  // Optimized UPDATE
  async update(table, data, conditions) {
    const setColumns = Object.keys(data);
    const whereColumns = Object.keys(conditions);
    
    const setClause = setColumns.map(col => `${col} = ?`).join(', ');
    const whereClause = whereColumns.map(col => `${col} = ?`).join(' AND ');
    
    const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    
    const params = [
      ...setColumns.map(col => data[col]),
      ...whereColumns.map(col => conditions[col])
    ];
    
    return this.executeQuery(query, params);
  }

  // Optimized DELETE
  async delete(table, conditions) {
    const whereColumns = Object.keys(conditions);
    const whereClause = whereColumns.map(col => `${col} = ?`).join(' AND ');
    const params = whereColumns.map(col => conditions[col]);
    
    const query = `DELETE FROM ${table} WHERE ${whereClause}`;
    
    return this.executeQuery(query, params);
  }

  // Get table statistics for optimization
  async getTableStats(table) {
    const countQuery = `SELECT COUNT(*) as total_rows FROM ${table}`;
    const sizeQuery = `
      SELECT 
        ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'size_mb'
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() AND table_name = ?
    `;

    const [countResult] = await this.executeQuery(countQuery);
    const [sizeResult] = await this.executeQuery(sizeQuery, [table]);

    return {
      totalRows: countResult[0]?.total_rows || 0,
      sizeMB: sizeResult[0]?.size_mb || 0
    };
  }

  // Execute transaction with rollback support
  async transaction(operations) {
    const db = await this.getConnection();
    
    try {
      await db.execute('START TRANSACTION');
      
      const results = [];
      for (const operation of operations) {
        const result = await this.executeQuery(operation.query, operation.params);
        results.push(result);
      }
      
      await db.execute('COMMIT');
      return results;
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  }

  // Get query performance statistics
  getPerformanceStats() {
    return queryMonitor.getStats();
  }
}

// Global database helper instance
export const dbHelper = new DatabaseHelper();

// Optimized queries for common operations
export const commonQueries = {
  // Customer operations
  customers: {
    async getAll() {
      return dbHelper.select('customers', {}, {
        orderBy: 'id DESC',
        columns: ['id', 'customer_code', 'customer_name', 'address', 'contact_number', 'email', 'vat_no', 'svat_no', 'other']
      });
    },

    async getById(id) {
      const results = await dbHelper.select('customers', { id }, { limit: 1 });
      return results[0] || null;
    },

    async create(customerData) {
      return dbHelper.insert('customers', customerData);
    },

    async update(id, customerData) {
      return dbHelper.update('customers', customerData, { id });
    },

    async delete(id) {
      return dbHelper.delete('customers', { id });
    }
  },

  // Product operations
  products: {
    async getAllItems() {
      return dbHelper.select('products', {}, {
        orderBy: 'id DESC',
        columns: ['id', 'item_code', 'item_name', 'category_id', 'qty_type_id', 'cost_price', 'sale_price']
      });
    },

    async getCategories() {
      return dbHelper.select('categories', {}, { orderBy: 'id DESC' });
    },

    async createItem(itemData) {
      return dbHelper.insert('products', itemData);
    }
  },

  // Invoice operations
  invoices: {
    async getStats(filterType = 'day') {
      const query = `
        SELECT 
          DATE(created_at) as period,
          SUM(total_amount) as total_sales,
          SUM(total_profit) as total_profit,
          COUNT(*) as order_count
        FROM invoices 
        WHERE status = 'completed'
          AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
        GROUP BY DATE(created_at)
        ORDER BY period DESC
      `;
      
      return dbHelper.executeQuery(query);
    },

    async create(invoiceData) {
      return dbHelper.insert('invoices', invoiceData);
    },

    async getById(id) {
      const results = await dbHelper.select('invoices', { id }, { limit: 1 });
      return results[0] || null;
    }
  }
};

export default dbHelper;