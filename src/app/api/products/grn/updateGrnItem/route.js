import { getDbConnection } from '@/app/db';

export async function PUT(request) {
  const db = await getDbConnection();
  try {
    const data = await request.json();
    const { grnId, itemId, oldExpiredDate, newExpiredDate, qty, cost, other } = data || {};
    if (!grnId || !itemId) {
      return new Response(JSON.stringify({ success: false, error: 'grnId and itemId are required' }), { status: 400 });
    }

    // Fetch existing grn_item
    const [rows] = await db.query('SELECT * FROM grn_items WHERE grn_id = ? AND item_id = ?', [grnId, itemId]);
    if (rows.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'GRN item not found' }), { status: 404 });
    }
    const existing = rows[0];

    // Calculate diffs for qty and cost
    const oldQty = parseFloat(existing.qty || 0);
    const oldCost = parseFloat(existing.cost || 0);
    const newQty = typeof qty !== 'undefined' ? parseFloat(qty) : oldQty;
    const newCost = typeof cost !== 'undefined' ? parseFloat(cost) : oldCost;

    // Update grn_items row
    await db.execute('UPDATE grn_items SET qty = ?, cost = ?, other = ? WHERE grn_id = ? AND item_id = ?', [newQty, newCost, other || '', grnId, itemId]);

    // Update items table qty and total_cost by the difference
    const qtyDiff = newQty - oldQty;
    const costDiffTotal = (newQty * newCost) - (oldQty * oldCost);
    if (qtyDiff !== 0) {
      await db.execute('UPDATE items SET qty = qty + ? WHERE id = ?', [qtyDiff, itemId]);
    }
    if (costDiffTotal !== 0) {
      await db.execute('UPDATE items SET total_cost = total_cost + ? WHERE id = ?', [costDiffTotal, itemId]);
    }

    // Update GRN cost and total
    await db.execute('UPDATE grn SET cost = cost + ?, total = total + ? WHERE id = ?', [costDiffTotal, costDiffTotal, grnId]);

    // Handle expired date change: delete old row and insert new one if provided
    if (oldExpiredDate) {
      await db.execute('DELETE FROM item_expired_date WHERE item_id = ? AND expired_date = ?', [itemId, oldExpiredDate]);
    }
    if (newExpiredDate) {
      await db.execute('INSERT INTO item_expired_date (item_id, expired_date, item_name) VALUES (?, ?, ?)', [itemId, newExpiredDate, null]);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
