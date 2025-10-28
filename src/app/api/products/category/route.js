export async function PUT(request) {
  const { id, category_name } = await request.json();
  if (!id || !category_name) {
    return new Response(JSON.stringify({ success: false, error: 'ID and category name are required.' }), { status: 400 });
  }
  const db = await getDbConnection();
  try {
    await db.execute('UPDATE categories SET category_name = ? WHERE id = ?', [category_name, id]);
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
    await db.execute('DELETE FROM categories WHERE id = ?', [id]);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
import { getDbConnection } from '@/app/db';

export async function POST(request) {
  const { category_name } = await request.json();
  if (!category_name) {
    return new Response(JSON.stringify({ success: false, error: 'Category name is required.' }), { status: 400 });
  }
  const db = await getDbConnection();
  try {
    await db.execute('INSERT INTO categories (category_name) VALUES (?)', [category_name]);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}

export async function GET() {
  const db = await getDbConnection();
  try {
    const [rows] = await db.query('SELECT id, category_name FROM categories ORDER BY id DESC');
    return new Response(JSON.stringify({ success: true, categories: rows }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
