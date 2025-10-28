
import { getDbConnection } from '@/app/db';

export async function POST(request) {
  const { name, address, created_by, supplier_code, contact_number, email, remark } = await request.json();

  // Validation
  if (!name) {
    return new Response(JSON.stringify({ success: false, error: "Supplier name is required." }), { status: 400 });
  }

  const db = await getDbConnection();
  try {
    await db.execute(
      "INSERT INTO suppliers (name, address, created_by, supplier_code, contact_number, email, remark) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, address, created_by, supplier_code, contact_number, email, remark || '']
    );
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
