// src/App.jsx

import React, { useState, useEffect, lazy, Suspense, useRef, useCallback } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// CSS import moved to top
import "./App.css";

// Lazy load ALL components to prevent circular dependencies
const Homepage = lazy(() => import("./Pages/Homepage"));
const Login = lazy(() => import("./Pages/Login"));
const Dashboard = lazy(() => import("./Pages/Dashboard"));
const About = lazy(() => import("./Pages/About"));
const Support = lazy(() => import("./Pages/Support"));
const Invest = lazy(() => import("./Pages/Invest"));
const Learn = lazy(() => import("./Pages/Learn"));
const SwpCalculator = lazy(() => import("./Pages/SwpCalculator"));
const Services = lazy(() => import("./Pages/Services"));
const Blog = lazy(() => import("./Component/learn/Blog"));
const AdminDashboard = lazy(() => import("./Pages/AdminDashboard"));

// Dashboard Components
const Short60 = lazy(() => import("./Component/learn/Short60"));
const Book = lazy(() => import("./Component/learn/Book"));
const MarketGuides = lazy(() => import("./Component/dashboard/MarketGuides"));
const BlogDetail = lazy(() => import("./Component/dashboard/BlogDetail"));
const Profile = lazy(() => import("./Component/dashboard/Profile"));
const InvestmentTools = lazy(() => import("./Component/dashboard/InvestmentTools"));
const Payment = lazy(() => import("./Component/dashboard/Payment"));
const Withdrawal = lazy(() => import("./Component/dashboard/Withdrawal"));

// Admin Components
const AdminOverview = lazy(() => import("./Component/AdminDashboard/AdminOverview"));
const UserManagement = lazy(() => import("./Component/AdminDashboard/userManagement"));
const ManageBlog = lazy(() => import("./Component/AdminDashboard/manageBlog"));
const TransactionPage = lazy(() => import("./Component/AdminDashboard/transcation"));
const AdminPlansPage = lazy(() => import("./Component/AdminDashboard/AdminPlans"));
const AdminWithdrawal = lazy(() => import("./Component/AdminDashboard/Withdrawal.jsx"));

// Layout Component
const DashboardLayout = lazy(() => import("./Pages/DashboardLayout"));

// Query Client Configuration
const queryClient = new QueryClient({
  defaultOptions: { 
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  },
});

// Admin email list - Update this with your actual admin emails
const ADMIN_EMAILS = [
  'admin@yourdomain.com',
  'superadmin@yourdomain.com',
  // Add more admin emails as needed
];

// Configuration
const CONFIG = {
  LOCAL_STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    USER_ROLE: 'userRole',
    USER_DATA: 'userData',
  },
};

// Utility Functions
const determineUserRole = (user) => {
  if (!user || !user.email) return 'user';
  return ADMIN_EMAILS.includes(user.email.toLowerCase()) ? 'admin' : 'user';
};

const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

// Loading Component
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    flexDirection: 'column',
    fontSize: '18px',
    backgroundColor: '#f8f9fa'
  }}>
    <div style={{
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #007bff',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      animation: 'spin 1s linear infinite',
      marginBottom: '20px'
    }}></div>
    {message}
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Suspense Fallback
const SuspenseFallback = ({ message = "Loading..." }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    fontSize: '16px'
  }}>
    {message}
  </div>
);

