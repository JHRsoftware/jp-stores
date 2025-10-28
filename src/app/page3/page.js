
'use client';
import AuthWrapper from '../components/AuthWrapper';

export default function Page3() {
  return (
    <AuthWrapper>
      <div
        style={{
          minHeight: 'calc(100vh - 40px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <h2>Page 3</h2>
        <p>This is sample page 3.</p>
      </div>
    </AuthWrapper>
  );
}
