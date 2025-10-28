export async function DELETE(req) {
	try {
		const { id } = await req.json();
		if (!id) {
			return new Response(JSON.stringify({ success: false, error: 'Missing id' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}
		const pool = await getDbConnection();
		const [result] = await pool.query('DELETE FROM item_expired_date WHERE id = ?', [id]);
		if (result.affectedRows === 0) {
			return new Response(JSON.stringify({ success: false, error: 'Item not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			});
		}
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err) {
		return new Response(JSON.stringify({ success: false, error: err.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}
import { getDbConnection } from '../../../db';

export async function GET(req) {
	try {
		const pool = await getDbConnection();
		const [rows] = await pool.query('SELECT id, item_id, expired_date, item_name FROM item_expired_date');
		return new Response(JSON.stringify({ success: true, data: rows }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (err) {
		return new Response(JSON.stringify({ success: false, error: err.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}
