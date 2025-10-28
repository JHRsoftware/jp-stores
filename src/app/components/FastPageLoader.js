"use client";
import { Suspense } from 'react';

// Fast loading component with minimal overhead
const FastLoader = ({ size = 'medium' }) => {
  const sizeMap = {
    small: '24px',
    medium: '40px',
    large: '60px'
  };

  return (
    <div 
      className="fast-loader-container"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: size === 'large' ? '100vh' : '200px',
        background: 'transparent'
      }}
    >
      <div 
        className="spinner"
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}
      />
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .fast-loader-container {
          will-change: auto;
        }
        .spinner {
          will-change: transform;
        }
      `}</style>
    </div>
  );
};

// High-performance page wrapper
export default function FastPageLoader({ children, loading = false }) {
  if (loading) {
    return <FastLoader size="large" />;
  }

  return (
    <Suspense fallback={<FastLoader size="medium" />}>
      <div className="page-content fade-in">
        {children}
      </div>
    </Suspense>
  );
}

// Utility function for lazy loading components
export const withFastLoader = (Component, loaderSize = 'medium') => {
  return function WrappedComponent(props) {
    return (
      <Suspense fallback={<FastLoader size={loaderSize} />}>
        <Component {...props} />
      </Suspense>
    );
  };
};