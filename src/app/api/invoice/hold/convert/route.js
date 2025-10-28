import { getDbConnection } from '../../../../db';

// Convert a hold into a real invoice: insert into invoices/invoice_items, decrement stock, delete hold
export async function POST(request) {
  const data = await request.json();
  // data: { holdId, invoiceNumber (optional override), userName }
  if (!data || !data.holdId) return new Response(JSON.stringify({ success: false, error: 'Missing holdId' }), { status: 400 });
  const pool = await getDbConnection();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // load hold
    const [[holdRows]] = await conn.query('SELECT * FROM invoice_hold WHERE id = ?', [data.holdId]);
    const hold = Array.isArray(holdRows) ? holdRows : holdRows; // defensive, but handle below
    const [holdItems] = await conn.query('SELECT * FROM invoice_hold_items WHERE hold_id = ?', [data.holdId]);
    // Resolve/create default customer if needed
    let finalCustomerId = hold.customer_id ?? null;
    if (!finalCustomerId) {
      const nameToFind = data.customerName || hold.customer_name || 'Unknown';
      try {
        const [rows] = await conn.query('SELECT id FROM customers WHERE customer_name = ? OR customer_code = ? LIMIT 1', [nameToFind, nameToFind]);
        if (Array.isArray(rows) && rows.length > 0) finalCustomerId = rows[0].id;
        else {
          const code = nameToFind.toUpperCase() === 'UNKNOWN' ? 'UNKNOWN' : `CUST_${Date.now()}`;
          const [ins] = await conn.execute('INSERT INTO customers (customer_code, customer_name, address, contact_number, email, vat_no, svat_no, other) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [code, nameToFind, '', '', '', '', '', 'auto-created']);
          finalCustomerId = ins.insertId;
        }
      } catch (err) {
        console.warn('Failed to resolve/create customer during hold convert', err);
        finalCustomerId = null;
      }
    }

    // Insert invoice (try to include customer_name if schema supports it)
    let invRes;
    try {
      [invRes] = await conn.execute('INSERT INTO invoices (invoice_number, date_time, customer_id, customer_name, net_total, total_discount, total_cost, total_profit, cash_payment, card_payment, card_info, user_name, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
        data.invoiceNumber || hold.invoice_number || null,
        hold.date_time || null,
        finalCustomerId,
        data.customerName || hold.customer_name || null,
        hold.net_total || 0,
        hold.total_discount || 0,
        hold.total_cost || 0,
        hold.total_profit || 0,
        hold.cash_payment || 0,
        hold.card_payment || 0,
        hold.card_info || null,
        data.userName || hold.user_name || null,
        'completed'
      ]);
    } catch (err) {
      [invRes] = await conn.execute('INSERT INTO invoices (invoice_number, date_time, customer_id, net_total, total_discount, total_cost, total_profit, cash_payment, card_payment, card_info, user_name, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
        data.invoiceNumber || hold.invoice_number || null,
        hold.date_time || null,
        finalCustomerId,
        hold.net_total || 0,
        hold.total_discount || 0,
        hold.total_cost || 0,
        hold.total_profit || 0,
        hold.cash_payment || 0,
        hold.card_payment || 0,
        hold.card_info || null,
        data.userName || hold.user_name || null,
        'completed'
      ]);
    }
    const invoiceId = invRes.insertId;
  const insertInvoiceItemSql = 'INSERT INTO invoice_items (invoice_id, item_id, qty, warranty, cost, market_price, selling_price, discount, total_value, other) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    for (const it of holdItems) {
      await conn.execute(insertInvoiceItemSql, [invoiceId, it.item_id ?? null, it.qty ?? 0, it.warranty ?? null, it.cost ?? null, it.market_price ?? null, it.selling_price ?? null, it.discount ?? 0, it.total_value ?? null, it.other ?? null]);
      if (it.item_id) await conn.execute('UPDATE items SET qty = GREATEST(qty - ?, 0) WHERE id = ?', [Number(it.qty), it.item_id]);
    }
    // delete hold
    await conn.execute('DELETE FROM invoice_hold_items WHERE hold_id = ?', [data.holdId]);
    await conn.execute('DELETE FROM invoice_hold WHERE id = ?', [data.holdId]);
    await conn.commit();
    conn.release();
    return new Response(JSON.stringify({ success: true, invoiceId }), { status: 200 });
  } catch (err) {
    try { await conn.rollback(); } catch (e) {}
    try { conn.release(); } catch (e) {}
    console.error('convert hold err', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
