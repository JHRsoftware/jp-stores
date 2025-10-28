"use client";
import { useRouter } from 'next/navigation';

const QUICK_ACTIONS = [
  { 
    label: 'Create Invoice', 
    description: 'Create new invoice',
    icon: '🧾', 
    path: '/invoice/addInvoice',
    color: '#4f46e5'
  },
  { 
    label: 'View Reports', 
    description: 'Analytics & insights',
    icon: '📈', 
    path: '/dashboard',
    color: '#059669'
  },
  { 
    label: 'Manage Products', 
    description: 'Product inventory',
    icon: '📦', 
    path: '/products//items',
    color: '#dc2626'
  },
  { 
    label: 'Customers', 
    description: 'Customer database',
    icon: '👥', 
    path: '/customers',
    color: '#7c3aed'
  }
];

export default function QuickActions() {
  const router = useRouter();

  return (
    <div className="quick-actions">
      <h3>Quick Actions</h3>
      <div className="actions-grid">
        {QUICK_ACTIONS.map((action, index) => (
          <button
            key={action.label}
            className="action-card"
            onClick={() => router.push(action.path)}
            style={{ '--accent-color': action.color }}
          >
            <div className="action-icon" style={{ backgroundColor: action.color + '20' }}>
              <span>{action.icon}</span>
            </div>
            <div className="action-content">
              <div className="action-label">{action.label}</div>
              <div className="action-description">{action.description}</div>
            </div>
            <div className="action-arrow">→</div>
          </button>
        ))}
      </div>

      <style jsx>{`
        .quick-actions {
          margin-bottom: var(--spacing-xl);
        }

        .quick-actions h3 {
          margin-bottom: var(--spacing-lg);
          color: var(--foreground);
          font-size: 1.3rem;
          font-weight: 700;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-md);
        }

        .action-card {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-lg);
          background: var(--background);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
          border-left: 4px solid var(--accent-color);
        }

        .action-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-medium);
          border-left-color: var(--accent-color);
        }

        .action-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .action-content {
          flex: 1;
        }

        .action-label {
          font-weight: 600;
          color: var(--foreground);
          margin-bottom: 4px;
        }

        .action-description {
          font-size: 0.8rem;
          color: var(--foreground);
          opacity: 0.7;
        }

        .action-arrow {
          color: var(--foreground);
          opacity: 0.5;
          font-weight: bold;
          transition: all var(--transition-fast);
        }

        .action-card:hover .action-arrow {
          opacity: 1;
          transform: translateX(4px);
        }

        @media (max-width: 768px) {
          .actions-grid {
            grid-template-columns: 1fr;
          }
          
          .action-card {
            padding: var(--spacing-md);
          }
        }
      `}</style>
    </div>
  );
}