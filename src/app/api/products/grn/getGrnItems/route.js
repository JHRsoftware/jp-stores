import { getDbConnection } from '@/app/db';

export async function GET(request) {
  const db = await getDbConnection();
  const { searchParams } = new URL(request.url);
  const grnNumber = searchParams.get('grn_number');
  if (!grnNumber) {
    return new Response(JSON.stringify({ success: false, error: 'grn_number is required' }), { status: 400 });
  }
  try {
    const [grnRows] = await db.query('SELECT * FROM grn WHERE grn_number = ?', [grnNumber]);
    if (grnRows.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'GRN not found' }), { status: 404 });
    }
    const grn = grnRows[0];
    const [itemRows] = await db.query('SELECT gi.*, i.item_barcode, i.item_name FROM grn_items gi JOIN items i ON gi.item_id = i.id WHERE gi.grn_id = ?', [grn.id]);
    return new Response(JSON.stringify({ success: true, grn, items: itemRows }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
