import { getDbConnection } from '../../../../../db';

export async function GET(request, { params }) {
  const id = params.id;
  if (!id) return new Response(JSON.stringify({ success: false, error: 'Missing id' }), { status: 400 });
  const db = await getDbConnection();
  try {
    const [rows] = await db.query('SELECT * FROM invoice_hold WHERE id = ?', [id]);
    if (rows.length === 0) return new Response(JSON.stringify({ success: false, error: 'Not found' }), { status: 404 });
    const hold = rows[0];
    const [items] = await db.query('SELECT * FROM invoice_hold_items WHERE hold_id = ?', [id]);
    return new Response(JSON.stringify({ success: true, hold, items }), { status: 200 });
  } catch (err) {
    console.error('get hold err', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
