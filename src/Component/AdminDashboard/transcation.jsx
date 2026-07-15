import React, { useState, useEffect, useCallback } from 'react';
import SidebarAdmin from './AdminSidebar'; // Assuming this component exists
import './Style/Transaction.scss'; // Make sure this SCSS file exists and is styled

// --- CONFIGURATION ---
const baseUrl = process.env.REACT_APP_API_BASE_URL;
const AUTH_TOKEN_KEY = 'authToken';
  
const getAuthToken = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return token;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return "Invalid Date";
  }
};

// Date filtering utility functions
const filterTransactionsByPeriod = (transactions, period) => {
  if (!Array.isArray(transactions)) return [];
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.createdAt);
    
    switch (period) {
      case 'daily':
        // Today's transactions
        const transactionDay = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
        return transactionDay.getTime() === today.getTime();
        
      case 'weekly':
        // Last 7 days including today
        const weekAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
        return transactionDate >= weekAgo && transactionDate <= now;
        
      case 'monthly':
        // Current month
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
        
      case 'yearly':
        // Current year
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        return transactionDate >= yearStart && transactionDate <= yearEnd;
        
      case 'all':
      default:
        return true;
    }
  });
};

// Reusable Transaction Table Component
const TransactionTable = ({ transactions, periodTitle, isLoading, showUserName = false }) => {
  if (isLoading) {
    return <p className="loading-message">Loading {periodTitle} transactions...</p>;
  }

  if (typeof transactions === 'string') {
    return <p className="info-message">{transactions}</p>;
  }

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return <p className="info-message">No {periodTitle.toLowerCase()} transactions found.</p>;
  }

  return (
    <div className="transaction-table-container">
      <div className="transaction-summary">
        <p><strong>Total {periodTitle}: {transactions.length} transactions</strong></p>
        <p><strong>Total Amount: ${transactions.reduce((sum, t) => sum + (t.amount / 100), 0).toFixed(2)}</strong></p>
        <p><strong>Total Profit: ${transactions.reduce((sum, t) => sum + (t.profit / 100), 0).toFixed(2)}</strong></p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>ID</th>
            {showUserName && <th>User Name</th>}
            <th>Plan Name</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Profit</th>
            <th>Date</th>
            {!showUserName && <th>User ID</th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td data-label="ID">{transaction.id}</td>
              {showUserName && <td data-label="User Name">{transaction.User?.name || 'N/A'}</td>}
              <td data-label="Plan Name">{transaction.Plan?.name || 'N/A'}</td>
              <td data-label="Amount">${(transaction.amount / 100)?.toFixed(2) || '0.00'}</td>
              <td data-label="Status">
                <span className={`status-badge status-${transaction.status?.toLowerCase() || 'unknown'}`}>
                  {transaction.status || 'N/A'}
                </span>
              </td>
              <td data-label="Profit">${(transaction.profit / 100)?.toFixed(2) || '0.00'}</td>
              <td data-label="Date">{formatDate(transaction.createdAt)}</td>
              {!showUserName && <td data-label="User ID">{transaction.userId}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AdminTransactionPage = () => {
  const [allTransactions, setAllTransactions] = useState(null); // Store all transactions
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [globalError, setGlobalError] = useState(null);

  if (!baseUrl) {
    console.error("FATAL ERROR: REACT_APP_API_BASE_URL is not defined. API calls will fail. Make sure it's set in your .env file and the development server is restarted.");
  }

  // Fetch all transactions once
  const fetchAllTransactions = useCallback(async (token) => {
    if (!token) {
      setGlobalError("Authentication token not found. Please log in to view transactions.");
      setIsLoading(false);
      return;
    }
    if (!baseUrl) {
      setGlobalError("API URL is not configured. Please contact support or check .env file.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setGlobalError(null);

    const apiUrl = `${baseUrl}/api/transactions`;

    try {
      const response = await fetch(apiUrl, {
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
      });

      if (response.status === 401 || response.status === 403) {
        setGlobalError("Authentication failed or session expired. Please log in again.");
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setAllTransactions("Access Denied. Please re-login.");
        return;
      }

      const responseText = await response.text();
      let data;
      
      try { 
        data = JSON.parse(responseText); 
      } catch (e) {
        console.error(`Error parsing JSON from ${apiUrl}. Status: ${response.status}. Response:`, responseText);
        throw new Error(`Server returned non-JSON data. Status: ${response.status}.`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Failed to fetch transactions (Status: ${response.status})`);
      } else {
        // Sort transactions by date (newest first)
        if (Array.isArray(data)) {
          const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setAllTransactions(sortedData);
        } else {
          setAllTransactions([]);
        }
      }
    } catch (err) {
      console.error(`Error during fetch or processing:`, err);
      setGlobalError(`Error loading transactions: ${err.message}`);
      setAllTransactions("Error loading data");
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    const token = getAuthToken();
    fetchAllTransactions(token);
  }, [fetchAllTransactions]);

  // Get filtered transactions based on active tab
  const getFilteredTransactions = () => {
    if (!Array.isArray(allTransactions)) {
      return allTransactions; // Return error message or loading state
    }
    
    return filterTransactionsByPeriod(allTransactions, activeTab);
  };

  const renderContent = () => {
    if (globalError) {
      return <p className="error-message global-error-message">{globalError}</p>;
    }
    
    const periodTitles = {
      all: "All System Transactions",
      daily: "Today's Transactions", 
      weekly: "This Week's Transactions",
      monthly: "This Month's Transactions",
      yearly: "This Year's Transactions"
    };

    const showUserNameColumn = activeTab === 'all'; // Only show User Name for "All Transactions" tab
    const filteredTransactions = getFilteredTransactions();

    return (
      <TransactionTable
        transactions={filteredTransactions}
        periodTitle={periodTitles[activeTab]}
        isLoading={isLoading}
        showUserName={showUserNameColumn}
      />
    );
  };

  const TABS_CONFIG = [
    { key: 'all', label: 'All Transactions' },
    { key: 'daily', label: 'Today' },
    { key: 'weekly', label: 'This Week' },
    { key: 'monthly', label: 'This Month' },
    { key: 'yearly', label: 'This Year' },
  ];

  // Get transaction counts for each period for display in tabs
  const getTransactionCounts = () => {
    if (!Array.isArray(allTransactions)) return {};
    
    return {
      all: allTransactions.length,
      daily: filterTransactionsByPeriod(allTransactions, 'daily').length,
      weekly: filterTransactionsByPeriod(allTransactions, 'weekly').length,
      monthly: filterTransactionsByPeriod(allTransactions, 'monthly').length,
      yearly: filterTransactionsByPeriod(allTransactions, 'yearly').length,
    };
  };

  const transactionCounts = getTransactionCounts();

  return (
    <div className="dashboard-transaction-page">
      <SidebarAdmin />
      <div className="main-content-area">
        <header className="page-header">
          <h1>Transaction History</h1>
          {!isLoading && Array.isArray(allTransactions) && (
            <p className="total-summary">
              Total Transactions: {allTransactions.length} | 
              Total Amount: ${allTransactions.reduce((sum, t) => sum + (t.amount / 100), 0).toFixed(2)} | 
              Total Profit: ${allTransactions.reduce((sum, t) => sum + (t.profit / 100), 0).toFixed(2)}
            </p>
          )}
        </header>

        <section className="transactions-section">
          <div className="tabs-navigation">
            {TABS_CONFIG.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
                disabled={isLoading}
              >
                {tab.label}
                {!isLoading && transactionCounts[tab.key] !== undefined && (
                  <span className="tab-count">({transactionCounts[tab.key]})</span>
                )}
              </button>
            ))}
          </div>

          <div className="tab-content-area">
            {renderContent()}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminTransactionPage;
