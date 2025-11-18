import React from 'react';
import { ArrowDown, ArrowUp, ArrowRight, XCircle } from 'lucide-react';
import './StockLog.css';

// Helper to format the timestamp
const formatTimestamp = (ts) => {
  return new Date(ts).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function StockLog({ logs = [], error }) {
  
  const getChangeIcon = (log) => {
    if (log.reason === 'Product Deleted') {
      return <XCircle className="icon icon-deleted" />;
    }
    if (log.old_quantity < log.new_quantity) {
      return <ArrowUp className="icon icon-up" />;
    }
    if (log.old_quantity > log.new_quantity) {
      return <ArrowDown className="icon icon-down" />;
    }
    return <ArrowRight className="icon icon-no-change" />;
  };

  return (
    <div className="log-container">
      <h2>Stock Audit Log</h2>
      <p>Showing the 200 most recent stock changes.</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="log-table-wrapper">
        <table className="log-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Product (ID)</th>
              <th>Change</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-logs">No log entries found.</td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id}>
                  <td>{formatTimestamp(log.timestamp)}</td>
                  <td className="log-user">{log.user_name || 'System'}</td>
                  <td>
                    <div className="log-product-name">{log.product_name}</div>
                    <div className="log-product-id">ID: {log.product_id}</div>
                  </td>
                  <td>
                    <div className="log-change">
                      {getChangeIcon(log)}
                      <span>{log.old_quantity}</span>
                      <ArrowRight className="icon-arrow" />
                      <span>{log.new_quantity}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`log-reason reason-${log.reason.toLowerCase().replace(' ', '-')}`}>
                      {log.reason}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StockLog;
