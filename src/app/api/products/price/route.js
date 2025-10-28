// Trigger reload for Next.js route hot-reload (2025-10-09)
import { getDbConnection } from '@/app/db';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });


export async function GET(request) {
  const db = await getDbConnection();
  try {
    const url = new URL(request.url);
    const itemId = url.searchParams.get('item_id');

    if (itemId) {
      const [rows] = await db.query(
        'SELECT p.*, i.item_name, i.item_barcode FROM price p LEFT JOIN items i ON i.id = p.item_id WHERE p.item_id = ? ORDER BY p.id DESC',
        [itemId]
      );
      return json({ success: true, prices: rows });
    }

    const [rows] = await db.query(
      'SELECT p.*, i.item_name, i.item_barcode FROM price p LEFT JOIN items i ON i.id = p.item_id ORDER BY p.id DESC'
    );
    return json({ success: true, prices: rows });
  } catch (err) {
    console.error('GET /api/products/price error:', err);
    return json({ success: false, error: err.message }, 500);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      id, // price id for update
      item_id,
      per_item_cost = null,
      selling_price = null,
      market_price = null,
      wholesale_price = null,
      retail_price = null,
      user_name = null,
      other = null
    } = body;

    if (!item_id) return json({ success: false, error: 'item_id is required' }, 400);

    const db = await getDbConnection();

    if (id) {
      // update by price id
      const updateSql = `UPDATE price SET per_item_cost = ?, selling_price = ?, market_price = ?, wholesale_price = ?, retail_price = ?, user_name = ?, other = ? WHERE id = ?`;
      const params = [
        per_item_cost === null ? null : per_item_cost,
        selling_price === null ? null : selling_price,
        market_price === null ? null : market_price,
        wholesale_price === null ? null : wholesale_price,
        retail_price === null ? null : retail_price,
        user_name,
        other,
        id
      ];
      const [result] = await db.execute(updateSql, params);
      if (result.affectedRows > 0) {
        return json({ success: true, message: 'Price updated' });
      } else {
        return json({ success: false, error: 'Price not found for update' }, 404);
      }
    } else {
      // insert new price row
      const insertSql = `INSERT INTO price (item_id, per_item_cost, selling_price, market_price, wholesale_price, retail_price, user_name, other) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [
        item_id,
        per_item_cost === null ? null : per_item_cost,
        selling_price === null ? null : selling_price,
        market_price === null ? null : market_price,
        wholesale_price === null ? null : wholesale_price,
        retail_price === null ? null : retail_price,
        user_name,
        other
      ];
      const [result] = await db.execute(insertSql, params);
      return json({ success: true, message: 'Price inserted', insertId: result.insertId });
    }
  } catch (err) {
    console.error('POST /api/products/price error:', err);
    return json({ success: false, error: err.message }, 500);
  }
}

export async function DELETE(request) {
  try {
    // Prefer id from query string (safer for DELETE requests); fallback to JSON body
    const url = new URL(request.url);
    let id = url.searchParams.get('id');
    if (!id) {
      const body = await request.json();
      id = body?.id;
    }
    if (!id) return json({ success: false, error: 'id is required' }, 400);
    const db = await getDbConnection();
    const [result] = await db.execute('DELETE FROM price WHERE id = ?', [id]);
    if (result.affectedRows > 0) {
      return json({ success: true, message: 'Price deleted' });
    }
    return json({ success: false, error: 'Price not found' }, 404);
  } catch (err) {
    console.error('DELETE /api/products/price error:', err);
    return json({ success: false, error: err.message }, 500);
  }
}