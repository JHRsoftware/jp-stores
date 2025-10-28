import { getDbConnection } from "../../../db";

export async function POST(request) {
  const { id } = await request.json();

  if (!id) {
    return new Response(JSON.stringify({ success: false, error: "Supplier id is required." }), { status: 400 });
  }

  const db = await getDbConnection();
  try {
    const [result] = await db.execute("DELETE FROM suppliers WHERE id = ?", [id]);
    // For mysql2, result.affectedRows; for sqlite, result.changes
    const affected = result.affectedRows !== undefined ? result.affectedRows : result.changes;
    if (affected > 0) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ success: false, error: "Supplier not found or already deleted." }), { status: 404 });
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
