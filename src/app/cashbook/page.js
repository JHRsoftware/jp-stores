
"use client";
import React, { useEffect, useState } from 'react';
import AuthWrapper from '../components/AuthWrapper';
import { ThemeContainer, ThemeCard, ThemeInput, ThemeButton, ThemeTable, ThemeLabel, ThemeGrid, ThemeLoading } from '../components/ThemeAware';
import { useTheme } from '../theme-context';

export default function CashbookPage() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [cash, setCash] = useState('');
  const [bank, setBank] = useState('');
  const [other, setOther] = useState('');
  const [remarkType, setRemarkType] = useState(''); // '' or 'open'

  // totals
  const [totalCash, setTotalCash] = useState(0);
  const [totalBank, setTotalBank] = useState(0);
  const [userName, setUserName] = useState('');
  const [userOpenCash, setUserOpenCash] = useState(0);
  const [userOpenBank, setUserOpenBank] = useState(0);
  const [userInCash, setUserInCash] = useState(0);
  const [userInBank, setUserInBank] = useState(0);
  const [userOutCash, setUserOutCash] = useState(0);
  const [userOutBank, setUserOutBank] = useState(0);
  const [userNetCash, setUserNetCash] = useState(0);
  const [userNetBank, setUserNetBank] = useState(0);
  const [includeTransactions, setIncludeTransactions] = useState(false); // default: don't include transactions in print
  const [printStarted, setPrintStarted] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearPassword, setClearPassword] = useState('');
  const [clearLoading, setClearLoading] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cashbook');
      const json = await res.json();
      if (json.success) {
        applyData(json.data || [], json.totals || { cash: 0, bank: 0 });
      }
    } catch (err) {
      console.error('Failed to load cashbook entries', err);
    } finally {
      setLoading(false);
    }
  };

  const applyData = (all, totals) => {
    setEntries(all || []);
    setTotalCash(Number(totals?.cash || 0));
    setTotalBank(Number(totals?.bank || 0));

    // determine current user from localStorage
    let curUser = '';
    try {
      const u = typeof window !== 'undefined' && localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
      curUser = u?.username || u?.name || '';
    } catch (e) {
      curUser = '';
    }
    setUserName(curUser || '');

    // compute per-user balances
    const userEntries = curUser ? (all || []).filter(r => String(r.user).toLowerCase().trim() === String(curUser).toLowerCase().trim()) : [];

    const openEntries = userEntries.filter(r => String(r.remark || '').toLowerCase() === 'open balance');
    const openCash = openEntries.reduce((s, r) => s + Number(r.cash || 0), 0);
    const openBank = openEntries.reduce((s, r) => s + Number(r.bank || 0), 0);

    const txEntries = userEntries.filter(r => String(r.remark || '').toLowerCase() !== 'open balance');
    const inCash = txEntries.reduce((s, r) => s + (Number(r.cash || 0) > 0 ? Number(r.cash || 0) : 0), 0);
    const inBank = txEntries.reduce((s, r) => s + (Number(r.bank || 0) > 0 ? Number(r.bank || 0) : 0), 0);
    const outCash = txEntries.reduce((s, r) => s + (Number(r.cash || 0) < 0 ? Math.abs(Number(r.cash || 0)) : 0), 0);
    const outBank = txEntries.reduce((s, r) => s + (Number(r.bank || 0) < 0 ? Math.abs(Number(r.bank || 0)) : 0), 0);

    const netCash = openCash + inCash - outCash;
    const netBank = openBank + inBank - outBank;

    setUserOpenCash(openCash);
    setUserOpenBank(openBank);
    setUserInCash(inCash);
    setUserInBank(inBank);
    setUserOutCash(outCash);
    setUserOutBank(outBank);
    setUserNetCash(netCash);
    setUserNetBank(netBank);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleAdd = async () => {
    // remark: if remarkType === 'open' store 'Open balance' as remark
    const remark = remarkType === 'open' ? 'Open balance' : '';

    // get logged in user from localStorage if available
    let userName = '';
    try {
      const u = typeof window !== 'undefined' && localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
      userName = u?.username || u?.name || '';
    } catch (e) {
      userName = '';
    }

    const payload = {
      date,
      remark,
      other,
      cash: parseFloat(cash || 0),
      bank: parseFloat(bank || 0),
      user: userName || 'system'
    };

    setLoading(true);
    try {
      const res = await fetch('/api/cashbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        // clear inputs
        setCash('');
        setBank('');
        setOther('');
        setRemarkType('');
        // refresh
        fetchEntries();
      } else {
        console.error('Failed to add entry', json.error);
      }
    } catch (err) {
      console.error('Failed to add entry', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintForUser = () => {
    if (printStarted) return;
    setPrintStarted(true);
    const curUser = userName || (() => {
      try { const u = typeof window !== 'undefined' && localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null; return u?.username || u?.name || 'Unknown'; } catch { return 'Unknown'; }
    })();
    const include = includeTransactions ? '1' : '0';
    const url = `/cashbook/print?user=${encodeURIComponent(curUser)}&include=${include}`;

    // Open without noopener so we can call print on the opened window when it's ready.
    const w = window.open(url, '_blank');
    if (!w) {
      // Popup blocked — navigate current tab to print route as a fallback
      window.location.href = url;
      setTimeout(() => setPrintStarted(false), 2000); // allow retry after 2s
      return;
    }

    // Poll the opened window for readiness flag then trigger print from opener
    const start = Date.now();
    const timeout = 8000; // 8s
    const poll = setInterval(() => {
      try {
        if (w.closed) {
          clearInterval(poll);
          setPrintStarted(false);
          return;
        }
        // If child sets window.cashbookPrintReady and has triggerPrint function, call it
        if (w.cashbookPrintReady && w.triggerPrint) {
          try { w.triggerPrint(); } catch (e) { console.warn('Failed to trigger print on child window', e); }
          clearInterval(poll);
          setTimeout(() => setPrintStarted(false), 2000); // allow retry after 2s
          return;
        }
      } catch (e) {
        // cross-origin or other error - stop polling
        console.warn('Polling print window failed', e);
        clearInterval(poll);
        setTimeout(() => setPrintStarted(false), 2000); // allow retry after 2s
      }
      if (Date.now() - start > timeout) {
        clearInterval(poll);
        setTimeout(() => setPrintStarted(false), 2000); // allow retry after 2s
      }
    }, 250);
  };

  return (
    <AuthWrapper>
      <ThemeContainer className="cashbook-page" style={{ maxWidth: '1200px', paddingTop: 'var(--spacing-xl)' }}>
        <ThemeCard style={{ marginBottom: 'var(--spacing-lg)', borderTop: `4px solid ${theme?.colors.primary}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, color: theme?.colors.primary }}>Cashbook</h2>
              <p style={{ margin: 0, color: theme?.colors.foregroundSecondary }}>Manage cash & bank movements</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, color: theme?.colors.primary }}>Cash Balance</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>Rs. {Number(totalCash).toFixed(2)}</div>
              <div style={{ marginTop: '0.5rem', fontWeight: 700, color: theme?.colors.primary }}>Bank Balance</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>Rs. {Number(totalBank).toFixed(2)}</div>
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end', alignItems: 'center' }}>
                <ThemeButton
                  variant="error"
                  onClick={() => setShowClearModal(true)}
                  style={{
                    background: theme?.colors?.error || '#dc3545',
                    color: '#fff',
                    borderColor: theme?.colors?.error || '#dc3545',
                    fontWeight: 700,
                    boxShadow: '0 4px 10px rgba(220,53,69,0.12)'
                  }}
                >
                  Clear Transactions
                </ThemeButton>
                <ThemeButton variant="primary" onClick={handlePrintForUser} disabled={printStarted} aria-disabled={printStarted}>
                  {printStarted ? 'Printing...' : 'Print'}
                </ThemeButton>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px', color: theme?.colors.foregroundSecondary, fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={includeTransactions} onChange={(e) => setIncludeTransactions(e.target.checked)} />
                  <span style={{ userSelect: 'none' }}>Include transactions</span>
                </label>
              </div>
            </div>
          </div>
        </ThemeCard>

        <ThemeGrid columns="1fr 1fr" gap="lg" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <ThemeCard>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
              <div>
                <ThemeLabel>Cash</ThemeLabel>
                <ThemeInput type="number" step="0.01" value={cash} onChange={e => setCash(e.target.value)} />
              </div>
              <div>
                <ThemeLabel>Bank</ThemeLabel>
                <ThemeInput type="number" step="0.01" value={bank} onChange={e => setBank(e.target.value)} />
              </div>
              <div>
                <ThemeLabel>Other</ThemeLabel>
                <ThemeInput value={other} onChange={e => setOther(e.target.value)} />
              </div>
              <div>
                <ThemeLabel>Remark</ThemeLabel>
                <select value={remarkType} onChange={e => setRemarkType(e.target.value)} style={{ width: '100%', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-sm)', border: `1px solid ${theme?.colors.border}` }}>
                  <option value="">-- Select --</option>
                  <option value="open">Open Balance</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
              <ThemeButton variant="secondary" onClick={() => { setCash(''); setBank(''); setOther(''); setRemarkType(''); }}>Clear</ThemeButton>
              <ThemeButton variant="primary" onClick={handleAdd} disabled={loading}>Add</ThemeButton>
            </div>
          </ThemeCard>
          {/* Clear password modal */}
          {showClearModal && (
            <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200000 }}>
              <div style={{ background: 'var(--card)', padding: 'var(--spacing-lg)', borderRadius: '8px', width: '360px', boxShadow: 'var(--shadow-large)' }}>
                <h3 style={{ marginTop: 0 }}>Confirm Clear Transactions</h3>
                <p style={{ color: theme?.colors.foregroundSecondary }}>Enter your password to permanently clear all transactions belonging to the logged-in user.</p>
                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                  <ThemeLabel>Password</ThemeLabel>
                  <ThemeInput type="password" value={clearPassword} onChange={e => setClearPassword(e.target.value)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
                  <ThemeButton variant="secondary" onClick={() => { setShowClearModal(false); setClearPassword(''); }}>Cancel</ThemeButton>
                  <ThemeButton
                    variant="error"
                    onClick={async () => {
                      setClearLoading(true);
                      try {
                        const curUser = userName || (() => { try { const u = typeof window !== 'undefined' && localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null; return u?.username || u?.name || ''; } catch { return ''; } })();
                        const res = await fetch('/api/cashbook/clear', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: curUser, password: clearPassword }) });
                        const json = await res.json();
                        if (json.success) {
                          // apply returned data & totals to update UI immediately
                          if (json.data && json.totals) {
                            applyData(json.data, json.totals);
                          } else {
                            // fallback to re-fetch if response doesn't include data
                            fetchEntries();
                          }
                          setShowClearModal(false);
                          setClearPassword('');
                        } else {
                          alert('Failed to clear: ' + (json.error || 'Unknown'));
                        }
                      } catch (err) {
                        alert('Failed to clear transactions');
                      } finally {
                        setClearLoading(false);
                      }
                    }}
                    disabled={clearLoading}
                    aria-disabled={clearLoading}
                    title="Confirm and permanently clear transactions"
                    style={{
                      padding: 'var(--spacing-sm) var(--spacing-lg)',
                      background: theme?.colors.error || '#dc3545',
                      color: theme?.colors.onError || '#fff',
                      border: `2px solid ${theme?.colors.errorDark || theme?.colors.error || '#b02a37'}`,
                      fontWeight: 800,
                      boxShadow: `0 6px 18px ${theme?.colors.shadow || 'rgba(0,0,0,0.12)'}`
                    }}
                  >
                    {clearLoading ? 'Clearing...' : 'Confirm Clear'}
                  </ThemeButton>
                </div>
              </div>
            </div>
          )}

          <ThemeCard>
            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
              <div style={{ fontWeight: 700, color: theme?.colors.primary }}>Quick Info</div>
              <div style={{ color: theme?.colors.foregroundSecondary }}>Select "Open Balance" in remark to store the entry as an opening balance.</div>
            </div>
          </ThemeCard>
        </ThemeGrid>

        <ThemeCard>
          {loading ? (
            <ThemeLoading text="Loading entries..." />
          ) : (
            <ThemeTable style={{ width: '100%' }}>
              <thead>
                <tr style={{ background: theme?.colors.backgroundSecondary }}>
                  <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Remark</th>
                  <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>Other</th>
                  <th style={{ padding: 'var(--spacing-sm)', textAlign: 'right' }}>Cash (Rs.)</th>
                  <th style={{ padding: 'var(--spacing-sm)', textAlign: 'right' }}>Bank (Rs.)</th>
                  <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left' }}>User</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(row => (
                  <tr key={row.id} style={{ borderBottom: `1px solid ${theme?.colors.border}` }}>
                    <td style={{ padding: 'var(--spacing-sm)' }}>{row.id}</td>
                    <td style={{ padding: 'var(--spacing-sm)' }}>{row.date}</td>
                    <td style={{ padding: 'var(--spacing-sm)' }}>{row.remark}</td>
                    <td style={{ padding: 'var(--spacing-sm)' }}>{row.other}</td>
                    <td style={{ padding: 'var(--spacing-sm)', textAlign: 'right' }}>{Number(row.cash || 0).toFixed(2)}</td>
                    <td style={{ padding: 'var(--spacing-sm)', textAlign: 'right' }}>{Number(row.bank || 0).toFixed(2)}</td>
                    <td style={{ padding: 'var(--spacing-sm)' }}>{row.user}</td>
                  </tr>
                ))}
              </tbody>
            </ThemeTable>
          )}
        </ThemeCard>
      </ThemeContainer>
    </AuthWrapper>
  );
}
