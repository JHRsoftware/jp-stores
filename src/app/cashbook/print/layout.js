export const metadata = { title: 'Cashbook Print' };

export default function PrintLayout({ children }) {
  // Minimal wrapper for printing: no sidebar, no app chrome, neutral colors
  return (
    <div style={{ margin: 0, padding: 0, background: '#fff', color: '#000' }}>
      {children}
    </div>
  );
}
