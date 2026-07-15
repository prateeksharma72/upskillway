// src/Component/AdminDashboard/Withdrawal.jsx - PRODUCTION READY (FIXED & ENHANCED WITH TOASTS & RUPEE CURRENCY)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Style/Withdrawal.scss';

// --- START: API Configuration ---
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL,
  ENDPOINTS: {
    GET_ALL: '/api/withdrawals',
    APPROVE: (id) => `/api/withdrawals/${id}/approve`,
    REJECT: (id) => `/api/withdrawals/${id}/reject`,
  },
};

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
// --- END: API Configuration ---

// Helper functions

// --- MODIFIED LINE: Changed default currency from USD to INR ---
const formatCurrency = (value, currency = 'INR') => {
  if (typeof value !== 'number') return 'N/A';
  // Use 'en-IN' locale for Indian Rupee formatting (e.g., ₹1,00,000)
  return value.toLocaleString('en-IN', { style: 'currency', currency: currency });
};
// --- END OF MODIFICATION ---

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

// Fixed user info renderer - handles Sequelize included data
const renderUserInfo = (user, withdrawalId) => {
  console.log(`🔍 Processing user data for withdrawal ${withdrawalId}:`, user);
  
  if (!user || user === null || user === undefined) {
    console.warn(`⚠️ No user data for withdrawal ${withdrawalId}`);
    return (
      <div className="user-info">
        <span className="user-name" style={{color: '#ff6b6b'}}>Unknown User</span>
        <span className="user-email" style={{color: '#999'}}>No email provided</span>
      </div>
    );
  }

  // Debug: Log all available user properties
  console.log(`📋 User object keys for withdrawal ${withdrawalId}:`, Object.keys(user));
  console.log(`📝 User values:`, user);
  
  // Show actual field names and values for debugging
  const userKeys = Object.keys(user);
  console.log('🔍 ACTUAL USER FIELDS:');
  userKeys.forEach(key => {
    console.log(`  ${key}: "${user[key]}"`);
  });

  // Handle different user object structures flexibly
  let userName = 'Unknown User';
  let userEmail = 'No email provided';

  // Try multiple possible name fields (including common database field names)
  if (user.name && user.name.trim()) {
    userName = user.name.trim();
  } else if (user.fullName && user.fullName.trim()) {
    userName = user.fullName.trim();
  } else if (user.username && user.username.trim()) {
    userName = user.username.trim();
  } else if (user.displayName && user.displayName.trim()) {
    userName = user.displayName.trim();
  } else if (user.firstName && user.lastName) {
    userName = `${user.firstName} ${user.lastName}`.trim();
  } else if (user.firstName) {
    userName = user.firstName.trim();
  } else if (user.full_name && user.full_name.trim()) {
    userName = user.full_name.trim();
  } else if (user.first_name && user.last_name) {
    userName = `${user.first_name} ${user.last_name}`.trim();
  } else if (user.first_name) {
    userName = user.first_name.trim();
  }

  // Try multiple possible email fields
  if (user.email && user.email.trim()) {
    userEmail = user.email.trim();
  } else if (user.userEmail && user.userEmail.trim()) {
    userEmail = user.userEmail.trim();
  } else if (user.emailAddress && user.emailAddress.trim()) {
    userEmail = user.emailAddress.trim();
  } else if (user.mail && user.mail.trim()) {
    userEmail = user.mail.trim();
  } else if (user.email_address && user.email_address.trim()) {
    userEmail = user.email_address.trim();
  }

  console.log(`✅ Final user info for withdrawal ${withdrawalId}:`, { userName, userEmail });

  return (
    <div className="user-info">
      <span className="user-name">{userName}</span>
      <span className="user-email">{userEmail}</span>
    </div>
  );
};

