import { getDbConnection } from '@/app/db';

export async function POST(request) {
  const data = await request.json();
  if (!data || !data.invoiceId) return new Response(JSON.stringify({ success: false, error: 'Missing invoiceId' }), { status: 400 });
  const invoiceId = data.invoiceId;
  const pool = await getDbConnection();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Load existing items to rollback stock
    const [existingItems] = await conn.query('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId]);

    // Restore stock for existing items (increase back by qty)
    for (const it of existingItems) {
      if (it.item_id) {
        await conn.execute('UPDATE items SET qty = qty + ? WHERE id = ?', [Number(it.qty || 0), it.item_id]);
      }
    }

    // Update invoice header (try to set customer_name when available)
    // Resolve customer: if no customerId provided, try to find/create default 'Unknown' (or use provided customerName)
    let finalCustomerId = data.customerId ?? null;
    if (!finalCustomerId) {
      const nameToFind = (data.customerName || 'Unknown');
      try {
        const [rows] = await conn.query('SELECT id FROM customers WHERE customer_name = ? OR customer_code = ? LIMIT 1', [nameToFind, nameToFind]);
        if (Array.isArray(rows) && rows.length > 0) {
          finalCustomerId = rows[0].id;
        } else {
          const code = nameToFind.toUpperCase() === 'UNKNOWN' ? 'UNKNOWN' : `CUST_${Date.now()}`;
          const [ins] = await conn.execute('INSERT INTO customers (customer_code, customer_name, address, contact_number, email, vat_no, svat_no, other) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [code, nameToFind, '', '', '', '', '', 'auto-created']);
          finalCustomerId = ins.insertId;
        }
      } catch (err) {
        console.warn('Failed to resolve/create default customer on update', err);
        finalCustomerId = null;
      }
    }

    try {
      await conn.execute(
        `UPDATE invoices SET invoice_number = ?, date_time = ?, customer_id = ?, customer_name = ?, net_total = ?, total_discount = ?, total_cost = ?, total_profit = ?, cash_payment = ?, card_payment = ?, card_info = ?, user_name = ?, status = ? WHERE id = ?`,
        [
          data.invoiceNumber,
          data.date,
          finalCustomerId,
          data.customerName ?? null,
          data.netTotal ?? 0,
          data.totalDiscount ?? 0,
          data.totalCost ?? 0,
          data.totalProfit ?? 0,
          data.cashPayment ?? 0,
          data.cardPayment ?? 0,
          data.cardInfo ?? '',
          data.userName ?? '',
          data.status ?? 'completed',
          invoiceId
        ]
      );
    } catch (err) {
      await conn.execute(
        `UPDATE invoices SET invoice_number = ?, date_time = ?, customer_id = ?, net_total = ?, total_discount = ?, total_cost = ?, total_profit = ?, cash_payment = ?, card_payment = ?, card_info = ?, user_name = ?, status = ? WHERE id = ?`,
        [
          data.invoiceNumber,
          data.date,
          data.customerId ?? null,
          data.netTotal ?? 0,
          data.totalDiscount ?? 0,
          data.totalCost ?? 0,
          data.totalProfit ?? 0,
          data.cashPayment ?? 0,
          data.cardPayment ?? 0,
          data.cardInfo ?? '',
          data.userName ?? '',
          data.status ?? 'completed',
          invoiceId
        ]
      );
    }

    // Delete existing invoice_items
    await conn.execute('DELETE FROM invoice_items WHERE invoice_id = ?', [invoiceId]);

    // Insert new items and deduct stock
  const insertItemSql = `INSERT INTO invoice_items (invoice_id, item_id, qty, warranty, cost, market_price, selling_price, discount, total_value, other) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    for (const item of data.items || []) {
      const itemId = item.itemId ?? item.item_id ?? null;
      const qty = item.qty ?? 0;
      const warranty = item.warranty ?? '';
      const cost = item.cost ?? null;
      const market_price = item.market_price ?? item.marketPrice ?? null;
      const selling_price = item.selling_price ?? item.sellingPrice ?? item.price ?? null;
      let perUnitDiscount = null;
      if (item.discount != null) perUnitDiscount = Number(item.discount);
      else if (market_price != null && selling_price != null) perUnitDiscount = Number(market_price) - Number(selling_price);
      else perUnitDiscount = 0;
      let total_value = null;
      if (item.total != null) total_value = Number(item.total);
      else if (item.total_value != null) total_value = Number(item.total_value);
      else if (market_price != null) total_value = Number(qty) * Number(market_price);
      else if (selling_price != null) total_value = Number(qty) * Number(selling_price);
      else total_value = null;

      await conn.execute(insertItemSql, [invoiceId, itemId, qty, warranty, cost, market_price, selling_price, perUnitDiscount, total_value, item.other ?? '']);

      if (itemId) {
        // Deduct stock
        await conn.execute('UPDATE items SET qty = GREATEST(qty - ?, 0) WHERE id = ?', [Number(qty), itemId]);
      }
    }

    await conn.commit();
    conn.release();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    try { await conn.rollback(); } catch (e) {}
    try { conn.release(); } catch (e) {}
    console.error('update invoice err', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
