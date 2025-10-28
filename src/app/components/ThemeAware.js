"use client";
import { useTheme } from '../theme-context';
import { forwardRef } from 'react';

// Theme-aware Button component
export const ThemeButton = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  style = {}, 
  ...props 
}, ref) => {
  const { theme } = useTheme();
  
  const baseClasses = 'btn';
  // Map variant aliases to the CSS class names defined in globals.css
  const variantMap = {
    error: 'danger',
    danger: 'danger',
    primary: 'primary',
    secondary: 'secondary',
    success: 'success',
    warning: 'warning',
    outline: 'outline'
  };
  const variantClass = `btn-${variantMap[variant] || variant}`;
  const sizeClass = size !== 'md' ? `btn-${size}` : '';
  
  const combinedClassName = [baseClasses, variantClass, sizeClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      className={combinedClassName}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
});

ThemeButton.displayName = 'ThemeButton';

// Theme-aware Card component
export const ThemeCard = ({ 
  children, 
  className = '', 
  style = {}, 
  hover = true,
  ...props 
}) => {
  const { theme } = useTheme();
  
  const cardClasses = `card ${className}`;
  
  return (
    <div
      className={cardClasses}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

// Theme-aware Input component
export const ThemeInput = forwardRef(({ 
  className = '', 
  style = {}, 
  ...props 
}, ref) => {
  const { theme } = useTheme();
  
  return (
    <input
      ref={ref}
      className={`form-control ${className}`}
      style={style}
      {...props}
    />
  );
});

ThemeInput.displayName = 'ThemeInput';

// Theme-aware Table component
export const ThemeTable = ({ 
  children, 
  className = '', 
  style = {}, 
  ...props 
}) => {
  const { theme } = useTheme();
  
  return (
    <table
      className={`table ${className}`}
      style={style}
      {...props}
    >
      {children}
    </table>
  );
};

// Theme-aware Label component
export const ThemeLabel = ({ 
  children, 
  className = '', 
  style = {}, 
  ...props 
}) => {
  const { theme } = useTheme();
  
  return (
    <label
      className={`form-label ${className}`}
      style={style}
      {...props}
    >
      {children}
    </label>
  );
};

// Theme-aware Badge component
export const ThemeBadge = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  style = {}, 
  ...props 
}) => {
  const { theme } = useTheme();
  
  const badgeClasses = `badge badge-${variant} ${className}`;
  
  return (
    <span
      className={badgeClasses}
      style={style}
      {...props}
    >
      {children}
    </span>
  );
};

// Theme-aware Alert component
export const ThemeAlert = ({ 
  children, 
  variant = 'info', 
  className = '', 
  style = {}, 
  dismissible = false,
  onDismiss,
  ...props 
}) => {
  const { theme } = useTheme();
  
  const alertClasses = `alert alert-${variant} ${className}`;
  
  return (
    <div
      className={alertClasses}
      style={style}
      {...props}
    >
      {children}
      {dismissible && (
        <button
          type="button"
          className="btn-close"
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            float: 'right',
            fontSize: '1.2rem',
            cursor: 'pointer',
            color: 'currentColor'
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

// Theme-aware Container component
export const ThemeContainer = ({ 
  children, 
  className = '', 
  style = {}, 
  fluid = false,
  ...props 
}) => {
  const { theme } = useTheme();
  
  const containerStyle = {
    maxWidth: fluid ? '100%' : '1200px',
    margin: '0 auto',
    padding: '0 var(--spacing-lg)',
    ...style
  };
  
  return (
    <div
      className={className}
      style={containerStyle}
      {...props}
    >
      {children}
    </div>
  );
};

// Theme-aware Grid component
export const ThemeGrid = ({ 
  children, 
  columns = 1, 
  gap = 'md', 
  className = '', 
  style = {}, 
  ...props 
}) => {
  const { theme } = useTheme();
  
  const gapSizes = {
    xs: 'var(--spacing-xs)',
    sm: 'var(--spacing-sm)',
    md: 'var(--spacing-md)',
    lg: 'var(--spacing-lg)',
    xl: 'var(--spacing-xl)'
  };
  
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: typeof columns === 'number' 
      ? `repeat(${columns}, 1fr)` 
      : columns,
    gap: gapSizes[gap] || gapSizes.md,
    ...style
  };
  
  return (
    <div
      className={`grid ${className}`}
      style={gridStyle}
      {...props}
    >
      {children}
    </div>
  );
};

// Theme-aware Modal component
export const ThemeModal = ({ 
  children, 
  isOpen, 
  onClose, 
  title, 
  className = '', 
  style = {}, 
  ...props 
}) => {
  const { theme } = useTheme();
  
  if (!isOpen) return null;
  
  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050
      }}
      onClick={onClose}
    >
      <div
        className={`card ${className}`}
        style={{
          minWidth: '400px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          ...style
        }}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {title && (
          <div className="card-header">
            <h4 style={{ margin: 0 }}>{title}</h4>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: 'var(--foreground-secondary)'
              }}
            >
              ×
            </button>
          </div>
        )}
        <div className="card-body">
          {children}
        </div>
      </div>
    </div>
  );
};

// Theme-aware Loading component
export const ThemeLoading = ({ 
  text = 'Loading...', 
  size = 'md', 
  className = '', 
  style = {} 
}) => {
  const { theme } = useTheme();
  
  const sizes = {
    sm: '16px',
    md: '24px',
    lg: '32px'
  };
  
  return (
    <div
      className={`flex-center ${className}`}
      style={{ 
        padding: 'var(--spacing-lg)',
        ...style 
      }}
    >
      <div
        className="spin"
        style={{
          width: sizes[size],
          height: sizes[size],
          border: '2px solid var(--border)',
          borderTop: '2px solid var(--primary)',
          borderRadius: '50%',
          marginRight: text ? 'var(--spacing-sm)' : 0
        }}
      />
      {text && <span>{text}</span>}
    </div>
  );
};

// Theme provider hook for easy access to theme colors
export const useThemeColors = () => {
  const { theme } = useTheme();
  return theme?.colors || {};
};

// Theme style helper function
export const getThemeStyle = (themeColors, customStyles = {}) => {
  return {
    ...customStyles,
    color: themeColors.foreground,
    backgroundColor: themeColors.background,
    borderColor: themeColors.border
  };
};