"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthWrapper from '../components/AuthWrapper';
import FastPageLoader from '../components/FastPageLoader';
import { useTheme } from '../theme-context';
import { ThemeContainer, ThemeCard, ThemeGrid, ThemeButton, ThemeInput, ThemeLoading } from '../components/ThemeAware';

const emptyForm = { name: '', address: '', contact_number: '', logo_url: '', footer: '', developer_note: '', hide_sell_price: false, hide_total_discount: false };

export default function ShopPage() {
  const { theme } = useTheme();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadShops();
  }, []);

  async function loadShops() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/shop?all=1');
      if (!res.ok) throw new Error('Failed to fetch shops');
      const data = await res.json();
      // API returns { success: true, shops: [...] }
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data.shops)) {
        list = data.shops;
      } else if (data.success && data.shop) {
        list = [data.shop];
      } else {
        list = [];
      }
      setShops(list);
      // If at least one shop exists, switch to edit mode for the latest shop and prefill the form
      if (list.length > 0) {
        const first = list[0];
        console.log('Shop data loaded:', {
          hide_sell_price: first.hide_sell_price,
          hide_total_discount: first.hide_total_discount,
          hide_sell_price_type: typeof first.hide_sell_price,
          hide_total_discount_type: typeof first.hide_total_discount
        });
        
        setEditingId(first.id ?? first._id ?? null);
        setForm({
          name: first.name || '',
          address: first.address || '',
          contact_number: first.contact_number || first.phone || '',
          logo_url: first.logo_url || '',
          footer: first.footer || '',
          developer_note: first.developer_note || '',
          hide_sell_price: Boolean(first.hide_sell_price),
          hide_total_discount: Boolean(first.hide_total_discount)
        });
      } else {
        setEditingId(null);
        setForm(emptyForm);
      }
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      // API expects PUT body to include id; route handles POST/PUT/DELETE via body
      const method = editingId ? 'PUT' : 'POST';
      const url = '/api/shop';
      const payload = editingId ? { ...form, id: editingId } : form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.error || res.statusText || 'Save failed';
        throw new Error(msg);
      }
      if (json && json.success === false) {
        throw new Error(json.error || 'Save failed');
      }

      // If the API returned the saved shop, update the local list directly to reflect changes immediately.
      if (json && json.shop) {
        const saved = json.shop;
        setShops(prev => {
          // replace existing item with same id or add to front
          const idx = prev.findIndex(s => (s.id ?? s._id) === (saved.id ?? saved._id));
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [saved, ...prev];
        });
        // ensure editing state reflects the saved item
        setEditingId(saved.id ?? saved._id ?? null);
        setForm({
          name: saved.name || '',
          address: saved.address || '',
          contact_number: saved.contact_number || saved.phone || '',
          logo_url: saved.logo_url || '',
          footer: saved.footer || '',
          developer_note: saved.developer_note || '',
          hide_sell_price: Boolean(saved.hide_sell_price),
          hide_total_discount: Boolean(saved.hide_total_discount)
        });
      } else {
        // fallback: reload full list
        await loadShops();
      }
    } catch (err) {
      // show detailed server error
      alert(err.message || 'Save error');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(shop) {
    setForm({
      name: shop.name || '',
      address: shop.address || '',
      contact_number: shop.contact_number || shop.phone || '',
      logo_url: shop.logo_url || '',
      footer: shop.footer || '',
      developer_note: shop.developer_note || '',
      hide_sell_price: Boolean(shop.hide_sell_price),
      hide_total_discount: Boolean(shop.hide_total_discount)
    });
    setEditingId(shop.id ?? shop._id ?? null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function removeShop(id) {
    if (!confirm('Delete this shop?')) return;
    try {
      // API expects id in body for DELETE
      const res = await fetch('/api/shop', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.error || res.statusText || 'Delete failed';
        throw new Error(msg);
      }
      if (json && json.success === false) {
        throw new Error(json.error || 'Delete failed');
      }
      // Remove locally to reflect deletion immediately
      setShops(prev => prev.filter(s => (s.id ?? s._id) !== id));
      // if we deleted the currently editing item, reset form
      if ((editingId ?? null) === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
    } catch (err) {
      alert(err.message || 'Delete error');
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  return (
    <AuthWrapper>
      <FastPageLoader loading={loading}>
        <ThemeContainer style={{ maxWidth: 1100, margin: '0 auto', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1 style={{ margin: 0, color: theme?.colors?.foreground || '#111' }}>Shop Details</h1>
            
          </div>

          <ThemeCard style={{ marginBottom: '1rem' }}>
            <h2 style={{ marginTop: 0 }}>{editingId ? 'Edit Shop' : 'Add Shop'}</h2>
            {editingId && (
              <div style={{ marginBottom: '0.5rem', color: theme?.colors?.foregroundSecondary }}>
                A shop already exists. Add is disabled — update the existing shop below.
              </div>
            )}
            <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label htmlFor="name" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: theme?.colors?.foregroundSecondary }}>Name</label>
                  <ThemeInput id="name" name="name" placeholder="Shop name" value={form.name} onChange={onChange} />
                </div>
                <div>
                  <label htmlFor="contact_number" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: theme?.colors?.foregroundSecondary }}>Contact number</label>
                  <ThemeInput id="contact_number" name="contact_number" placeholder="Contact number" value={form.contact_number} onChange={onChange} />
                </div>
              </div>

              <div>
                <label htmlFor="address" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: theme?.colors?.foregroundSecondary }}>Address</label>
                <ThemeInput id="address" name="address" placeholder="Address" value={form.address} onChange={onChange} />
              </div>

              <div>
                <label htmlFor="logo_url" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: theme?.colors?.foregroundSecondary }}>Logo URL</label>
                <ThemeInput id="logo_url" name="logo_url" placeholder="Logo URL (https://...)" value={form.logo_url} onChange={onChange} />
              </div>

              <div>
                <label htmlFor="footer" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: theme?.colors?.foregroundSecondary }}>Footer text</label>
                <ThemeInput id="footer" name="footer" placeholder="Footer text (receipt footer)" value={form.footer} onChange={onChange} />
              </div>

              <div>
                <label htmlFor="developer_note" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: theme?.colors?.foregroundSecondary }}>Developer note (read-only)</label>
                <ThemeInput id="developer_note" name="developer_note" placeholder="Developer note (internal)" value={form.developer_note} readOnly style={{ background: theme?.colors?.muted, cursor: 'not-allowed' }} onChange={onChange} />
              </div>

              {/* Invoice Print Settings */}
              <div style={{ 
                marginTop: '1rem',
                padding: '1rem',
                border: `2px dashed ${theme?.colors?.border}`,
                borderRadius: '8px',
                background: theme?.colors?.backgroundSecondary
              }}>
                <h3 style={{ 
                  margin: '0 0 0.75rem 0', 
                  fontSize: '1rem', 
                  color: theme?.colors?.primary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🖨️ Invoice Print Settings
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input 
                      type="checkbox" 
                      id="hide_sell_price" 
                      name="hide_sell_price" 
                      checked={form.hide_sell_price}
                      onChange={onChange}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <label htmlFor="hide_sell_price" style={{ 
                      fontSize: '0.9rem', 
                      color: theme?.colors?.foreground,
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}>
                      Hide "Sell Price" column in invoice prints
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input 
                      type="checkbox" 
                      id="hide_total_discount" 
                      name="hide_total_discount" 
                      checked={form.hide_total_discount}
                      onChange={onChange}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <label htmlFor="hide_total_discount" style={{ 
                      fontSize: '0.9rem', 
                      color: theme?.colors?.foreground,
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}>
                      Hide "Total Discount" line and value in invoice prints
                    </label>
                  </div>
                </div>
                
                <div style={{ 
                  marginTop: '0.5rem',
                  fontSize: '0.8rem',
                  color: theme?.colors?.foregroundSecondary,
                  fontStyle: 'italic'
                }}>
                  • <strong>Hide Sell Price:</strong> Removes the "Sell Price" column from invoice table<br/>
                  • <strong>Hide Total Discount:</strong> Removes the "Total Discount: Rs. X.XX" line from invoice summary<br/>
                  You can toggle these anytime to customize your invoice layout.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <ThemeButton type="submit" disabled={saving}>{saving ? 'Saving...' : (editingId ? 'Update' : 'Add')}</ThemeButton>
                {editingId && <ThemeButton type="button" onClick={cancelEdit} style={{ background: theme?.colors?.muted }}>Cancel</ThemeButton>}
              </div>
            </form>
          </ThemeCard>

          <ThemeCard>
            <h2 style={{ marginTop: 0 }}>Shop List</h2>
            {loading ? (
              <ThemeLoading text="Loading shops..." />
            ) : error ? (
              <div style={{ color: 'red' }}>{error}</div>
            ) : shops.length === 0 ? (
              <div>No shops found.</div>
            ) : (
              <ThemeGrid columns="repeat(auto-fit, minmax(260px, 1fr))" gap="md">
                {shops.map((shop) => (
                  <div key={shop.id ?? shop._id} style={{ padding: '0.75rem', borderRadius: 8, background: theme?.colors?.card, border: `1px solid ${theme?.colors?.border || '#eee'}` }}>
                    <h3 style={{ margin: 0 }}>{shop.name}</h3>
                    {/* description column removed from DB; omit display */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem' }}>
                      {shop.logo_url ? (
                        <img src={shop.logo_url} alt="logo" style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 6, border: `1px solid ${theme?.colors?.border || '#eee'}` }} />
                      ) : null}
                      <div style={{ fontSize: '0.9rem', color: theme?.colors?.foregroundSecondary }}>
                        <div>{shop.address}</div>
                        <div>{shop.contact_number}</div>
                        <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ 
                            fontSize: '0.8rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            background: Boolean(shop.hide_sell_price) ? theme?.colors?.errorLight : theme?.colors?.successLight,
                            color: Boolean(shop.hide_sell_price) ? theme?.colors?.error : theme?.colors?.success,
                            fontWeight: '600',
                            display: 'inline-block'
                          }}>
                            🖨️ Sell Price: {Boolean(shop.hide_sell_price) ? 'Hidden' : 'Visible'}
                          </div>
                          
                          <div style={{ 
                            fontSize: '0.8rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            background: Boolean(shop.hide_total_discount) ? theme?.colors?.errorLight : theme?.colors?.successLight,
                            color: Boolean(shop.hide_total_discount) ? theme?.colors?.error : theme?.colors?.success,
                            fontWeight: '600',
                            display: 'inline-block'
                          }}>
                            💰 Total Discount: {Boolean(shop.hide_total_discount) ? 'Hidden' : 'Visible'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <ThemeButton onClick={() => startEdit(shop)}>Edit</ThemeButton>
                      {/* Delete button intentionally hidden per request */}
                    </div>
                  </div>
                ))}
              </ThemeGrid>
            )}
          </ThemeCard>
        </ThemeContainer>
      </FastPageLoader>
    </AuthWrapper>
  );
}
