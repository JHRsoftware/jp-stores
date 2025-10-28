
import { getDbConnection } from '@/app/db';

export async function POST(request) {
  const { username, password, accessPages } = await request.json();

  // Validation: username and password required
  if (!username || !password) {
    return new Response(JSON.stringify({ success: false, error: 'Username and password are required.' }), { status: 400 });
  }

  const connection = await getDbConnection();

  try {
    // Insert user
    await connection.execute(
      'INSERT INTO users (username, password, access_pages) VALUES (?, ?, ?)',
      [username, password, accessPages.join(',')]
    );
    await connection.end();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    await connection.end();
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
