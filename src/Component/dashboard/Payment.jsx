// src/Component/dashboard/Payment.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from "../dashboard/Sidebar";
import './Style/Payment.scss';

const PaymentUrl = process.env.REACT_APP_API_BASE_URL;

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [authToken] = useState(localStorage.getItem("authToken"));
  
  // Enhanced extraction of props from location.state
  const locationState = location.state || {};
  const { 
    purchaseDetails, 
    isManualPayment, 
    planId: locationPlanId, 
    planDetails,
    plan_id: altPlanId,
    id: genericId
  } = locationState;
  
  // IMPROVED: More robust planId determination logic
  const determinePlanId = useCallback(() => {
    console.log('=== DETERMINE PLAN ID DEBUG ===');
    console.log('Location state:', locationState);
    console.log('URL search:', location.search);
    
    // Check URL params first
    const urlParams = new URLSearchParams(location.search);
    const urlPlanId = urlParams.get('planId') || urlParams.get('plan_id') || urlParams.get('id');
    
    console.log('URL planId candidates:', {
      planId: urlParams.get('planId'),
      plan_id: urlParams.get('plan_id'),
      id: urlParams.get('id'),
      final: urlPlanId
    });
    
    // Try different sources in order of priority
    const sources = [
      { name: 'urlPlanId', value: urlPlanId },
      { name: 'locationPlanId', value: locationPlanId },
      { name: 'altPlanId', value: altPlanId },
      { name: 'genericId', value: genericId },
      { name: 'locationState.planId', value: locationState.planId },
      { name: 'locationState.plan_id', value: locationState.plan_id },
      { name: 'locationState.id', value: locationState.id },
      { name: 'planDetails.id', value: planDetails?.id },
      { name: 'planDetails.planId', value: planDetails?.planId }
    ];
    
    console.log('All planId sources:', sources);
    
    for (const source of sources) {
      const value = source.value;
      console.log(`Checking ${source.name}: ${value} (type: ${typeof value})`);
      
      if (value != null && value !== '' && value !== 0 && value !== '0') {
        // Try to convert to number
        let numeric;
        if (typeof value === 'number') {
          numeric = value;
        } else if (typeof value === 'string') {
          numeric = parseInt(value.toString().trim(), 10);
        } else {
          continue;
        }
        
        if (!isNaN(numeric) && numeric > 0) {
          console.log(`✅ Found valid planId from ${source.name}: ${numeric}`);
          return numeric;
        }
      }
    }
    
    console.log('❌ No valid planId found from any source');
    return null;
  }, [location.search, locationState, locationPlanId, altPlanId, genericId, planDetails]);
  
  // Use the determined planId
  const initialPlanId = determinePlanId();
  
  const [paymentData, setPaymentData] = useState({
    planId: initialPlanId || '', // Changed from 'id' to 'planId'
    amount: purchaseDetails?.totalCost || planDetails?.amount || '',
    symbol: purchaseDetails?.symbol || '',
    quantity: purchaseDetails?.quantity || '',
    price: purchaseDetails?.price || '',
    buyer_name: '',
    email: '',
    phone: '',
    description: '',
    useDefaultLink: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [statusPolling, setStatusPolling] = useState(false);

  const getValidPlanId = useCallback(() => {
    const currentId = paymentData.planId;
    
    console.log('=== GET VALID PLAN ID ===');
    console.log('paymentData.planId:', currentId, `(type: ${typeof currentId})`);
    
    if (currentId != null && currentId !== '' && currentId !== 0 && currentId !== '0') {
      const numeric = typeof currentId === 'number' ? currentId : parseInt(currentId.toString().trim(), 10);
      
      if (!isNaN(numeric) && numeric > 0) {
        console.log(`✅ Valid planId: ${numeric}`);
        return numeric;
      }
    }
    
    console.log('❌ No valid planId');
    return null;
  }, [paymentData.planId]);

  // Effect to initialize paymentData based on props and determined planId
  useEffect(() => {
    console.log('=== PAYMENT DATA INITIALIZATION ===');
    console.log('initialPlanId:', initialPlanId);
    console.log('purchaseDetails:', purchaseDetails);
    console.log('isManualPayment:', isManualPayment);
    console.log('planDetails:', planDetails);
    
    // Set description based on the type of payment
    if (purchaseDetails && !isManualPayment) {
      setPaymentData(prev => ({
        ...prev,
        description: `Purchase of ${purchaseDetails.quantity} shares of ${purchaseDetails.symbol} at ₹${purchaseDetails.price} per share`,
      }));
    } else if (isManualPayment) {
      setPaymentData(prev => ({ 
        ...prev, 
        description: 'Manual payment',
      }));
    } else if (initialPlanId && planDetails) {
      setPaymentData(prev => ({
        ...prev,
        description: `Payment for plan: ${planDetails.name || `Plan ${initialPlanId}`}`,
      }));
    }
  }, [initialPlanId, purchaseDetails, isManualPayment, planDetails]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPaymentData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  // Check payment status using transaction ID
  const checkPaymentStatus = async (txnId) => {
    try {
      const response = await axios.get(`${PaymentUrl}/api/payments/status/${txnId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (response.data.success) {
        const status = response.data.status || response.data.transaction?.status;
        setPaymentStatus(status);
        return status;
      }
      return null;
    } catch (error) {
      console.error('Status check error:', error);
      return null;
    }
  };

  // Poll payment status
  const startStatusPolling = (txnId) => {
    setStatusPolling(true);
    const pollInterval = setInterval(async () => {
      const status = await checkPaymentStatus(txnId);
      
      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        clearInterval(pollInterval);
        setStatusPolling(false);
        
        if (status === 'completed') {
          setSuccess('Payment completed successfully!');
          setTimeout(() => navigate('/dashboard'), 3000);
        } else {
          setError(`Payment ${status}. Please try again.`);
        }
      }
    }, 3000);

    setTimeout(() => {
      clearInterval(pollInterval);
      setStatusPolling(false);
    }, 600000); 
  };

  const handleStatusCheck = () => {
    if (transactionId) {
      checkPaymentStatus(transactionId);
    }
  };

  // Main payment submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const currentPlanId = getValidPlanId();
      
      console.log('=== PAYMENT SUBMISSION ===');
      console.log('currentPlanId:', currentPlanId);
      
      // Validate Plan ID
      if (!currentPlanId || !Number.isInteger(currentPlanId) || currentPlanId <= 0) {
        setError('Please enter a valid Plan ID (must be greater than 0).');
        setLoading(false);
        return;
      }

      // Prepare request data
      const requestData = {
        planId: Number(currentPlanId),
        useDefaultLink: Boolean(paymentData.useDefaultLink)
      };
      
      // Add optional fields if provided
      if (paymentData.buyer_name && paymentData.buyer_name.trim()) {
        requestData.buyer_name = paymentData.buyer_name.trim();
      }
      if (paymentData.email && paymentData.email.trim()) {
        requestData.email = paymentData.email.trim();
      }
      if (paymentData.phone && paymentData.phone.trim()) {
        requestData.phone = paymentData.phone.trim();
      }

      console.log('=== PLAN PAYMENT REQUEST ===');
      console.log('Request data:', JSON.stringify(requestData, null, 2));
      
      // Make the API request
      console.log('=== SENDING REQUEST ===');
      console.log('URL:', `${PaymentUrl}/api/payments/initiate`);

      const response = await axios.post(`${PaymentUrl}/api/payments/initiate`, requestData, {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('=== API RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Data:', response.data);

      if (response.data.success) {
        const { transaction_id, payment_url, instamojo_request_id } = response.data;
        
        if (transaction_id) {
          setTransactionId(transaction_id);
          setSuccess(`Payment initiated successfully! Transaction ID: ${transaction_id}`);
          
          // If there's a payment URL, open it
          if (payment_url) {
            window.open(payment_url, '_blank');
            setSuccess(prev => prev + ' Complete payment in the new tab.');
            startStatusPolling(transaction_id);
          } else if (paymentData.useDefaultLink) {
            setSuccess('Payment link generated. Please check your default payment link.');
          }
        } else {
          setError('Payment initiated but no transaction ID received.');
        }
      } else {
        setError(response.data.message || 'Payment initiation failed.');
      }

    } catch (err) {
      console.log('=== ERROR HANDLING ===');
      console.error('Full error:', err);
      
      if (err.response) {
        console.error('Response error:', err.response.data);
        console.error('Response status:', err.response.status);
        
        const errorData = err.response.data;
        let errorMessage = `Error ${err.response.status}: `;
        
        if (errorData?.message) {
          errorMessage += errorData.message;
        } else if (errorData?.error) {
          errorMessage += errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage += errorData;
        } else {
          errorMessage += 'Payment processing failed.';
        }
        
        if (err.response.status === 400) {
          errorMessage += '\n\nPossible issues:\n';
          errorMessage += '- Missing or invalid Plan ID\n';
          errorMessage += '- Plan ID must be greater than 0';
        }
        
        setError(errorMessage);
      } else if (err.request) {
        setError('Network error: Unable to connect to payment server.');
      } else {
        setError(`Request setup error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset form for new payment
  const resetPayment = () => {
    setPaymentStatus(null);
    setTransactionId(null);
    setPaymentId(null);
    setError('');
    setSuccess('');
    setStatusPolling(false);
    setPaymentData(prev => ({
      ...prev,
      buyer_name: '',
      email: '',
      phone: '',
      useDefaultLink: false
    }));
  };

  const isFormValid = () => {
    const currentPlanId = getValidPlanId();
    return currentPlanId && Number.isInteger(currentPlanId) && currentPlanId > 0;
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'completed':
        return '✅';
      case 'failed':
      case 'cancelled':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '💳';
    }
  };

  const getPaymentTypeDisplay = () => {
    const currentPlanId = getValidPlanId();
    
    if (currentPlanId && planDetails) {
      return (
        <div className="plan-payment-info">
          <h3>Plan Payment</h3>
          <div className="plan-summary">
            <p><strong>Plan ID:</strong> <span>{currentPlanId}</span></p>
            <p><strong>Plan Name:</strong> <span>{planDetails.name || 'N/A'}</span></p>
            {planDetails.amount && <p><strong>Amount:</strong> <span>₹{planDetails.amount}</span></p>}
            {planDetails.description && <p><strong>Description:</strong> <span>{planDetails.description}</span></p>}
          </div>
        </div>
      );
    } else {
      return (
        <div className="no-details-info">
          <h3>Payment</h3>
          <p>Plan Payment Required</p>
        </div>
      );
    }
  };

  const currentPlanId = getValidPlanId();

  return (
    <div className="dashboard-page payment-page">
      <Sidebar />
      <div className="payment-container">
        <h2>Instamojo Payment Gateway</h2>
        
        <div className="payment-type-indicator">
          {getPaymentTypeDisplay()}
        </div>

        {/* Payment Status Display */}
        {paymentStatus && (
          <div className={`payment-status ${paymentStatus.toLowerCase()}`}>
            <div className="status-content">
              <span className="status-icon">{getStatusIcon()}</span>
              <div className="status-text">
                <h4>Payment Status: {paymentStatus}</h4>
                {transactionId && <p className="transaction-id">Transaction ID: {transactionId}</p>}
                {paymentId && <p className="payment-id">Payment ID: {paymentId}</p>}
                {statusPolling && <p className="polling-text">Checking payment status...</p>}
              </div>
            </div>
            <div className="status-actions">
              <button
                type="button"
                onClick={handleStatusCheck}
                className="btn btn-secondary btn-sm"
                disabled={statusPolling}
              >
                {statusPolling ? 'Checking...' : 'Refresh Status'}
              </button>
              {(paymentStatus === 'completed' || paymentStatus === 'failed' || paymentStatus === 'cancelled') && (
                <button
                  type="button"
                  onClick={resetPayment}
                  className="btn btn-primary btn-sm"
                >
                  New Payment
                </button>
              )}
            </div>
          </div>
        )}

        {/* Payment Form */}
        {(!paymentStatus || paymentStatus === 'completed' || paymentStatus === 'failed' || paymentStatus === 'cancelled') && (
          <div className="payment-form">
            <form onSubmit={handleSubmit}>
              {/* Plan ID Field - Now Required and Cannot be Zero */}
              <div className="form-group">
                <label htmlFor="planId">Plan ID *</label>
                <input
                  id="planId"
                  type="number"
                  name="planId"
                  value={paymentData.planId || ''}
                  onChange={handleInputChange}
                  placeholder="Enter Plan ID (must be > 0)"
                  required
                  min="1"
                  style={{
                    borderColor: currentPlanId ? '#28a745' : '#dc3545'
                  }}
                />
                <small style={{ color: currentPlanId ? '#28a745' : '#dc3545' }}>
                  {currentPlanId 
                    ? `✅ Valid Plan ID: ${currentPlanId}` 
                    : '❌ Plan ID is required and must be greater than 0'
                  }
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="buyer_name">Buyer Name</label>
                <input
                  id="buyer_name"
                  type="text"
                  name="buyer_name"
                  value={paymentData.buyer_name}
                  onChange={handleInputChange}
                  placeholder="Enter buyer name (optional)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={paymentData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address (optional)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={paymentData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number (optional)"
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="useDefaultLink"
                    checked={paymentData.useDefaultLink}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-text">Use Default Payment Link</span>
                  <span className="field-description">
                    (Uses a pre-configured payment link instead of generating a new one)
                  </span>
                </label>
              </div>

              {error && <div className="error-message" style={{whiteSpace: 'pre-line'}}>{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="instamojo-info">
                <h4>How Instamojo Payment Works:</h4>
                <ol>
                  <li>Enter a valid Plan ID (greater than 0)</li>
                  <li>Optionally fill in your details for a personalized experience</li>
                  <li>Click "Proceed with Payment" to initiate the payment</li>
                  <li>You'll be redirected to Instamojo's secure payment page</li>
                  <li>Complete the payment using your preferred method</li>
                  <li>Return to this page for real-time payment status updates</li>
                </ol>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => navigate('/dashboard')} 
                  className="btn btn-secondary"
                  disabled={loading || statusPolling}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading || statusPolling || !isFormValid()} 
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Processing...
                    </>
                  ) : (
                    'Proceed with Payment'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
