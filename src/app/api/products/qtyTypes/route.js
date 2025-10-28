import { getDbConnection } from '@/app/db';

export async function POST(request) {
  const { name, description } = await request.json();
  if (!name) {
    return new Response(JSON.stringify({ success: false, error: 'Name is required.' }), { status: 400 });
  }
  const db = await getDbConnection();
  try {
    await db.execute(
      'INSERT INTO qty_types (name, description) VALUES (?, ?)',
      [name, description || '']
    );
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}

export async function GET() {
  const db = await getDbConnection();
  try {
    const [rows] = await db.query('SELECT id, name, description FROM qty_types ORDER BY id DESC');
    return new Response(JSON.stringify({ success: true, qtyTypes: rows }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}

export async function PUT(request) {
  const { id, name, description } = await request.json();
  if (!id || !name) {
    return new Response(JSON.stringify({ success: false, error: 'ID and name are required.' }), { status: 400 });
  }
  const db = await getDbConnection();
  try {
    await db.execute(
      'UPDATE qty_types SET name = ?, description = ? WHERE id = ?',
      [name, description || '', id]
    );
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}

export async function DELETE(request) {
  const { id } = await request.json();
  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'ID is required.' }), { status: 400 });
  }
  const db = await getDbConnection();
  try {
    await db.execute('DELETE FROM qty_types WHERE id = ?', [id]);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