const Withdrawal = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const fetchWithdrawals = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('🌐 Fetching withdrawals from:', API_CONFIG.ENDPOINTS.GET_ALL);
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.GET_ALL);
        console.log('✅ API Response:', response.data);
        
        if (!Array.isArray(response.data)) {
          throw new Error(`Expected array but received ${typeof response.data}`);
        }

        if (response.data.length > 0) {
          console.log('📋 First item structure:', response.data[0]);
        }
        
        setWithdrawals(response.data);
        
      } catch (err) {
        console.error('❌ Error fetching withdrawals:', err);
        setError(`Failed to fetch withdrawal requests: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWithdrawals();
  }, []);

  const handleAction = (id, actionType) => {
    const actionText = actionType === 'approve' ? 'approve' : 'reject';
    const confirmMessage = `Are you sure you want to ${actionText} withdrawal request #${id}?`;

    const performAction = async () => {
      setUpdatingId(id);
      const originalWithdrawals = [...withdrawals];
      
      const newStatus = actionType === 'approve' ? 'approved' : 'rejected';
      setWithdrawals(prev => 
        prev.map(w => w.id === id ? { ...w, status: newStatus } : w)
      );

      try {
        const endpoint = actionType === 'approve' 
          ? API_CONFIG.ENDPOINTS.APPROVE(id)
          : API_CONFIG.ENDPOINTS.REJECT(id);
        
        console.log(`🔄 ${actionType.toUpperCase()}ING withdrawal ${id} at:`, endpoint);
        const requestData = {
          adminNote: `${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} by admin on ${new Date().toLocaleString()}`
        };
        
        const response = await apiClient.post(endpoint, requestData);
        console.log(`✅ Successfully ${actionType}ed withdrawal ${id}:`, response.data);
        
        if (response.data && response.data.withdrawal) {
          setWithdrawals(prev => 
            prev.map(w => w.id === id ? { ...w, ...response.data.withdrawal } : w)
          );
        }
        
        toast.success(`✅ Withdrawal request #${id} has been ${newStatus} successfully!`);

      } catch (err) {
        console.error(`❌ Error ${actionType}ing withdrawal:`, err);
        setWithdrawals(originalWithdrawals);
        
        const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
        toast.error(<div><b>Failed to {actionType} withdrawal #{id}.</b><br /><small>Error: {errorMessage}</small></div>);
      } finally {
        setUpdatingId(null);
      }
    };

    const ConfirmationComponent = ({ closeToast }) => (
      <div>
        <p style={{ margin: '0 0 15px 0' }}>{confirmMessage}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            className="btn btn-toast-cancel"
            onClick={closeToast}
          >
            Cancel
          </button>
          <button
            className="btn btn-toast-confirm"
            onClick={() => {
              performAction();
              closeToast();
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    );

    toast(<ConfirmationComponent />, {
      position: "top-center",
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      toastId: `confirm-action-${id}`
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="loading-message">Loading withdrawal requests...</div>;
    }
    
    if (error) {
      return (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-retry">
            Retry
          </button>
        </div>
      );
    }
    
    if (withdrawals.length === 0) {
      return <div className="no-data-message">No withdrawal requests found.</div>;
    }

    return (
      <div className="table-container">
        <table className="withdrawal-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((w, index) => {
              const isUpdating = updatingId === w.id;
              
              let userData = null;
              if (w.User) {
                userData = w.User.dataValues || w.User;
              } else if (w.user) {
                userData = w.user.dataValues || w.user;
              } else {
                const possibleUserKey = Object.keys(w).find(key => key.toLowerCase().includes('user'));
                if (possibleUserKey) userData = w[possibleUserKey];
              }

              return (
                <tr key={w.id || `withdrawal-${index}`}>
                  <td data-label="User">
                    {renderUserInfo(userData, w.id)}
                  </td>
                  <td data-label="Amount" className="amount-cell">
                    {formatCurrency(w.amount)}
                  </td>
                  <td data-label="Date">
                    {w.createdAt ? formatDate(w.createdAt) : 'No date'}
                  </td>
                  <td data-label="Status">
                    <span className={`status-badge status-${(w.status || 'unknown').toLowerCase()}`}>
                      {w.status || 'Unknown'}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <div className="action-buttons">
                      {(w.status === 'Pending' || w.status === 'pending') && (
                        <>
                          <button 
                            onClick={() => handleAction(w.id, 'approve')} 
                            className="btn btn-approve"
                            disabled={isUpdating}
                            title={`Approve withdrawal request #${w.id}`}
                          >
                            {isUpdating ? '⏳ Processing...' : '✅ Approve'}
                          </button>
                          <button 
                            onClick={() => handleAction(w.id, 'reject')} 
                            className="btn btn-reject"
                            disabled={isUpdating}
                            title={`Reject withdrawal request #${w.id}`}
                          >
                            {isUpdating ? '⏳ Processing...' : '❌ Reject'}
                          </button>
                        </>
                      )}
                      {(w.status === 'approved' || w.status === 'Approved') && (
                        <span className="status-text approved-text">✅ Approved</span>
                      )}
                      {(w.status === 'rejected' || w.status === 'Rejected') && (
                        <span className="status-text rejected-text">❌ Rejected</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="withdrawal-page">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <header className="page-header">
        <h2>Manage Withdrawals</h2>
        <p>Review and process pending withdrawal requests.</p>
      </header>
      {renderContent()}
    </div>
  );
};

export default Withdrawal;
