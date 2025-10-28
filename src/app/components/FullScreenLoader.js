"use client";
import React from 'react';
import { useLoading } from '../loading-context';

export default function FullScreenLoader({ message = 'Loading…' }) {
  const { loading } = useLoading();
  if (!loading) return null;

  return (
    <div style={overlayStyle} aria-live="polite">
      <div style={boxStyle}>
        <div style={spinnerStyle} />
        <div style={{ marginTop: 12, fontSize: 16, fontWeight: 600 }}>{message}</div>
      </div>
      <style jsx>{`
        @keyframes fs-spin { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(10,11,13,0.6)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
  backdropFilter: 'blur(4px)'
};

const boxStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 24,
  borderRadius: 10,
  background: 'rgba(255,255,255,0.02)',
  color: '#fff',
  textAlign: 'center'
};

const spinnerStyle = {
  width: 64,
  height: 64,
  borderRadius: '50%',
  border: '6px solid rgba(255,255,255,0.15)',
  borderTop: '6px solid #ffd54a',
  animation: 'fs-spin 0.9s linear infinite'
};
