"use client";
import React, { useEffect, useState } from 'react';

export default function CashbookPrintPage() {
  const [htmlReady, setHtmlReady] = useState(false);
  const [entries, setEntries] = useState([]);
  const [userName, setUserName] = useState('');
  const [includeTransactions, setIncludeTransactions] = useState(false);
  const [printedDate, setPrintedDate] = useState('');
  const [printedDateTime, setPrintedDateTime] = useState('');
  const [userOpenCash, setUserOpenCash] = useState(0);
  const [userOpenBank, setUserOpenBank] = useState(0);
  const [userInCash, setUserInCash] = useState(0);
  const [userInBank, setUserInBank] = useState(0);
  const [userOutCash, setUserOutCash] = useState(0);
  const [userOutBank, setUserOutBank] = useState(0);
  const [userNetCash, setUserNetCash] = useState(0);
  const [userNetBank, setUserNetBank] = useState(0);

  useEffect(() => {
    // parse query params from URL
    const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const qUser = sp?.get('user') || '';
    const qInclude = sp?.get('include') || '0';
    setUserName(qUser);
    setIncludeTransactions(qInclude === '1' || qInclude === 'true');

    async function load() {
      try {
        const res = await fetch('/api/cashbook');
        const json = await res.json();
        const all = (json && json.data) ? json.data : (json && json.success ? json.data || [] : []);
        const cur = qUser ? all.filter(r => String(r.user).toLowerCase().trim() === String(qUser).toLowerCase().trim()) : [];

        // compute balances similar to cashbook page
        const openEntries = cur.filter(r => String(r.remark || '').toLowerCase() === 'open balance');
        const openCash = openEntries.reduce((s, r) => s + Number(r.cash || 0), 0);
        const openBank = openEntries.reduce((s, r) => s + Number(r.bank || 0), 0);

        const txEntries = cur.filter(r => String(r.remark || '').toLowerCase() !== 'open balance');
        const inCash = txEntries.reduce((s, r) => s + (Number(r.cash || 0) > 0 ? Number(r.cash || 0) : 0), 0);
        const inBank = txEntries.reduce((s, r) => s + (Number(r.bank || 0) > 0 ? Number(r.bank || 0) : 0), 0);
        const outCash = txEntries.reduce((s, r) => s + (Number(r.cash || 0) < 0 ? Math.abs(Number(r.cash || 0)) : 0), 0);
        const outBank = txEntries.reduce((s, r) => s + (Number(r.bank || 0) < 0 ? Math.abs(Number(r.bank || 0)) : 0), 0);

        setEntries(cur);
        setUserOpenCash(openCash);
        setUserOpenBank(openBank);
        setUserInCash(inCash);
        setUserInBank(inBank);
        setUserOutCash(outCash);
        setUserOutBank(outBank);
        setUserNetCash(openCash + inCash - outCash);
        setUserNetBank(openBank + inBank - outBank);

        setTimeout(() => setHtmlReady(true), 50);
      } catch (err) {
        console.error('Failed to load cashbook for print', err);
        setHtmlReady(true);
      }
    }

    load();
  }, []);

  const printedRef = React.useRef(false);
  useEffect(() => {
    if (!htmlReady) return;
    // set printed date/time on client to avoid SSR/CSR mismatch
    try {
      const now = new Date();
      setPrintedDate(now.toLocaleDateString());
      setPrintedDateTime(now.toLocaleString());
    } catch (e) {
      setPrintedDate('');
      setPrintedDateTime('');
    }

    // Mark ready so opener can detect (do this regardless of opener presence)
    if (typeof window !== 'undefined') {
      try { window.cashbookPrintReady = true; } catch (e) { /* ignore */ }
    }

    // Listen for print command from parent window instead of auto-printing
    const handlePrint = () => {
      if (printedRef.current) return;
      printedRef.current = true;
      try {
        window.print();
        setTimeout(() => {
          window.close();
        }, 200);
      } catch (err) {
        console.warn('Print failed', err);
      }
    };

    // Set up print function that parent can call
    if (typeof window !== 'undefined') {
      try { 
        window.triggerPrint = handlePrint;
      } catch (e) { /* ignore */ }
    }
  }, [htmlReady]);

  // Render print layout sized for 72mm (safe width for 80mm paper)
  return (
    <div style={{ 
      padding: '2mm',
      width: '72mm', 
      fontFamily: "'Courier New', monospace", 
      fontSize: '9px',
      lineHeight: 1.1,
      margin: 0,
      boxSizing: 'border-box'
    }}>
      <style>
        {`
          @media print {
            @page {
              margin: 0 !important;
              padding: 0 !important;
              size: 72mm auto;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
              width: 72mm !important;
            }
            html {
              margin: 0 !important;
              padding: 0 !important;
              width: 72mm !important;
            }
          }
        `}
      </style>

      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '3px', borderBottom: '1px solid #000', paddingBottom: '1px' }}>
        <h1 style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          margin: 0, 
          marginBottom: '1px',
          textTransform: 'uppercase'
        }}>
          Daily Cashbook
        </h1>
        <div style={{ fontSize: '13px', marginBottom: '1px', fontWeight: 'bold',  }}>
          <strong>Date:</strong> {printedDate || ''} | <strong>User:</strong> {userName || 'Unknown'}
        </div>
      </div>

      {/* Summary Section */}
      <div style={{ 
        marginBottom: '4px',
        padding: '1px 0'
      }}>
        <div style={{ marginBottom: '1px', fontWeight: 'bold',  }}>
          <strong style={{ fontSize: '15px' }}>OPEN BALANCE</strong>
        </div>
        <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold',  }}>
          <span>Cash: Rs.{userOpenCash.toFixed(2)}</span>
          <span>Bank: Rs.{userOpenBank.toFixed(2)}</span>
        </div>
        
        <div style={{ margin: '1px 0', borderTop: '1px dashed #666', paddingTop: '1px', fontWeight: 'bold',  }}>
          <strong style={{ fontSize: '15px' }}>IN (+)</strong>
        </div>
        <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold',  }}>
          <span>Cash: Rs.{userInCash.toFixed(2)}</span>
          <span>Bank: Rs.{userInBank.toFixed(2)}</span>
        </div>
        
        <div style={{ margin: '1px 0', borderTop: '1px dashed #666', paddingTop: '1px', fontWeight: 'bold',  }}>
          <strong style={{ fontSize: '15px' }}>OUT (-)</strong>
        </div>
        <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold',  }}>
          <span>Cash: Rs.{userOutCash.toFixed(2)}</span>
          <span>Bank: Rs.{userOutBank.toFixed(2)}</span>
        </div>
        
        <div style={{ 
          margin: '2px 0 0 0', 
          borderTop: '1px solid #000', 
          paddingTop: '1px',
          fontWeight: 'bold'
        }}>
          <div style={{ fontSize: '15px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold',  }}>
            <span>NET CASH: Rs.{userNetCash.toFixed(2)}</span>
            <span>NET BANK: Rs.{userNetBank.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {includeTransactions && entries.length > 0 && (
        <div style={{ marginTop: '4px' }}>
          <div style={{ 
            textAlign: 'center', 
            fontWeight: 'bold', 
            fontSize: '12px',
            borderBottom: '1px solid #000',
            marginBottom: '1px',
            paddingBottom: '1px'
          }}>
            TRANSACTIONS
          </div>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            fontSize: '12px',
            tableLayout: 'fixed',
            borderTop: '1px solid #000'
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #666' }}>
                <th style={{ textAlign: 'left', width: '22%', padding: '0.3px', fontSize: '15px' }}>Date</th>
                <th style={{ textAlign: 'left', width: '38%', padding: '0.3px', fontSize: '15px' }}>Remark</th>
                <th style={{ textAlign: 'right', width: '20%', padding: '0.3px', fontSize: '15px' }}>Cash</th>
                <th style={{ textAlign: 'right', width: '20%', padding: '0.3px', fontSize: '15px' }}>Bank</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, index) => {
                const hasOtherDetails = e.other && String(e.other).trim() !== '';
                return (
                  <React.Fragment key={e.id}>
                    {/* Main Row */}
                    <tr style={{ 
                      borderBottom: hasOtherDetails ? 'none' : (index === entries.length - 1 ? 'none' : '1px dotted #ccc'),
                      verticalAlign: 'top'
                    }}>
                      <td style={{ padding: '0.3px', wordBreak: 'break-all', fontSize: '13px', fontWeight: 'bold' }}>
                        {e.date}
                      </td>
                      <td style={{ 
                        padding: '0.3px', 
                        wordBreak: 'break-word',
                        fontSize: '13px',
                        fontWeight: 'bold'
                      }}>
                        {String(e.remark || '').replace(/</g,'&lt;')}
                      </td>
                      <td style={{ 
                        textAlign: 'right', 
                        padding: '0.3px',
                        fontFamily: "'Courier New', monospace",
                        fontSize: '13px',
                        fontWeight: Number(e.cash || 0) !== 0 ? 'bold' : 'normal'
                      }}>
                        {Number(e.cash || 0) !== 0 ? Number(e.cash || 0).toFixed(2) : '-'}
                      </td>
                      <td style={{ 
                        textAlign: 'right', 
                        padding: '0.3px',
                        fontFamily: "'Courier New', monospace",
                        fontSize: '13px',
                        fontWeight: Number(e.bank || 0) !== 0 ? 'bold' : 'normal'
                      }}>
                        {Number(e.bank || 0) !== 0 ? Number(e.bank || 0).toFixed(2) : '-'}
                      </td>
                    </tr>
                    
                    {/* Other Details Row (if exists) */}
                    {hasOtherDetails && (
                      <tr style={{ 
                        borderBottom: index === entries.length - 1 ? 'none' : '1px dotted #ccc',
                        verticalAlign: 'top'
                      }}>
                        <td style={{ padding: '0.3px', fontSize: '11px' }}></td>
                        <td colSpan="3" style={{ 
                          padding: '0.3px', 
                          wordBreak: 'break-word',
                          fontSize: '13px',
                          fontWeight: 'bold'
                        }}>
                          {String(e.other || '').replace(/</g,'&lt;')}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div style={{ 
        marginTop: '4px', 
        paddingTop: '1px',
        borderTop: '1px solid #000',
        fontSize: '13px',
        textAlign: 'center',
        fontWeight: 'bold'
      }}>
        Printed: {printedDateTime || ''}
      </div>
    </div>
  );
}