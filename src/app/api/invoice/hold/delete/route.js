import { getDbConnection } from '../../../../db';

export async function POST(request) {
  try {
    const data = await request.json();
    if (!data || !data.holdId) return new Response(JSON.stringify({ success: false, error: 'Missing holdId' }), { status: 400 });
    const pool = await getDbConnection();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute('DELETE FROM invoice_hold_items WHERE hold_id = ?', [data.holdId]);
      await conn.execute('DELETE FROM invoice_hold WHERE id = ?', [data.holdId]);
      await conn.commit();
      conn.release();
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
      try { await conn.rollback(); } catch (e) {}
      try { conn.release(); } catch (e) {}
      console.error('delete hold err', err);
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid request' }), { status: 400 });
  }
}
