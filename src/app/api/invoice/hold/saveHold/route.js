import { getDbConnection } from '../../../../db';

export async function POST(request) {
  const data = await request.json();
  // expected: invoiceNumber, date, customerId, netTotal, totalDiscount, totalCost, totalProfit, cashPayment, cardPayment, cardInfo, userName, remark, items[]
  if (!data || !Array.isArray(data.items)) return new Response(JSON.stringify({ success: false, error: 'Invalid payload' }), { status: 400 });
  const db = await getDbConnection();
  try {
    const [res] = await db.execute('INSERT INTO invoice_hold (invoice_number, date_time, customer_id, net_total, total_discount, total_cost, total_profit, cash_payment, card_payment, card_info, user_name, remark, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
      data.invoiceNumber || null,
      data.date || null,
      data.customerId || null,
      data.netTotal || 0,
      data.totalDiscount || 0,
      data.totalCost || 0,
      data.totalProfit || 0,
      data.cashPayment || 0,
      data.cardPayment || 0,
      data.cardInfo || null,
      data.userName || null,
      data.remark || null,
      'hold'
    ]);
    const holdId = res.insertId;
    const insertItemSql = 'INSERT INTO invoice_hold_items (hold_id, item_id, item_name, barcode, qty, warranty, cost, market_price, selling_price, discount, total_value, other) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    for (const it of data.items) {
      await db.execute(insertItemSql, [holdId, it.itemId ?? null, it.itemName ?? null, it.barcode ?? null, it.qty ?? 0, it.warranty ?? null, it.cost ?? null, it.market_price ?? it.orig_market_price ?? null, it.selling_price ?? it.price ?? null, it.discount ?? 0, it.total ?? it.total_value ?? null, it.other ?? null]);
    }
    return new Response(JSON.stringify({ success: true, holdId }), { status: 200 });
  } catch (err) {
    console.error('saveHold error', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
