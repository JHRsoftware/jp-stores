import { getDbConnection } from '../../../db';

export async function POST(request) {
  const { username } = await request.json();

  const db = await getDbConnection();

  try {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    if (rows.length > 0) {
      return new Response(
        JSON.stringify({ success: true, user: {
          username: rows[0].username,
          password: rows[0].password,
          accessPages: rows[0].access_pages ? rows[0].access_pages.split(',') : []
        }}),
        { status: 200 }
      );
    } else {
      return new Response(JSON.stringify({ success: false }), { status: 404 });
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
