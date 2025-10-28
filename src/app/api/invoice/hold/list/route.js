import { getDbConnection } from '../../../../db';

export async function GET() {
  const db = await getDbConnection();
  try {
    const [rows] = await db.query('SELECT id, invoice_number, date_time, customer_id, net_total, total_discount, created_at, remark FROM invoice_hold ORDER BY created_at DESC LIMIT 200');
    return new Response(JSON.stringify({ success: true, holds: rows }), { status: 200 });
  } catch (err) {
    console.error('hold list err', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
