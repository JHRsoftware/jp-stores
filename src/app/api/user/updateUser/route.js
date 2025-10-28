import { getDbConnection } from '../../../db';

export async function POST(request) {
  const { username, password, accessPages } = await request.json();

  const db = await getDbConnection();

  try {
    const [result] = await db.execute(
      'UPDATE users SET password = ?, access_pages = ? WHERE username = ?',
      [password, Array.isArray(accessPages) ? accessPages.join(',') : accessPages || '', username]
    );
    if (result.affectedRows > 0) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ success: false }), { status: 404 });
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
