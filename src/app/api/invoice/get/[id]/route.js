import { getDbConnection } from '@/app/db';

export async function GET(request, { params }) {
  const id = params.id;
  if (!id) return new Response(JSON.stringify({ success: false, error: 'Missing id' }), { status: 400 });
  const pool = await getDbConnection();
  const conn = await pool.getConnection();
  try {
    const [[invRows]] = await conn.query('SELECT * FROM invoices WHERE id = ?', [id]);
    const invoice = Array.isArray(invRows) ? invRows[0] : invRows;
    if (!invoice) {
      conn.release();
      return new Response(JSON.stringify({ success: false, error: 'Invoice not found' }), { status: 404 });
    }
    // join to items table to include item name and barcode when item_id is present
    const [items] = await conn.query(
      `SELECT ii.*, it.item_name, it.item_barcode FROM invoice_items ii LEFT JOIN items it ON it.id = ii.item_id WHERE ii.invoice_id = ?`,
      [id]
    );
    conn.release();
    return new Response(JSON.stringify({ success: true, invoice, items }), { status: 200 });
  } catch (err) {
    try { conn.release(); } catch (e) {}
    console.error('get invoice err', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
