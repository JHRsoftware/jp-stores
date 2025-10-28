import { getDbConnection } from '../../db';

// Return latest shop (used by header/print), keep backward compatible
export async function GET(request) {
  try {
    const pool = await getDbConnection();
    const conn = await pool.getConnection();
    try {
      const url = request?.url ? new URL(request.url) : null;
      const all = url ? url.searchParams.get('all') : null;
      if (all === '1' || all === 'true') {
        // return all shops for admin listing
        const [rows] = await conn.query('SELECT * FROM shop ORDER BY id DESC');
        conn.release();
        return new Response(JSON.stringify({ success: true, shops: rows }), { status: 200, headers: { 'content-type': 'application/json' } });
      }

      const [rows] = await conn.query('SELECT * FROM shop ORDER BY id DESC LIMIT 1');
      conn.release();
      const shop = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
      return new Response(JSON.stringify({ success: true, shop }), { status: 200, headers: { 'content-type': 'application/json' } });
    } catch (err) {
      try { conn.release(); } catch (e) {}
      console.error('GET /api/shop query error', err);
      return new Response(JSON.stringify({ success: false, error: 'Query error' }), { status: 500, headers: { 'content-type': 'application/json' } });
    }
  } catch (err) {
    console.error('GET /api/shop error', err);
    return new Response(JSON.stringify({ success: false, error: 'DB connection error' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}

// Create a new shop record
export async function POST(request) {
  try {
    const body = await request.json();
  const { name, address, contact_number, logo_url, footer, developer_note, hide_sell_price, hide_total_discount } = body;

    if (!name) {
      return new Response(JSON.stringify({ success: false, error: 'Name is required' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    const pool = await getDbConnection();
    const conn = await pool.getConnection();
    try {
      // Prevent multiple shops: if a shop already exists, disallow new inserts
      const [existing] = await conn.query('SELECT COUNT(*) as cnt FROM shop');
      const count = Array.isArray(existing) && existing[0] ? existing[0].cnt : (existing?.cnt || 0);
      if (count > 0) {
        conn.release();
        return new Response(JSON.stringify({ success: false, error: 'A shop already exists. Update the existing shop instead.' }), { status: 409, headers: { 'content-type': 'application/json' } });
      }
  const sql = `INSERT INTO shop (name, address, contact_number, logo_url, footer, developer_note, hide_sell_price, hide_total_discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [name || '', address || '', contact_number || '', logo_url || '', footer || '', developer_note || '', hide_sell_price ? 1 : 0, hide_total_discount ? 1 : 0];
  const [result] = await conn.execute(sql, params);
  // fetch the inserted row so client can refresh immediately
  const [rows] = await conn.query('SELECT * FROM shop WHERE id = ? LIMIT 1', [result.insertId]);
  conn.release();
  const shop = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  return new Response(JSON.stringify({ success: true, insertId: result.insertId, shop }), { status: 201, headers: { 'content-type': 'application/json' } });
    } catch (err) {
      try { conn.release(); } catch (e) {}
      console.error('POST /api/shop query error', err);
      return new Response(JSON.stringify({ success: false, error: 'Insert error' }), { status: 500, headers: { 'content-type': 'application/json' } });
    }
  } catch (err) {
    console.error('POST /api/shop error', err);
    return new Response(JSON.stringify({ success: false, error: 'Bad request' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
}

// Update an existing shop by id (id must be in JSON body)
export async function PUT(request) {
  try {
  const body = await request.json();
  const { id, name, address, contact_number, logo_url, footer, developer_note, hide_sell_price, hide_total_discount } = body;
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'ID is required' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    const pool = await getDbConnection();
    const conn = await pool.getConnection();
    try {
  const sql = `UPDATE shop SET name = ?, address = ?, contact_number = ?, logo_url = ?, footer = ?, developer_note = ?, hide_sell_price = ?, hide_total_discount = ? WHERE id = ?`;
  const params = [name || '', address || '', contact_number || '', logo_url || '', footer || '', developer_note || '', hide_sell_price ? 1 : 0, hide_total_discount ? 1 : 0, id];
  await conn.execute(sql, params);
  // return the updated row to the client
  const [rows] = await conn.query('SELECT * FROM shop WHERE id = ? LIMIT 1', [id]);
  conn.release();
  const shop = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  return new Response(JSON.stringify({ success: true, shop }), { status: 200, headers: { 'content-type': 'application/json' } });
    } catch (err) {
      try { conn.release(); } catch (e) {}
      console.error('PUT /api/shop query error', err);
      return new Response(JSON.stringify({ success: false, error: 'Update error' }), { status: 500, headers: { 'content-type': 'application/json' } });
    }
  } catch (err) {
    console.error('PUT /api/shop error', err);
    return new Response(JSON.stringify({ success: false, error: 'Bad request' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
}

// Delete shop by id provided in JSON body
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'ID is required' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    const pool = await getDbConnection();
    const conn = await pool.getConnection();
    try {
      await conn.execute('DELETE FROM shop WHERE id = ?', [id]);
      conn.release();
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'content-type': 'application/json' } });
    } catch (err) {
      try { conn.release(); } catch (e) {}
      console.error('DELETE /api/shop query error', err);
      return new Response(JSON.stringify({ success: false, error: 'Delete error' }), { status: 500, headers: { 'content-type': 'application/json' } });
    }
  } catch (err) {
    console.error('DELETE /api/shop error', err);
    return new Response(JSON.stringify({ success: false, error: 'Bad request' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
}
