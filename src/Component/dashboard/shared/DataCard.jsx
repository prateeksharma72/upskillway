import React from 'react';
import './DataCard.scss'; // Changed to .scss

const DataCard = ({ title, data, type = 'object' }) => {
  if (!data) return null;

  return (
    <div className="data-card">
      {title && <h4>{title}</h4>}
      {type === 'object' && (
        <ul>
          {Object.entries(data).map(([key, value]) => {
            // Skip null or undefined values gracefully for display
            if (value === null || value === undefined) return null;
            
            let displayValue = String(value);
            if (typeof value === 'number') {
              // Check if it's a float or int for formatting
              displayValue = Number.isInteger(value) ? value.toLocaleString() : parseFloat(value.toFixed(4)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4});
            }
            // Special handling for changePercent which is already a string with '%'
            if (key.toLowerCase().includes('percent') && typeof value === 'string' && value.includes('%')) {
                 displayValue = value;
            }


            return (
              <li key={key}>
                <strong>{key.replace(/^[0-9]+\.\s*/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {/* Improved key formatting */}
                <span>{displayValue}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default DataCard;