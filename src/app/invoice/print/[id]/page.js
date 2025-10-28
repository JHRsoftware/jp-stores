import React from 'react';
import { getDbConnection } from '../../../db';

export default async function InvoicePrintPage({ params }) {
  const { id: invoiceId } = await params;
  const pool = await getDbConnection();
  const conn = await pool.getConnection();
  
  try {
    // Fetch invoice and customer info
    const [[invRows]] = await conn.query(
      'SELECT i.*, c.customer_name, c.customer_code FROM invoices i LEFT JOIN customers c ON c.id = i.customer_id WHERE i.id = ?', 
      [invoiceId]
    );
    const invoice = Array.isArray(invRows) ? invRows[0] : invRows;
    
    if (!invoice) {
      conn.release();
      return <div>Invoice not found</div>;
    }

    // Fetch invoice items (also pull the canonical item name from items table when available)
    const [itemsRows] = await conn.query(
      `SELECT ii.*, i.item_name AS item_name_from_items, i.item_barcode AS item_barcode_from_items
       FROM invoice_items ii
       LEFT JOIN items i ON i.id = ii.item_id
       WHERE ii.invoice_id = ?`,
      [invoiceId]
    );
    const items = itemsRows || [];

    // Fetch shop info
    const [shopRows] = await conn.query('SELECT * FROM shop ORDER BY id DESC LIMIT 1');
    const shop = Array.isArray(shopRows) && shopRows.length > 0 ? shopRows[0] : null;
    
    conn.release();

    // Formatting helper
    const fmt = (v) => (v == null ? '0.00' : Number(v).toFixed(2));
    const dateStr = invoice.date_time ? new Date(invoice.date_time).toLocaleDateString() + ', ' + new Date(invoice.date_time).toLocaleTimeString() : '';
    
    // Check shop settings for hiding elements
    const hideSellPrice = shop && shop.hide_sell_price;
    const hideTotalDiscount = shop && shop.hide_total_discount;

    return (
      <html>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>{`Invoice #${invoice.invoice_number || invoice.id}`}</title>
          <style>{`
            /* 
            INVOICE PRINT SETTINGS - Controlled by shop database settings:
            
            1. Sell Price Column: ${hideSellPrice ? 'HIDDEN' : 'VISIBLE'}
            2. Total Discount Line: ${hideTotalDiscount ? 'HIDDEN' : 'VISIBLE'}
            
            To change: Go to Shop page → Invoice Print Settings section
            */
            @media print {
              @page { 
                size: 80mm auto; 
                margin: 0;
                padding: 0;
              }
              body { 
                margin: 0; 
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              color: #000 !important;
              background: #fff !important;
            }
            body {
              font-family: 'Courier New', monospace, Arial, sans-serif;
              font-size: 14px;
              width: 80mm;
              max-width: 80mm;
              padding: 3mm;
              margin: 0 auto;
              line-height: 1.2;
            }
            .center { 
              text-align: center; 
              width: 100%;
            }
            .left { 
              text-align: left; 
            }
            .right { 
              text-align: right; 
            }
            .bold { 
              font-weight: bold; 
            }
            .divider {
              border-top: 1px solid #000;
              margin: 4px 0;
              width: 100%;
            }
            .logo-container {
              width: 100%;
              display: flex;
              justify-content: center;
              margin-bottom: 1mm; /* Reduced from 0mm to 1mm */
            }
            .shop-name {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 0mm;
              margin-top: -10mm; /* Added negative margin to pull up */
            }
            .shop-address {
              font-size: 15px;
              margin-bottom: 0mm;
              margin-top: -1mm; /* Added negative margin to pull up */
              font-weight: bold;
            }
            .shop-contact {
              font-size: 15px;
              margin-bottom: 0mm;
              margin-top: -1mm; /* Added negative margin to pull up */
              font-weight: bold;
            }
            .invoice-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3mm;
              font-size: 15px;
              margin-top: 1mm; /* Reduced top margin */
              font-weight: bold;
            }
            .customer-name {
              margin-bottom: 3mm;
              font-size: 13px;
              font-weight: bold;
            }
            .items-header {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              border-bottom: 1px solid #000;
              padding-bottom: 2px;
              margin-bottom: 2px;
              font-size: 13px;
            }
            .item-container {
              margin: 3px 0;
            }
            .item-name-line {
              text-align: left;
              font-weight: bold;
              font-size: 14px;
              word-break: break-word;
              line-height: 1.1;
              width: 100%;
            }
            .item-details-line {
              display: flex;
              justify-content: space-between;
              margin-top: 1px;
              font-size: 15px;
              width: 100%;
            }
            /* Adjusted column widths with specific gaps */
            .item-name-col {
              width: 18%;  /* Reduced for less gap after item name */
              text-align: left;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .qty-col {
              width: 10%;  /* Reduced width */
              text-align: center;
              min-width: 20px;
              margin-right: 12px; /* Added space between Qty and Mkt Price */
              font-weight: bold;
            }
            .market-price-col {
              width: 23%;  /* Increased width */
              text-align: right;
              min-width: 45px;
              margin-right: 15px; /* Small space between Mkt Price and Sell Price */
              font-weight: bold;
            }
            .selling-price-col {
              width: 23%;  /* Original width maintained */
              text-align: right;
              min-width: 45px;
              margin-right: 15px; /* Small space between Sell Price and Total */
              font-weight: bold;
              display: ${hideSellPrice ? 'none' : 'block'}; /* Controlled by shop setting */
            }
            .total-col {
              width: 25%;  /* Adjusted width */
              text-align: right;
              min-width: 45px;
              font-weight: bold;
            }
            .summary-line {
              display: flex;
              justify-content: space-between;
              margin: 4px 0;
              font-size: 14px;
              font-weight: bold;
            }
            .net-total-line {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
              font-size: 16px;
              font-weight: bold;
              border-top: 1px dashed #000;
              padding-top: 3px;
            }
            .payment-section {
              margin-top: 4mm;
              font-size: 14px;
              border-top: 1px dashed #000;
              padding-top: 3mm;
              font-weight: bold;
            }
            .footer {
              margin-top: 4mm;
              font-size: 15px;
              text-align: center;
              border-top: 1px dashed #000;
              padding-top: 2mm;
              font-weight: bold;
            }
            .developer-note {
              margin-top: 3mm;
              font-size: 13px;
              text-align: center;
              color: #666;
              font-style: italic;
              font-weight: bold;
            }
          `}</style>
        </head>
        <body>
          {/* Logo - Top Center with reduced margin */}
          <div className="logo-container">
            {shop && shop.logo_url ? (
              <img 
                src={shop.logo_url} 
                alt="logo" 
                style={{ 
                  height: '35mm',  /* Reduced height */
                  width: 'auto',
                  maxWidth: '45mm', /* Reduced max width */
                  objectFit: 'contain'
                }} 
              />
            ) : null}
          </div>

          {/* Shop Name - Centered below logo with reduced gap */}
          {shop?.name && (
            <div className="center shop-name">
              {shop.name}
            </div>
          )}

          {/* Shop Address - Centered below shop name */}
          {shop?.address && (
            <div className="center shop-address">
              {shop.address}
            </div>
          )}

          {/* Contact Number - Centered below address */}
          {shop?.contact_number && (
            <div className="center shop-contact">
              Tel: {shop.contact_number}
            </div>
          )}

          {/* Invoice Number and Date/Time in same line */}
          <div className="invoice-header">
            <div className="left bold">
              Inv:{invoice.invoice_number || invoice.id}
            </div>
            <div className="right">
              {dateStr}
            </div>
          </div>

          {/* Customer Name below invoice line */}
          <div className="customer-name">
            <strong>Customer:</strong> {invoice.customer_name ? `${invoice.customer_code || ''} - ${invoice.customer_name}` : (invoice.customer_id ? `#${invoice.customer_id}` : 'Walk-in')}
          </div>

          <div className="divider"></div>

          {/* Items Table Header */}
          <div className="items-header">
            <div className="item-name-col" style={{fontSize: '14px'}}>Item</div>
            <div className="qty-col" style={{fontSize: '14px'}}>Qty</div>
            <div className="market-price-col" style={{fontSize: '14px'}}>Mkt Price</div>
            <div className="selling-price-col" style={{fontSize: '14px', display: hideSellPrice ? 'none' : 'block'}}>Sell Price</div>
            <div className="total-col" style={{fontSize: '14px'}}>Total</div>
          </div>

          {/* Items List - Two lines per item */}
          {items.map((it, idx) => {
            const qty = Number(it.qty || 0);
            const marketPrice = Number(it.market_price || it.orig_market_price || 0);
            const sellingPrice = Number(it.selling_price || it.price || 0);
            const total = sellingPrice * qty;
            const itemName = it.item_name || it.item_name_from_items || it.other || it.barcode || it.item_barcode_from_items || 'Item';

            return (
              <div key={idx} className="item-container">
                {/* First line - Item name only, left aligned */}
                <div className="item-name-line">
                  {itemName}
                </div>

                {/* Second line - Qty, Market Price, Selling Price (hidden), Total right aligned */}
                <div className="item-details-line">
                  <div className="item-name-col"></div>
                  <div className="qty-col">{qty}</div>
                  <div className="market-price-col">{fmt(marketPrice)}</div>
                  <div className="selling-price-col" style={{display: hideSellPrice ? 'none' : 'block'}}>{fmt(sellingPrice)}</div>
                  <div className="total-col">{fmt(total)}</div>
                </div>
              </div>
            );
          })}

          <div className="divider"></div>

          {/* Summary Section */}
          <div style={{ marginTop: '3mm' }}>
            <div className="summary-line">
              <div>Sub Total:</div>
              <div>Rs. {fmt(items.reduce((s, it) => s + (Number(it.qty || 0) * Number(it.market_price || it.orig_market_price || 0)), 0))}</div>
            </div>
            
            {!hideTotalDiscount && (
              <div className="summary-line">
                <div>Total Discount:</div>
                <div>Rs. {fmt(items.reduce((s, it) => s + ((Number(it.market_price || it.orig_market_price || 0) - Number(it.selling_price || it.price || 0)) * Number(it.qty || 0)), 0))}</div>
              </div>
            )}
            
            <div className="net-total-line">
              <div>Net Total:</div>
              <div>Rs. {fmt(invoice.net_total)}</div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="payment-section">
            <div><strong>Cash Paid:</strong> Rs. {fmt(invoice.cash_payment)}</div>
            <div><strong>Card Paid:</strong> Rs. {fmt(invoice.card_payment)}</div>
            <div><strong>Balance Amount:</strong> Rs. {fmt((Number(invoice.cash_payment) || 0) + (Number(invoice.card_payment) || 0) - (Number(invoice.net_total) || 0))}</div>
          </div>

          {/* Footer */}
          {shop?.footer && (
            <div className="footer">
              {shop.footer}
            </div>
          )}

          {/* Developer Note */}
          {shop?.developer_note && (
            <div className="developer-note">
              {shop.developer_note}
            </div>
          )}

          {/* Auto print script */}
          <script dangerouslySetInnerHTML={{ __html: `
            (function(){
              function doPrint() {
                try { 
                  window.focus(); 
                  window.print(); 
                } catch(e){}
              }

              // Print as soon as DOM is ready
              if (document.readyState === 'complete' || document.readyState === 'interactive') {
                setTimeout(doPrint, 100);
              } else {
                document.addEventListener('DOMContentLoaded', function() {
                  setTimeout(doPrint, 100);
                });
              }

              // Try to close the window after printing
              window.addEventListener('afterprint', function() { 
                try { 
                  setTimeout(function(){ window.close(); }, 100); 
                } catch(e){} 
              });
              
              // Fallback close
              setTimeout(function() { 
                try { window.close(); } catch(e){} 
              }, 3000);
            })();
          `}} />
        </body>
      </html>
    );
  } catch (err) {
    try { conn.release(); } catch (e) {}
    console.error('print invoice err', err);
    return <div>Error loading invoice</div>;
  }
}