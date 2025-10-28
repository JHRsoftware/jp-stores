import { getDbConnection } from '@/app/db';

// Helper: simple JSON response
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export async function PUT(request) {
  const {
    id,
    item_barcode,
    item_name,
    item_description,
    category,
    qty,
    qty_type,
    total_cost,
    warranty,
    per_item_cost,
    selling_price,
    market_price,
    wholesale_price,
    retail_price,
    user_name,
    other,
    expired_date
  } = await request.json();

  if (!id || !item_barcode || !item_name || !category || !qty || !qty_type || !total_cost || !user_name) {
    return json({ success: false, error: 'Required fields missing.' }, 400);
  }

  const db = await getDbConnection();
  try {
    const updateSql = `
      UPDATE items SET
        item_barcode = ?,
        item_name = ?,
        item_description = ?,
        category = ?,
        qty = ?,
        qty_type = ?,
        total_cost = ?,
        warranty = ?,
        user_name = ?,
        other = ?
      WHERE id = ?`;
    const updateParams = [item_barcode, item_name, item_description || '', category, qty, qty_type, total_cost, warranty || '', user_name, other || '', id];
    await db.execute(updateSql, updateParams);

    // Upsert price row (non-fatal)
    try {
      const priceUpsertSql = 'INSERT INTO price (item_id, per_item_cost, selling_price, market_price, wholesale_price, retail_price, user_name, other) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE per_item_cost = VALUES(per_item_cost), selling_price = VALUES(selling_price), market_price = VALUES(market_price), wholesale_price = VALUES(wholesale_price), retail_price = VALUES(retail_price), user_name = VALUES(user_name), other = VALUES(other)';
      const priceParams = [id, per_item_cost || null, selling_price || null, market_price || null, wholesale_price || null, retail_price || null, user_name || null, other || null];
      await db.execute(priceUpsertSql, priceParams);
    } catch (err) {
      console.error('price upsert failed:', err);
    }

    // Upsert expired date (non-fatal)
    if (expired_date) {
      try {
        const expiredUpsertSql = 'INSERT INTO item_expired_date (item_id, expired_date, item_name) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE expired_date = VALUES(expired_date), item_name = VALUES(item_name)';
        const expiredParams = [id, expired_date, item_name || null];
        await db.execute(expiredUpsertSql, expiredParams);
      } catch (err) {
        console.error('expired upsert failed:', err);
      }
    }

    return json({ success: true });
  } catch (error) {
    console.error('PUT /api/products/item error:', error);
    return json({ success: false, error: error.message }, 500);
  }
}

export async function POST(request) {
  const {
    item_barcode,
    item_name,
    item_description,
    category,
    qty,
    qty_type,
    total_cost,
    warranty,
    per_item_cost,
    selling_price,
    market_price,
    wholesale_price,
    retail_price,
    user_name,
    other,
    expired_date
  } = await request.json();

  if (!item_barcode || !item_name || !category || !qty || !qty_type || !total_cost || !user_name) {
    return json({ success: false, error: 'Required fields missing.' }, 400);
  }

  const db = await getDbConnection();
  try {
    const [existing] = await db.query('SELECT id, item_name FROM items WHERE item_barcode = ?', [item_barcode]);
    if (existing.length > 0) {
      return json({ success: false, error: `Barcode already exists for item: ${existing[0].item_name}` }, 400);
    }

    const insertSql = 'INSERT INTO items (item_barcode, item_name, item_description, category, qty, qty_type, total_cost, warranty, user_name, other) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const insertParams = [item_barcode, item_name, item_description || '', category, qty, qty_type, total_cost, warranty || '', user_name || '', other || ''];
    const [result] = await db.execute(insertSql, insertParams);
    const itemId = result.insertId;

    // Insert price row (non-fatal)
    try {
      const priceInsertSql = 'INSERT INTO price (item_id, per_item_cost, selling_price, market_price, wholesale_price, retail_price, user_name, other) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      const priceParams = [itemId, per_item_cost || null, selling_price || null, market_price || null, wholesale_price || null, retail_price || null, user_name || null, other || null];
      await db.execute(priceInsertSql, priceParams);
    } catch (err) {
      console.error('price insert failed:', err);
    }

    // Insert expired date (non-fatal)
    if (expired_date) {
      try {
        const expiredInsertSql = 'INSERT INTO item_expired_date (item_id, expired_date, item_name) VALUES (?, ?, ?)';
        const expiredParams = [itemId, expired_date, item_name || null];
        await db.execute(expiredInsertSql, expiredParams);
      } catch (err) {
        console.error('expired insert failed:', err);
      }
    }

    return json({ success: true });
  } catch (error) {
    console.error('POST /api/products/item error:', error);
    return json({ success: false, error: error.message }, 500);
  }
}

export async function GET(request) {
  const db = await getDbConnection();
  try {
    const url = new URL(request.url);
    const itemId = url.searchParams.get('item_id') || url.searchParams.get('id');
    if (itemId) {
      const [rows] = await db.query(
        `SELECT id, item_barcode, item_name, item_description, category, qty, qty_type, total_cost, warranty, user_name, other
         FROM items
         WHERE id = ? LIMIT 1`,
        [itemId]
      );
      if (rows.length === 0) return json({ success: false, error: 'Item not found' }, 404);
      return json({ success: true, item: rows[0] });
    }

    const [rows] = await db.query(
      `SELECT id, item_barcode, item_name, item_description, category, qty, qty_type, total_cost, warranty, user_name, other
       FROM items
       ORDER BY id DESC`
    );
    return json({ success: true, items: rows });
  } catch (error) {
    console.error('GET /api/products/item error:', error);
    return json({ success: false, error: error.message, stack: error.stack }, 500);
  }
}
