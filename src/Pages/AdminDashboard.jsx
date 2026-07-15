// src/Component/AdminDashboard/AdminDashboard.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminSidebar from "../Component/AdminDashboard/AdminSidebar";
import "../assets/styles/AdminDashboard.scss";

// --- CONFIGURATION & CONSTANTS ---
const CONFIG = {
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
  LOCAL_STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    USER_ROLE: 'userRole',
    USER_DATA: 'userData',
  },
  API_ENDPOINTS: {
    GET_ALL_TRANSACTIONS: '/api/transactions',
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

const AdminDashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({});
  const [activatedInvestment, setActivatedInvestment] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authError, setAuthError] = useState(false);
  
  // Use refs to prevent multiple operations and track component state
  const logoutInProgress = useRef(false);
  const componentMounted = useRef(true);
  const authChecked = useRef(false);
  const initialAuthCheck = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      componentMounted.current = false;
    };
  }, []);

  // --- LOGOUT HANDLER ---
  const handleLogout = useCallback(async () => {
    // Prevent multiple logout attempts
    if (logoutInProgress.current || isLoggingOut) {
      console.log('AdminDashboard: Logout already in progress, skipping...');
      return;
    }

    console.log('AdminDashboard: Logout initiated');
    logoutInProgress.current = true;
    
    if (componentMounted.current) {
      setIsLoggingOut(true);
    }
    
    try {
      // Use the parent logout handler if available
      if (typeof onLogout === 'function') {
        await onLogout();
      } else {
        // Fallback - clear local storage and navigate
        console.log('AdminDashboard: Using fallback logout');
        localStorage.removeItem(CONFIG.LOCAL_STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(CONFIG.LOCAL_STORAGE_KEYS.USER_ROLE);
        localStorage.removeItem(CONFIG.LOCAL_STORAGE_KEYS.USER_DATA);
        
        // Clear state if component is still mounted
        if (componentMounted.current) {
          setUserData({});
          setActivatedInvestment(null);
        }
        
        // Navigate with a small delay
        setTimeout(() => {
          if (componentMounted.current) {
            navigate('/login', { replace: true });
          }
        }, 100);
      }
    } catch (error) {
      console.error('AdminDashboard: Error during logout:', error);
      // Fallback even on error
      localStorage.removeItem(CONFIG.LOCAL_STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(CONFIG.LOCAL_STORAGE_KEYS.USER_ROLE);
      localStorage.removeItem(CONFIG.LOCAL_STORAGE_KEYS.USER_DATA);
      
      if (componentMounted.current) {
        navigate('/login', { replace: true });
      }
    } finally {
      // Reset logout flag after completion
      setTimeout(() => {
        logoutInProgress.current = false;
        if (componentMounted.current) {
          setIsLoggingOut(false);
        }
      }, 1000);
    }
  }, [navigate, onLogout, isLoggingOut]);

  // --- INITIAL AUTHENTICATION CHECK ---
  useEffect(() => {
    // Only run initial auth check once
    if (initialAuthCheck.current || logoutInProgress.current) {
      return;
    }

    initialAuthCheck.current = true;

    const performInitialAuthCheck = () => {
      try {
        const token = localStorage.getItem(CONFIG.LOCAL_STORAGE_KEYS.AUTH_TOKEN);
        const role = localStorage.getItem(CONFIG.LOCAL_STORAGE_KEYS.USER_ROLE);
        
        console.log('AdminDashboard: Initial auth check', { 
          hasToken: !!token, 
          role,
          logoutInProgress: logoutInProgress.current 
        });

        if (!token || role !== 'admin') {
          console.log('AdminDashboard: No valid admin token found, setting auth error');
          if (componentMounted.current) {
            setAuthError(true);
          }
          return;
        }

        // Check token expiry
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          
          if (payload.exp && payload.exp < Date.now() / 1000) {
            console.log('AdminDashboard: Token expired, setting auth error');
            if (componentMounted.current) {
              setAuthError(true);
            }
            return;
          }
          
          // Token is valid - set user data
          if (componentMounted.current && !logoutInProgress.current) {
            setUserData(payload);
            authChecked.current = true;
            console.log('AdminDashboard: Auth check passed, user data set');
          }
        } catch (tokenError) {
          console.error('AdminDashboard: Error decoding token:', tokenError);
          if (componentMounted.current) {
            setAuthError(true);
          }
        }
      } catch (error) {
        console.error('AdminDashboard: Error during auth check:', error);
        if (componentMounted.current) {
          setAuthError(true);
        }
      }
    };

    performInitialAuthCheck();
  }, []);

  // Handle auth error - trigger logout when auth error is detected
  useEffect(() => {
    if (authError && !logoutInProgress.current && !isLoggingOut) {
      console.log('AdminDashboard: Auth error detected, initiating logout');
      // Add a small delay to prevent immediate logout conflicts
      const timeoutId = setTimeout(() => {
        if (componentMounted.current && !logoutInProgress.current) {
          handleLogout();
        }
      }, 200);

      return () => clearTimeout(timeoutId);
    }
  }, [authError, handleLogout, isLoggingOut]);

  // --- FETCH ALL TRANSACTIONS AND CALCULATE TOTAL INVESTMENT ---
  const fetchActivatedInvestment = useCallback(async () => {
    // Skip if logging out, no token, or auth error
    if (logoutInProgress.current || 
        isLoggingOut || 
        authError ||
        !localStorage.getItem(CONFIG.LOCAL_STORAGE_KEYS.AUTH_TOKEN)) {
      return;
    }

    try {
      console.log('AdminDashboard: Fetching transactions from:', CONFIG.API_BASE_URL + CONFIG.API_ENDPOINTS.GET_ALL_TRANSACTIONS);
      const response = await apiClient.get(CONFIG.API_ENDPOINTS.GET_ALL_TRANSACTIONS);
      
      console.log('AdminDashboard: API Response:', response.data);
      
      // Only update state if component is still mounted and not in error state
      if (componentMounted.current && !logoutInProgress.current && !authError) {
        const transactions = response.data;
        let totalInvestment = 0;
        let completedTransactionCount = 0;
        let allTransactionsCount = 0;
        
        if (Array.isArray(transactions) && transactions.length > 0) {
          allTransactionsCount = transactions.length;
          
          transactions.forEach((transaction) => {
            if (transaction.amount && transaction.status) {
              const amount = Number(transaction.amount);
              if (!isNaN(amount) && amount > 0) {
                if (transaction.status.toLowerCase() === 'completed') {
                  totalInvestment += amount;
                  completedTransactionCount++;
                }
              }
            }
          });
          
          setActivatedInvestment({
            totalInvestment: totalInvestment,
            transactionCount: completedTransactionCount,
            allTransactions: allTransactionsCount,
            error: false
          });
        } else {
          setActivatedInvestment({
            totalInvestment: 0,
            transactionCount: 0,
            allTransactions: 0,
            error: false,
            message: 'No transactions found'
          });
        }
      }
    } catch (error) {
      console.error('AdminDashboard: Error fetching transactions:', error);
      
      // Don't handle auth errors here if we're already in error state or logging out
      if (logoutInProgress.current || authError || isLoggingOut) {
        return;
      }
      
      // Handle 401 unauthorized - set auth error instead of direct logout
      if (error.response?.status === 401) {
        console.log('AdminDashboard: Unauthorized API response, setting auth error');
        if (componentMounted.current) {
          setAuthError(true);
        }
        return;
      }
      
      // For other errors, set error state but don't logout
      if (componentMounted.current) {
        setActivatedInvestment({ 
          error: true, 
          message: error.response?.data?.message || `Failed to load transaction data (${error.response?.status || 'Network Error'})`,
          totalInvestment: 0,
          transactionCount: 0
        });
      }
    }
  }, [authError, isLoggingOut]);

  // Fetch transactions when we have valid user data
  useEffect(() => {
    if (userData.userId && authChecked.current && !authError && !logoutInProgress.current && !isLoggingOut) {
      fetchActivatedInvestment();
    }
  }, [userData.userId, fetchActivatedInvestment, authError, isLoggingOut]);

  // --- MOBILE SIDEBAR HANDLERS ---
  const toggleMobileSidebar = () => {
    if (!isLoggingOut && !authError) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    }
  };

  const closeMobileSidebar = () => {
    if (!isLoggingOut && !authError) {
      setIsMobileSidebarOpen(false);
    }
  };

  // --- CONTEXT DATA FOR OUTLET ---
  const contextData = {
    userData,
    activatedInvestment,
    onLogout: handleLogout,
  };

  // Show loading state while logging out or during auth error
  if (isLoggingOut || logoutInProgress.current || authError) {
    return (
      <div className="admin-dashboard-loading">
        <div className="loading-spinner">
          <div style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          {authError ? 'Authentication required...' : 'Signing out...'}
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Don't render the dashboard if we don't have valid user data yet
  if (!userData.userId) {
    return (
      <div className="admin-dashboard-loading">
        <div className="loading-spinner">
          <div style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          Loading dashboard...
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`admin-dashboard-layout ${isMobileSidebarOpen ? 'mobile-sidebar-open' : ''}`}>
      {/* Mobile Sidebar Toggle Button */}
      <button 
        className="admin-dashboard__sidebar-toggle"
        onClick={toggleMobileSidebar}
        aria-label="Toggle sidebar"
        disabled={isLoggingOut || authError}
      >
        ☰
      </button>

      {/* Mobile Sidebar Overlay */}
      <div 
        className="admin-dashboard__sidebar-overlay"
        onClick={closeMobileSidebar}
      />

      {/* Sidebar */}
      <AdminSidebar 
        userData={userData} 
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />

      {/* Main Content Area */}
      <main className="admin-dashboard-main-content">
        {/* Content Header */}
        <div className="admin-dashboard-content-header">
          <h1 className="header-title">Admin Dashboard</h1>
          <p className="header-subtitle">Manage your investment platform</p>
          <div className="header-stats">
            {activatedInvestment?.error ? (
              <p className="error-detail">
                {activatedInvestment.message || "Unable to load transaction data"}
              </p>
            ) : activatedInvestment ? (
              <div className="investment-summary">
                <p>
                  Total Activated Investment: <strong>${activatedInvestment.totalInvestment?.toLocaleString() || 0}</strong>
                </p>
                <p className="transaction-details">
                  Successful Transactions: {activatedInvestment.transactionCount || 0} / {activatedInvestment.allTransactions || 0}
                </p>
              </div>
            ) : (
              <p>Loading transaction data...</p>
            )}
          </div>
        </div>

        {/* Page Content (Outlet) */}
        <div className="page-content-wrapper">
          <Outlet context={contextData} />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
