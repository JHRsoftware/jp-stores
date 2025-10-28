import { getDbConnection } from '@/app/db';

// POST: Create a new invoice and invoice_items (transactional)
export async function POST(request) {
  const data = await request.json();

  // Basic validation - invoiceNumber and customerId are optional
  if (!data || !data.date || !Array.isArray(data.items) || data.items.length === 0) {
    return new Response(JSON.stringify({ success: false, error: 'Missing required fields (date, items).' }), { status: 400 });
  }

  const pool = await getDbConnection();
  const conn = await pool.getConnection();
  const updatedItemIds = []; // Track item IDs that get stock updates
  try {
    await conn.beginTransaction();

    // Resolve customer: if no customerId provided, try to find/create a default 'Unknown' (or use provided customerName)
    let finalCustomerId = data.customerId ?? null;
    if (!finalCustomerId) {
      const nameToFind = (data.customerName || 'Unknown');
      try {
        const [rows] = await conn.query('SELECT id FROM customers WHERE customer_name = ? OR customer_code = ? LIMIT 1', [nameToFind, nameToFind]);
        if (Array.isArray(rows) && rows.length > 0) {
          finalCustomerId = rows[0].id;
        } else {
          // create a simple code; ensure it is short and unique-ish
          const code = nameToFind.toUpperCase() === 'UNKNOWN' ? 'UNKNOWN' : `CUST_${Date.now()}`;
          const [ins] = await conn.execute('INSERT INTO customers (customer_code, customer_name, address, contact_number, email, vat_no, svat_no, other) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [code, nameToFind, '', '', '', '', '', 'auto-created']);
          finalCustomerId = ins.insertId;
        }
      } catch (err) {
        // If anything goes wrong, leave finalCustomerId null and proceed (invoice will have NULL customer)
        console.warn('Failed to resolve/create default customer', err);
        finalCustomerId = null;
      }
    }

    // Insert invoice with all requested fields. Prefer to store customer name if provided
    let invoiceResult;
    try {
      // Try with customer_name column (if DB migrated)
      [invoiceResult] = await conn.execute(
        `INSERT INTO invoices
          (invoice_number, date_time, customer_id, customer_name, net_total, total_discount, total_cost, total_profit, cash_payment, card_payment, card_info, user_name, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.invoiceNumber,
          data.date, // should be ISO datetime string
    finalCustomerId,
    data.customerName ?? null,
          data.netTotal ?? 0,
          data.totalDiscount ?? 0,
          data.totalCost ?? 0,
          data.totalProfit ?? 0,
          data.cashPayment ?? 0,
          data.cardPayment ?? 0,
          data.cardInfo ?? data.cardNumberBankType ?? '',
          data.userName ?? '',
          data.status ?? 'draft'
        ]
      );
    } catch (err) {
      // Fallback for schemas that don't have customer_name
      [invoiceResult] = await conn.execute(
        `INSERT INTO invoices
          (invoice_number, date_time, customer_id, net_total, total_discount, total_cost, total_profit, cash_payment, card_payment, card_info, user_name, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.invoiceNumber,
          data.date, // should be ISO datetime string
          data.customerId ?? null,
          data.netTotal ?? 0,
          data.totalDiscount ?? 0,
          data.totalCost ?? 0,
          data.totalProfit ?? 0,
          data.cashPayment ?? 0,
          data.cardPayment ?? 0,
          data.cardInfo ?? data.cardNumberBankType ?? '',
          data.userName ?? '',
          data.status ?? 'draft'
        ]
      );
    }

    const invoiceId = invoiceResult.insertId;

    // Insert invoice items
    const insertItemSql = `
      INSERT INTO invoice_items
        (invoice_id, item_id, qty, warranty, cost, market_price, selling_price, discount, total_value, other)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    for (const item of data.items) {
      // normalize item fields (support both camel and snake cases)
      const itemId = item.itemId ?? item.item_id ?? null;
      const qty = item.qty ?? item.quantity ?? 0;
      const warranty = item.warranty ?? '';
      const cost = item.cost ?? null;
      const market_price = item.market_price ?? item.marketPrice ?? null;
      const selling_price = item.selling_price ?? item.sellingPrice ?? item.price ?? null;
      // Determine per-unit discount: prefer provided item.discount, otherwise compute
      // from market_price - selling_price when both are available.
      let perUnitDiscount = null;
      if (item.discount != null) perUnitDiscount = Number(item.discount);
      else if (market_price != null && selling_price != null) {
        perUnitDiscount = Number(market_price) - Number(selling_price);
      } else {
        perUnitDiscount = 0;
      }

      // Determine total value for the line: prefer provided total, otherwise use qty * market_price (if available)
      let total_value = null;
      if (item.total != null) total_value = Number(item.total);
      else if (item.total_value != null) total_value = Number(item.total_value);
      else if (market_price != null) total_value = Number(qty) * Number(market_price);
      else if (selling_price != null) total_value = Number(qty) * Number(selling_price);
      else total_value = null;
      const other = item.other ?? '';

      await conn.execute(insertItemSql, [
        invoiceId,
        itemId,
        qty,
        warranty,
        cost,
        market_price,
        selling_price,
        perUnitDiscount,
        total_value,
        other
      ]);

      // Decrease stock in items table for this item (if itemId present)
      try {
        if (itemId) {
          // Use GREATEST to avoid negative quantities
          await conn.execute('UPDATE items SET qty = GREATEST(qty - ?, 0) WHERE id = ?', [Number(qty), itemId]);
          // track updated item ids to return fresh rows later
          updatedItemIds.push(itemId);
        }
      } catch (err) {
        // Non-fatal for stock update but log for debugging; do not abort transaction here
        console.error('Failed to update stock for item', itemId, err);
      }
    }

    // After processing all items, fetch the latest item rows for the updated IDs
    let updatedItems = [];
    try {
      if (updatedItemIds.length > 0) {
        // Use a single SELECT with IN (...) to return updated rows (only columns that exist in items table)
        const placeholders = updatedItemIds.map(() => '?').join(',');
        const [rows] = await conn.query(`SELECT id, item_name, item_barcode, qty, qty_type, warranty, item_description, category, total_cost, user_name, other FROM items WHERE id IN (${placeholders})`, updatedItemIds);
        updatedItems = Array.isArray(rows) ? rows : [];
      }
    } catch (err) {
      console.error('Failed to fetch updated item rows', err);
      // don't fail the whole invoice save because of this fetch; continue
      updatedItems = [];
    }

    await conn.commit();
    conn.release();

    return new Response(JSON.stringify({ success: true, invoiceId, updatedItems }), { status: 200 });
  } catch (error) {
    try { await conn.rollback(); } catch (e) {}
    try { conn.release(); } catch (e) {}
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
