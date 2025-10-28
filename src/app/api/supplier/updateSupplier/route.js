import { getDbConnection } from "../../../db";

export async function POST(request) {
  const { id, name, address, supplier_code, contact_number, email, remark } = await request.json();

  if (!id || !name || !address || !supplier_code || !contact_number || !email) {
    return new Response(JSON.stringify({ success: false, error: "All supplier fields are required except remark." }), { status: 400 });
  }

  const db = await getDbConnection();
  try {
    await db.execute(
      "UPDATE suppliers SET name = ?, address = ?, supplier_code = ?, contact_number = ?, email = ?, remark = ? WHERE id = ?",
      [name, address, supplier_code, contact_number, email, remark || '', id]
    );
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
