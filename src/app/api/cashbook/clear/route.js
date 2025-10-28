
import { getDbConnection } from '../../../db.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body || {};
    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, error: 'Missing username or password' }), { status: 400 });
    }
    const db = await getDbConnection();
    // Verify user password
    const [userRows] = await db.query('SELECT password FROM users WHERE username = ?', [username]);
    if (!userRows || userRows.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid user' }), { status: 401 });
    }
    const dbPassword = userRows[0].password || '';
    if (String(dbPassword) !== String(password)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid password' }), { status: 401 });
    }
    // Delete cashbook entries for this user (case-insensitive)
    const [delResult] = await db.query('DELETE FROM cashbook WHERE LOWER(TRIM(user)) = LOWER(TRIM(?))', [username]);
    // Fetch all remaining rows and totals
    const [rows] = await db.query('SELECT * FROM cashbook ORDER BY id ASC');
    const totals = rows.reduce((acc, row) => {
      acc.cash += Number(row.cash || 0);
      acc.bank += Number(row.bank || 0);
      return acc;
    }, { cash: 0, bank: 0 });
    const removed = delResult.affectedRows || 0;
    if (removed === 0) {
      return new Response(JSON.stringify({ success: true, removed: 0, message: 'No transactions found for this user', remaining: rows.length, data: rows, totals }), { status: 200 });
    }
    return new Response(JSON.stringify({ success: true, removed, remaining: rows.length, data: rows, totals }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500 });
  }
}

export const runtime = 'nodejs';
