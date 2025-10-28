"use client";
import React, { useState } from "react";
import { useLoading } from '../../loading-context';
// Removed missing component imports

export default function ItemExpiredDatePage() {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState(null);
  const { setLoading: setGlobalLoading } = useLoading();

  const handleLoad = async () => {
    setLoading(true);
    try {
      setGlobalLoading(true);
    try {
      const res = await fetch('/api/products/itemExpiredDate');
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      const rawData = json.data || [];
      
      // Sort by expiry date (oldest first)
      const sortedData = rawData.sort((a, b) => {
        const dateA = new Date(a.expired_date);
        const dateB = new Date(b.expired_date);
        return dateA - dateB; // Ascending order (oldest first)
      });
      
      setData(sortedData);
    } catch (err) {
      setData([]);
      alert('Failed to load data');
    }
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch('/api/products/itemExpiredDate', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Delete failed');
      // Reload data after delete
      handleLoad();
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Item Expiry Date Management</h2>
      <button
        onClick={handleLoad}
        disabled={loading}
        style={{
          padding: '8px 16px',
          fontSize: 16,
          marginBottom: 16,
          background: loading ? '#aaa' : '#1976d2',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s, transform 0.12s',
          animation: loading ? undefined : 'blinkHighlight 1.2s linear infinite',
        }}
      >
        {loading ? 'Loading...' : 'Load'}
      </button>
      <style>{`
        @keyframes blinkHighlight {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(255,197,24,0);
            background: #1976d2;
            color: #fff;
            transform: translateY(0) scale(1);
          }
          50% {
            box-shadow: 0 0 18px 6px rgba(255,197,24,0.45);
            background: #ffd54a;
            color: #111;
            transform: translateY(-1px) scale(1.02);
          }
        }
      `}</style>
      {data && data.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
          <thead>
            <tr>
              {/* <th style={{ border: '1px solid #ccc', padding: 8 }}>ID</th> */}
              <th style={{ border: '1px solid #ccc', padding: 8 }}>Item ID</th>
              <th style={{ border: '1px solid #ccc', padding: 8 }}>Item Name</th>
              <th style={{ border: '1px solid #ccc', padding: 8 }}>Expiry Date</th>
              <th style={{ border: '1px solid #ccc', padding: 8 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id}>
                {/* <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.id}</td> */}
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.item_id}</td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.item_name}</td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{item.expired_date}</td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      background: '#d32f2f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {data && data.length === 0 && !loading && (
        <div style={{ marginTop: 16, color: '#888' }}>No data found.</div>
      )}
    </div>
  );
}
