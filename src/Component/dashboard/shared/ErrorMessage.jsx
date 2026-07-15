import React from 'react';
import './ErrorMessage.scss'; // Changed to .scss

const ErrorMessage = ({ message }) => (
  <div className="error-message">
    <p>Error: {message}</p>
  </div>
);

export default ErrorMessage;