// src/Component/AdminDashboard/AdminOverview.jsx
import React, { useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import './Style/AdminOverview.scss';

// --- CONFIGURATION & CONSTANTS ---
const CONFIG = {
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
  LOCAL_STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
  },
  API_ENDPOINTS: {
    GET_USER_INVESTMENT_SUMMARY: (userId, period = 'yearly') =>
      `/api/transactions/user/${userId}?period=${period}`,
  },
};

// --- API CLIENT SETUP (AXIOS INSTANCE) ---
const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(CONFIG.LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const formatCurrency = (value, currency = 'USD') => {
  if (typeof value !== 'number') return 'N/A';
  return value.toLocaleString('en-US', { style: 'currency', currency: currency });
};

const Card = ({ title, description, children, isLoading }) => (
  <div className={`card admin-overview-card ${isLoading ? 'loading' : ''}`}>
    <h3>{title}</h3>
    {description && <p className="card-description">{description}</p>}
    <div className="card-content">{isLoading ? <p>Loading data...</p> : children}</div>
  </div>
);

const AdminOverview = () => {
  const { userData, onLogout, activatedInvestment } = useOutletContext() || {
    userData: {},
    onLogout: () => {},
    activatedInvestment: null
  };

  // User lookup functionality state
  const [userIdInput, setUserIdInput] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('yearly');
  const [userInvestmentData, setUserInvestmentData] = useState(null);
  const [isLoadingUserInvestment, setIsLoadingUserInvestment] = useState(false);
  const [userLookupError, setUserLookupError] = useState(null);

  const isLoading = !activatedInvestment;
  const hasError = activatedInvestment?.error;
  const totalInvestment = activatedInvestment?.totalInvestment;
  const weeklyChange = activatedInvestment?.weeklyChange;
  const dailyProfit = activatedInvestment?.dailyProfit;
  const activePlanCount = activatedInvestment?.activePlanCount;
  const planGrowth = activatedInvestment?.planGrowth;

  // Fetch any user's investment data by ID
  const fetchUserInvestment = useCallback(async (userId, period = 'yearly') => {
    if (!userId || userId.trim() === '') {
      setUserLookupError('Please enter a valid user ID');
      return;
    }

    setIsLoadingUserInvestment(true);
    setUserLookupError(null);
    setUserInvestmentData(null);

    try {
      const url = CONFIG.API_ENDPOINTS.GET_USER_INVESTMENT_SUMMARY(userId.trim(), period);
      const response = await apiClient.get(url);

      const transactions = response.data;
      if (Array.isArray(transactions)) {
        const total = transactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
        setUserInvestmentData({ 
          userId: userId.trim(),
          period,
          totalInvestment: total, 
          transactions,
          transactionCount: transactions.length
        });
      } else {
        console.warn("Expected an array of transactions but received:", transactions);
        setUserInvestmentData({ 
          userId: userId.trim(),
          period,
          totalInvestment: 0, 
          transactions: [],
          transactionCount: 0
        });
      }

    } catch (error) {
      console.error("Error fetching user investment:", error);
      
      if (error.response?.status === 404) {
        setUserLookupError(`No investment data found for user ID: ${userId}`);
      } else if (error.response?.status === 401) {
        if (onLogout) onLogout();
        return;
      } else {
        setUserLookupError(
          error.response?.data?.message || 
          `Failed to fetch investment data for user ID: ${userId}`
        );
      }
    } finally {
      setIsLoadingUserInvestment(false);
    }
  }, [onLogout]);

  // Handle form submission
  const handleUserLookup = (e) => {
    e.preventDefault();
    fetchUserInvestment(userIdInput, selectedPeriod);
  };

  // Clear user lookup data
  const clearUserLookup = () => {
    setUserInvestmentData(null);
    setUserLookupError(null);
    setUserIdInput('');
  };

  // Format investment amount
  const formatInvestmentAmount = (amount) => {
    return typeof amount === 'number' ? `$${amount.toLocaleString()}` : 'N/A';
  };

  // Render user investment result
  const renderUserInvestmentResult = () => {
    if (isLoadingUserInvestment) {
      return (
        <div className="user-investment-result loading">
          <p>Loading user investment data...</p>
        </div>
      );
    }

    if (userLookupError) {
      return (
        <div className="user-investment-result error">
          <h4>Error</h4>
          <p>{userLookupError}</p>
          <button onClick={clearUserLookup} className="btn-clear">
            Clear
          </button>
        </div>
      );
    }

    if (userInvestmentData) {
      return (
        <div className="user-investment-result success">
          <h4>Investment Summary for User ID: {userInvestmentData.userId}</h4>
          <div className="investment-details">
            <p><strong>Period:</strong> {userInvestmentData.period}</p>
            <p><strong>Total Investment:</strong> {formatInvestmentAmount(userInvestmentData.totalInvestment)}</p>
            <p><strong>Number of Transactions:</strong> {userInvestmentData.transactionCount}</p>
          </div>
          <button onClick={clearUserLookup} className="btn-clear">
            Clear Results
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="admin-overview-content">
      <div className="admin-overview-header">
        <h2>Dashboard Overview</h2>
        <button
          onClick={onLogout}
          className="logout-button"
        >
          Log Out
        </button>
      </div>
      
      <div className="cards-container">
        <Card
          title="Activated Investment"
          description="The Amount of Investment Currently Activated"
          isLoading={isLoading}
        >
          {hasError ? (
            <p className="error-text">Could not load investment data.</p>
          ) : (
            <>
              <h2>{formatCurrency(totalInvestment)}</h2>
              {weeklyChange && <p>{formatCurrency(weeklyChange)} since last week</p>}
              {dailyProfit && <p>Profit today: {formatCurrency(dailyProfit)}</p>}
              {activePlanCount && (
                <>
                  <h4>Active Plans</h4>
                  <p>{activePlanCount} {planGrowth && `+${planGrowth}% ↑`}</p>
                </>
              )}
            </>
          )}
        </Card>
        
        <Card
          title="System Status"
          description="Current system health and performance"
          isLoading={false}
        >
          <div className="system-status">
            <p>🟢 System Online</p>
            <p>Last Updated: {new Date().toLocaleTimeString()}</p>
            {activatedInvestment?.serverUptime && <p>Uptime: {activatedInvestment.serverUptime}</p>}
          </div>
        </Card>
      </div>

      {/* User Investment Lookup Section */}
      <section className="user-lookup-section">
        <div className="lookup-card">
          <h2 className="lookup-title">User Investment Lookup</h2>
          <p className="lookup-description">
            Enter a user ID and select a period to view their investment summary.
          </p>
          
          <form onSubmit={handleUserLookup} className="lookup-form">
            <div className="form-row">
              <div className="input-group">
                <label htmlFor="userIdInput">User ID:</label>
                <input
                  id="userIdInput"
                  type="text"
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  placeholder="Enter user ID (e.g., 11)"
                  className="user-id-input"
                  disabled={isLoadingUserInvestment}
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="periodSelect">Period:</label>
                <select
                  id="periodSelect"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="period-select"
                  disabled={isLoadingUserInvestment}
                >
                  <option value="yearly">Yearly</option>
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>
              
              <button 
                type="submit" 
                className="btn-lookup"
                disabled={isLoadingUserInvestment || !userIdInput.trim()}
              >
                {isLoadingUserInvestment ? 'Loading...' : 'Look Up'}
              </button>
            </div>
          </form>

          {renderUserInvestmentResult()}
        </div>
      </section>
    </div>
  );
};

export default AdminOverview;
