import { getDbConnection } from '@/app/db';

// Get next GRN number or all GRNs
export async function GET(request) {
  const db = await getDbConnection();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  try {
    if (type === 'nextGrnNumber') {
      const [rows] = await db.query('SELECT grn_number FROM grn ORDER BY id DESC LIMIT 1');
      let nextGrn = 1;
      if (rows.length > 0 && rows[0].grn_number) {
        nextGrn = parseInt(rows[0].grn_number, 10) + 1;
      }
      return new Response(JSON.stringify({ nextGrnNumber: nextGrn }), { status: 200 });
    }
    // Get all GRNs
    const [rows] = await db.query('SELECT * FROM grn ORDER BY id DESC');
    return new Response(JSON.stringify({ grns: rows }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}

// Save new GRN
export async function POST(request) {
  const db = await getDbConnection();
  const data = await request.json();
  const {
    grnId, // new: for updating existing GRN
    grnNumber,
    invoiceNumber,
    date,
    dueDate,
    poNumber,
    supplierId,
    total,
    discount,
    userName,
    other,
    items
  } = data || {};

  // Required: grnNumber, date, supplierId, items
  const missing = [];
  if (!grnNumber) missing.push('grnNumber');
  if (!date) missing.push('date');
  if (!supplierId) missing.push('supplierId');
  if (!items || !Array.isArray(items) || items.length === 0) missing.push('items');

  if (missing.length > 0) {
    return new Response(JSON.stringify({ success: false, error: `Missing required fields: ${missing.join(', ')}` }), { status: 400 });
  }
  try {
    let grnIdToUse = grnId;
    let newTotal = total;
    let newCost = 0;
    if (items && items.length > 0) {
      newCost = items.reduce((sum, it) => sum + (parseFloat(it.qty) * parseFloat(it.cost || 0)), 0);
    }
    if (!grnIdToUse) {
      // Insert GRN (id is AUTO_INCREMENT)
      const [result] = await db.execute(
        'INSERT INTO grn (grn_number, invoice_number, date, due_date, po_number, supplier_id, total, discount, user_name, other, cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [grnNumber, invoiceNumber, date, dueDate || '', poNumber || '', supplierId, total || '', discount || '', userName, other || '', newCost]
      );
      grnIdToUse = result.insertId;
    } else {
      // Updating existing GRN: need to reverse previous item qty/cost effects, remove old items, then insert new ones
      // 1) Fetch existing grn_items for this GRN
      const [existingItems] = await db.query('SELECT * FROM grn_items WHERE grn_id = ?', [grnIdToUse]);
      // 2) Reverse their effect on items table
      for (const ex of existingItems) {
        try {
          await db.execute('UPDATE items SET qty = qty - ?, total_cost = total_cost - (? * ?) WHERE id = ?', [ex.qty, ex.qty, ex.cost || 0, ex.item_id]);
        } catch (err) {
          // continue; we'll still attempt to proceed
        }
      }
      // 3) Delete previous grn_items entries for this GRN
      await db.execute('DELETE FROM grn_items WHERE grn_id = ?', [grnIdToUse]);
      // Optionally delete related expired date entries -- skipping deletion to avoid removing shared records

      // 4) Update grn header with new totals/cost/discount
      await db.execute('UPDATE grn SET grn_number = ?, invoice_number = ?, date = ?, due_date = ?, po_number = ?, supplier_id = ?, total = ?, discount = ?, user_name = ?, other = ?, cost = ? WHERE id = ?', [grnNumber, invoiceNumber, date, dueDate || '', poNumber || '', supplierId, total || '', discount || '', userName, other || '', newCost, grnIdToUse]);
    }
    // Insert new items and apply their effects
    for (const item of items) {
      await db.execute(
        'INSERT INTO grn_items (grn_id, item_id, qty, cost, other) VALUES (?, ?, ?, ?, ?)',
        [grnIdToUse, item.itemId, item.qty, item.cost || '', item.other || '']
      );
      // Update item table: add qty and cost
      await db.execute(
        'UPDATE items SET qty = qty + ?, total_cost = total_cost + (? * ?) WHERE id = ?',
        [item.qty, item.qty, item.cost || 0, item.itemId]
      );
      // Insert item_expired_date if provided
      if (item.expired_date) {
        await db.execute(
          'INSERT INTO item_expired_date (item_id, expired_date, item_name) VALUES (?, ?, ?)',
          [item.itemId, item.expired_date, item.item_name || null]
        );
      }
    }
    return new Response(JSON.stringify({ success: true, grnId: grnIdToUse }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
