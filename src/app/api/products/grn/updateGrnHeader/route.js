import { getDbConnection } from '@/app/db';

export async function PUT(request) {
  const db = await getDbConnection();
  try {
    const data = await request.json();
    const { grnId, field, value } = data || {};
    if (!grnId || !field) {
      return new Response(JSON.stringify({ success: false, error: 'grnId and field are required' }), { status: 400 });
    }

    // Only allow certain fields to be updated
    const allowedFields = ['date', 'supplier_id', 'invoice_number', 'po_number', 'other', 'discount', 'total'];
    if (!allowedFields.includes(field)) {
      return new Response(JSON.stringify({ success: false, error: 'Field not allowed' }), { status: 400 });
    }

    // If updating discount, we should recalculate total based on cost
    if (field === 'discount') {
      // read current cost from grn
      const [rows] = await db.query('SELECT cost FROM grn WHERE id = ?', [grnId]);
      if (rows.length === 0) return new Response(JSON.stringify({ success: false, error: 'GRN not found' }), { status: 404 });
      const cost = parseFloat(rows[0].cost || 0);
      const discountNum = parseFloat(value) || 0;
      const newTotal = Math.max(0, cost - discountNum);
      await db.execute('UPDATE grn SET discount = ?, total = ? WHERE id = ?', [discountNum, newTotal, grnId]);
      return new Response(JSON.stringify({ success: true, total: newTotal }), { status: 200 });
    }

    // Generic update for other fields
    await db.execute(`UPDATE grn SET ${field} = ? WHERE id = ?`, [value, grnId]);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