// Unauthorized Page Component
const UnauthorizedPage = ({ userRole, isAuthenticated, onLogout }) => (
  <div style={{ 
    padding: '40px', 
    textAlign: 'center',
    maxWidth: '600px',
    margin: '50px auto',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  }}>
    <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>Access Denied</h1>
    <p style={{ fontSize: '16px', marginBottom: '20px' }}>
      You do not have permission to view this page.
    </p>
    <p style={{ fontSize: '14px', color: '#6c757d', marginBottom: '30px' }}>
      Current role: {userRole} | Authenticated: {isAuthenticated ? 'Yes' : 'No'}
    </p>
    <button 
      onClick={() => window.history.back()}
      style={{
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginRight: '10px'
      }}
    >
      Go Back
    </button>
    <button 
      onClick={onLogout}
      style={{
        padding: '10px 20px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Logout
    </button>
  </div>
);

// Route Protection Components
const PrivateRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RoleBasedRoute = ({ isAuthenticated, userRole, allowedRoles, children, isLoggingOut }) => {
  console.log('RoleBasedRoute - Auth:', isAuthenticated, 'Role:', userRole, 'Allowed:', allowedRoles, 'LoggingOut:', isLoggingOut);
  
  // Don't redirect if logout is in progress
  if (isLoggingOut) {
    return <LoadingSpinner message="Signing out..." />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles || !allowedRoles.includes(userRole)) {
    console.log('Access denied - redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>Something went wrong</h2>
          <p style={{ marginBottom: '20px' }}>The application encountered an error.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  // State Management
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Refs to prevent multiple operations and track component state
  const logoutInProgress = useRef(false);
  const componentMounted = useRef(true);
  const authCheckInProgress = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      componentMounted.current = false;
    };
  }, []);

  // Clear authentication data
  const clearAuthData = useCallback(() => {
    try {
      localStorage.removeItem(CONFIG.LOCAL_STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(CONFIG.LOCAL_STORAGE_KEYS.USER_ROLE);
      localStorage.removeItem(CONFIG.LOCAL_STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error("Error clearing auth data:", error);
    }
    
    if (componentMounted.current) {
      setIsAuthenticated(false);
      setUserRole(null);
      setCurrentUser(null);
      setError(null);
    }
  }, []);

  // Store authentication data
  const storeAuthData = useCallback((token, role, user) => {
    try {
      localStorage.setItem(CONFIG.LOCAL_STORAGE_KEYS.AUTH_TOKEN, token);
      localStorage.setItem(CONFIG.LOCAL_STORAGE_KEYS.USER_ROLE, role);
      localStorage.setItem(CONFIG.LOCAL_STORAGE_KEYS.USER_DATA, JSON.stringify({
        uid: user.uid || user.id,
        email: user.email,
        displayName: user.displayName || user.name,
        photoURL: user.photoURL || user.avatar
      }));
    } catch (error) {
      console.error("Error storing auth data:", error);
    }
  }, []);

  // Check stored authentication on app load
  useEffect(() => {
    const checkStoredAuth = async () => {
      if (authCheckInProgress.current || isLoggingOut) return;
      
      authCheckInProgress.current = true;
      
      try {
        const token = localStorage.getItem(CONFIG.LOCAL_STORAGE_KEYS.AUTH_TOKEN);
        const role = localStorage.getItem(CONFIG.LOCAL_STORAGE_KEYS.USER_ROLE);
        const userData = localStorage.getItem(CONFIG.LOCAL_STORAGE_KEYS.USER_DATA);
        
        console.log('Checking stored auth:', { hasToken: !!token, role, hasUserData: !!userData });
        
        if (token && role && userData) {
          const tokenPayload = parseJwt(token);
          const currentTime = Date.now() / 1000;
          
          if (tokenPayload && tokenPayload.exp && tokenPayload.exp > currentTime) {
            const user = JSON.parse(userData);
            
            if (componentMounted.current) {
              setIsAuthenticated(true);
              setUserRole(role);
              setCurrentUser(user);
              console.log('Restored auth from storage:', role);
            }
          } else {
            console.log('Stored token expired');
            clearAuthData();
          }
        } else {
          clearAuthData();
        }
      } catch (error) {
        console.error("App.jsx: Error parsing stored token:", error);
        clearAuthData();
      } finally {
        authCheckInProgress.current = false;
        if (componentMounted.current) {
          setLoading(false);
        }
      }
    };

    checkStoredAuth();
  }, [clearAuthData, isLoggingOut]);

  // Login handler - Updated to work with any authentication system
  const handleLogin = useCallback(async (token, role, userData) => {
    if (logoutInProgress.current) return;
    
    console.log('HandleLogin called with:', { role, userData: userData?.email });
    
    try {
      // Re-determine role based on email if needed
      if (!role || role === 'user') {
        role = determineUserRole(userData);
      }
      
      storeAuthData(token, role, userData);
      
      if (componentMounted.current) {
        setIsAuthenticated(true);
        setUserRole(role);
        setCurrentUser(userData);
        setError(null);
        setIsLoggingOut(false);
      }
      
      console.log('Login successful, role set to:', role);
    } catch (error) {
      console.error('Error during login:', error);
      if (componentMounted.current) {
        setError('Login failed. Please try again.');
      }
    }
  }, [storeAuthData]);

  // Logout handler - Improved with better coordination
  const handleLogout = useCallback(async () => {
    // Prevent multiple logout attempts
    if (logoutInProgress.current || isLoggingOut) {
      console.log('Logout already in progress, skipping...');
      return;
    }

    console.log('App.jsx: Logout initiated');
    logoutInProgress.current = true;
    
    if (componentMounted.current) {
      setIsLoggingOut(true);
    }

    try {
      // If you have a logout API endpoint, call it here
      // await fetch('/api/logout', { method: 'POST' });
      
      // Add small delay to ensure all components can react to isLoggingOut state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      clearAuthData();
      
      console.log('Logout completed successfully');
    } catch (error) {
      console.error("App.jsx: Error during logout:", error);
      clearAuthData(); // Clear local state even if API call fails
    } finally {
      // Reset logout flag and state after a delay
      setTimeout(() => {
        logoutInProgress.current = false;
        if (componentMounted.current) {
          setIsLoggingOut(false);
        }
      }, 500);
    }
  }, [clearAuthData, isLoggingOut]);

  // Debug auth when loading completes
  useEffect(() => {
    if (!loading && process.env.NODE_ENV === 'development') {
      console.log('=== AUTH DEBUG INFO ===');
      console.log('isAuthenticated:', isAuthenticated);
      console.log('userRole:', userRole);
      console.log('currentUser:', currentUser?.email);
      console.log('isLoggingOut:', isLoggingOut);
      console.log('localStorage userRole:', localStorage.getItem(CONFIG.LOCAL_STORAGE_KEYS.USER_ROLE));
      console.log('localStorage userData:', localStorage.getItem(CONFIG.LOCAL_STORAGE_KEYS.USER_DATA));
      console.log('Admin emails:', ADMIN_EMAILS);
      console.log('========================');
    }
  }, [loading, isAuthenticated, userRole, currentUser, isLoggingOut]);

  // Error boundary fallback
  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>Application Error</h2>
        <p style={{ marginBottom: '20px' }}>{error}</p>
        <button 
          onClick={() => {
            setError(null);
            window.location.reload();
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reload Application
        </button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return <LoadingSpinner message="Loading Application..." />;
  }

  // Show logout screen during logout process
  if (isLoggingOut) {
    return <LoadingSpinner message="Signing out..." />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <Router>
            <div className="app-container">
              <Suspense fallback={<SuspenseFallback message="Loading page..." />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Homepage />} />
                  
                  <Route 
                    path="/login" 
                    element={
                      isAuthenticated ? (
                        userRole === "admin" ? 
                          <Navigate to="/adminDashboard" replace /> : 
                          <Navigate to="/dashboard" replace />
                      ) : (
                        <Login onLoginSuccess={handleLogin} />
                      )
                    } 
                  />
                  
                  <Route path="/invest" element={<Invest />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/learn" element={<Learn />} />
                  <Route path="/swp-calculator" element={<SwpCalculator />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/short60" element={<Short60 />} />
                  <Route path="/book" element={<Book />} />
                  
                  {/* Unauthorized Route */}
                  <Route 
                    path="/unauthorized" 
                    element={
                      <UnauthorizedPage 
                        userRole={userRole}
                        isAuthenticated={isAuthenticated}
                        onLogout={handleLogout}
                      />
                    } 
                  />

                  {/* User Protected Routes with Layout */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <PrivateRoute isAuthenticated={isAuthenticated}>
                        <Suspense fallback={<SuspenseFallback message="Loading dashboard..." />}>
                          <DashboardLayout onLogout={handleLogout} />
                        </Suspense>
                      </PrivateRoute>
                    }
                  >
                    <Route index element={
                      <Suspense fallback={<SuspenseFallback />}>
                        <Dashboard setIsAuthenticated={setIsAuthenticated} />
                      </Suspense>
                    } />
                    <Route path="marketguides" element={
                      <Suspense fallback={<SuspenseFallback />}>
                        <MarketGuides />
                      </Suspense>
                    } />
                    <Route path="blog/:blogId" element={
                      <Suspense fallback={<SuspenseFallback />}>
                        <BlogDetail />
                      </Suspense>
                    } />
                    <Route path="profile" element={
                      <Suspense fallback={<SuspenseFallback />}>
                        <Profile />
                      </Suspense>
                    } />
                    <Route path="investmenttools" element={
                      <Suspense fallback={<SuspenseFallback />}>
                        <InvestmentTools />
                      </Suspense>
                    } />
                    <Route path="payment" element={
                      <Suspense fallback={<SuspenseFallback />}>
                        <Payment />
                      </Suspense>
                    } />
                    <Route path="withdrawal" element={
                      <Suspense fallback={<SuspenseFallback />}>
                        <Withdrawal />
                      </Suspense>
                    } />
                  </Route>
                  
                  {/* Admin Protected Routes */}
                  <Route 
                    path="/adminDashboard"
                    element={
                      <RoleBasedRoute 
                        isAuthenticated={isAuthenticated} 
                        userRole={userRole} 
                        allowedRoles={["admin"]}
                        isLoggingOut={isLoggingOut}
                      >
                        <Suspense fallback={<SuspenseFallback message="Loading admin dashboard..." />}>
                          <AdminDashboard onLogout={handleLogout} />
                        </Suspense>
                      </RoleBasedRoute>
                    }
                  >
                    <Route index element={
                      <Suspense fallback={<SuspenseFallback />}>
                        <AdminOverview />
                      </Suspense>
                    } />
                    <Route path="userManagement" element={
                      <Suspense fallback={<SuspenseFallback />}>
                        <UserManagement />
                      </Suspense>
                    } />
                    <Route path="manageBlog" element={
                      <Suspense fallback={<SuspenseFallback />}>
                        <ManageBlog />
                      </Suspense>
                    } />
                    <Route path="adminPlans" element={
                      <Suspense fallback={<SuspenseFallback />}>
                        <AdminPlansPage />
                      </Suspense>
                    } />
                    <Route path="transaction" element={
                      <Suspense fallback={<SuspenseFallback />}>
                        <TransactionPage />
                      </Suspense>
                    } />
                    <Route path="withdrawals" element={
                      <Suspense fallback={<SuspenseFallback />}>
                        <AdminWithdrawal />
                      </Suspense>
                    } />
                  </Route>
                  
                  {/* Catch-all Route */}
                  <Route 
                    path="*" 
                    element={
                      isAuthenticated ? (
                        userRole === "admin" ? 
                          <Navigate to="/adminDashboard" replace /> : 
                          <Navigate to="/dashboard" replace />
                      ) : (
                        <Navigate to="/login" replace />
                      )
                    } 
                  />
                </Routes>
              </Suspense>
            </div>
          </Router>
        </HelmetProvider>
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
