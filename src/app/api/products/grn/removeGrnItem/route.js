import { getDbConnection } from '@/app/db';

export async function DELETE(request) {
  const db = await getDbConnection();
  const { searchParams } = new URL(request.url);
  const grnId = searchParams.get('grn_id');
  const itemId = searchParams.get('item_id');
  const expiredDate = searchParams.get('expired_date');
  if (!grnId || !itemId) {
    return new Response(JSON.stringify({ success: false, error: 'grn_id and item_id are required' }), { status: 400 });
  }
  try {
    // Get the item row from grn_items
    const [rows] = await db.query('SELECT * FROM grn_items WHERE grn_id = ? AND item_id = ?', [grnId, itemId]);
    if (rows.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Item not found in GRN' }), { status: 404 });
    }
    const grnItem = rows[0];
    // Remove from grn_items
    await db.execute('DELETE FROM grn_items WHERE grn_id = ? AND item_id = ?', [grnId, itemId]);
    // Update item table: subtract qty and cost
    await db.execute('UPDATE items SET qty = qty - ?, total_cost = total_cost - (? * ?) WHERE id = ?', [grnItem.qty, grnItem.qty, grnItem.cost || 0, itemId]);
    // Remove expiry date row if expiredDate is provided
    if (expiredDate) {
      await db.execute('DELETE FROM item_expired_date WHERE item_id = ? AND expired_date = ?', [itemId, expiredDate]);
    }
    // Update GRN cost and total
    await db.execute('UPDATE grn SET cost = cost - (? * ?), total = total - (? * ?) WHERE id = ?', [grnItem.qty, grnItem.cost || 0, grnItem.qty, grnItem.cost || 0, grnId]);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
