import { getDbConnection } from '@/app/db';

export async function POST(request) {
  const db = await getDbConnection();
  try {
    const data = await request.json();
    const { grnId, itemId, item_name, qty, cost, expired_date, other } = data || {};

    if (!grnId || !itemId || !qty || typeof qty === 'undefined') {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields: grnId, itemId, qty' }), { status: 400 });
    }

    // Insert into grn_items (DB doesn't have expired_date column here)
    await db.execute(
      'INSERT INTO grn_items (grn_id, item_id, qty, cost, other) VALUES (?, ?, ?, ?, ?)',
      [grnId, itemId, qty, cost || 0, other || '']
    );

    // Update items table: increase qty and total_cost
    const numericCost = parseFloat(cost) || 0;
    await db.execute(
      'UPDATE items SET qty = qty + ?, total_cost = total_cost + (? * ?) WHERE id = ?',
      [qty, qty, numericCost, itemId]
    );

    // If expired_date provided, insert into item_expired_date table
    if (expired_date) {
      await db.execute(
        'INSERT INTO item_expired_date (item_id, expired_date, item_name) VALUES (?, ?, ?)',
        [itemId, expired_date, item_name || null]
      );
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
