import { getDbConnection } from '@/app/db';

export async function POST(request) {
  const { filterType } = await request.json(); // filterType: 'day' | 'month' | 'year'
  const pool = await getDbConnection();
  const conn = await pool.getConnection();
  try {
    let groupBy, dateFormat;
    if (filterType === 'month') {
      groupBy = 'YEAR(date_time), MONTH(date_time)';
      dateFormat = '%Y-%m';
    } else if (filterType === 'year') {
      groupBy = 'YEAR(date_time)';
      dateFormat = '%Y';
    } else {
      groupBy = 'DATE(date_time)';
      dateFormat = '%Y-%m-%d';
    }
    const [rows] = await conn.query(
      `SELECT DATE_FORMAT(date_time, ?) as period, 
              SUM(net_total) as total_sales, 
              SUM(total_profit) as total_profit
         FROM invoices
        GROUP BY ${groupBy}
        ORDER BY period DESC
        LIMIT 365`
      , [dateFormat]
    );
    return new Response(JSON.stringify({ success: true, data: rows }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  } finally {
    conn.release();
  }
}
