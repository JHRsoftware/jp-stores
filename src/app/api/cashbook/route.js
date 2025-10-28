import { getDbConnection } from '../../db.js';

export async function GET() {
  try {
    const db = await getDbConnection();
    const [rows] = await db.query('SELECT * FROM cashbook ORDER BY id ASC');
    // compute balances
    const totals = rows.reduce((acc, row) => {
      acc.cash += Number(row.cash || 0);
      acc.bank += Number(row.bank || 0);
      return acc;
    }, { cash: 0, bank: 0 });
    return new Response(JSON.stringify({ success: true, data: rows, totals }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500 });
  }
}


export async function POST(request) {
  try {
    const body = await request.json();
    const db = await getDbConnection();
    // Insert new entry
    const entry = {
      date: body.date || new Date().toISOString().slice(0, 10),
      remark: body.remark || '',
      other: body.other || '',
      cash: Number(body.cash || 0),
      bank: Number(body.bank || 0),
      user: body.user || 'system',
    };
    const [result] = await db.query(
      'INSERT INTO cashbook (date, remark, other, cash, bank, user) VALUES (?, ?, ?, ?, ?, ?)',
      [entry.date, entry.remark, entry.other, entry.cash, entry.bank, entry.user]
    );
    // Fetch all rows after insert
    const [rows] = await db.query('SELECT * FROM cashbook ORDER BY id ASC');
    const totals = rows.reduce((acc, row) => {
      acc.cash += Number(row.cash || 0);
      acc.bank += Number(row.bank || 0);
      return acc;
    }, { cash: 0, bank: 0 });
    return new Response(JSON.stringify({ success: true, data: rows, totals }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500 });
  }
}

export const runtime = 'nodejs';
