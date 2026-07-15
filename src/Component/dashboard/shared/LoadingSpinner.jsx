import React from 'react';
import './Spinner.scss'; // Changed to .scss

const LoadingSpinner = () => (
  <div className="spinner-overlay">
    <div className="spinner"></div>
  </div>
);

export default LoadingSpinner;