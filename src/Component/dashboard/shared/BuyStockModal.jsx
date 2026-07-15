// src/components/shared/BuyStockModal.jsx

import React, { useState, useEffect } from 'react';
import './../Style/InvestmentTools.scss'; // We'll add the modal styles here

const BuyStockModal = ({ isOpen, onClose, symbol, currentPrice, onSubmit }) => {
  const [quantity, setQuantity] = useState(1);
  const [totalCost, setTotalCost] = useState(0);

  // Update total cost whenever quantity or price changes
  useEffect(() => {
    if (currentPrice && quantity > 0) {
      setTotalCost(currentPrice * quantity);
    } else {
      setTotalCost(0);
    }
  }, [quantity, currentPrice]);

  // Reset quantity when the modal is opened for a new stock
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setQuantity(value > 0 ? value : 1);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (quantity > 0) {
      onSubmit(quantity);
    }
  };

  return (
    // The main overlay that covers the screen
    <div className="modal-overlay" onClick={onClose}>
      {/* The modal content itself, stopPropagation prevents closing when clicking inside */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Buy Stock: {symbol?.toUpperCase()}</h3>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="price-info">
              <span>Current Price:</span>
              <span className="price-value">${currentPrice ? currentPrice.toFixed(2) : 'N/A'}</span>
            </div>
            <div className="form-group">
              <label htmlFor="quantity">Quantity:</label>
              <input
                id="quantity"
                type="number"
                value={quantity}
                onChange={handleQuantityChange}
                min="1"
                autoFocus // Automatically focus the input when modal opens
              />
            </div>
            <div className="total-cost-info">
              <span>Estimated Total:</span>
              <span className="total-cost-value">${totalCost.toFixed(2)}</span>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!quantity || quantity <= 0}>
              Confirm Purchase
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BuyStockModal;