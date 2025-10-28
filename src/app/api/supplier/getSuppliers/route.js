import { getDbConnection } from "../../../db";

export async function GET() {
  const db = await getDbConnection();
  try {
  const [rows] = await db.query("SELECT id, name, address, created_by, supplier_code, contact_number, email, remark FROM suppliers ORDER BY id DESC");
    return new Response(JSON.stringify({ success: true, suppliers: rows }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
