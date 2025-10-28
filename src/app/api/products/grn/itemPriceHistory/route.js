import { getDbConnection } from '@/app/db';

export async function GET(request) {
  const db = await getDbConnection();
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('item_id');
  
  if (!itemId) {
    return new Response(JSON.stringify({ success: false, error: 'item_id is required' }), { status: 400 });
  }
  
  // Add cache-busting headers to ensure fresh data
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
  
  try {
    // Query to get the latest 3 GRN prices for the item, ordered by GRN ID descending (latest first)
    const [priceHistory] = await db.query(`
      SELECT 
        gi.id as grn_item_id,
        gi.cost,
        gi.qty,
        gi.other,
        g.grn_number,
        g.date as grn_date,
        g.invoice_number,
        s.name as supplier_name,
        s.supplier_code,
        ied.expired_date
      FROM grn_items gi
      JOIN grn g ON gi.grn_id = g.id
      JOIN suppliers s ON g.supplier_id = s.id
      LEFT JOIN item_expired_date ied ON gi.item_id = ied.item_id
      WHERE gi.item_id = ?
      ORDER BY gi.id DESC
      LIMIT 3
    `, [itemId]);
    
    return new Response(JSON.stringify({ 
      success: true, 
      priceHistory: priceHistory,
      timestamp: new Date().toISOString() // Add timestamp to verify fresh data
    }), { 
      status: 200,
      headers: headers 
    });
    
  } catch (error) {
    console.error('Error fetching item price history:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { 
      status: 500,
      headers: headers 
    });
  }
}