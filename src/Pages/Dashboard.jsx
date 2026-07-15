import React, { useEffect, useMemo, useRef, useCallback, useState } from "react";
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { CircularProgress, Box } from "@mui/material";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from "../Component/dashboard/Sidebar";

// Import the unified SCSS file
import '../assets/styles/Dashboard.scss'; 

// Helper functions
const initializeFirebaseMessaging = async () => { 
    console.log("Mock Firebase Messaging Initialized."); 
    return Promise.resolve("mock-firebase-token-12345"); 
};

const api = axios.create({ 
    baseURL: process.env.REACT_APP_API_BASE_URL, 
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => { 
    const token = localStorage.getItem('authToken'); 
    if (token) { 
        config.headers['Authorization'] = `Bearer ${token}`; 
    } 
    return config; 
}, (error) => Promise.reject(error));

const optimizedQueryConfig = { 
    staleTime: 300000, 
    cacheTime: 600000, 
    refetchOnWindowFocus: false, 
    refetchOnMount: false, 
    retry: 1, 
    retryDelay: 1000 
};

// NEW: Fetch user profile function
const fetchUserProfile = async () => { 
    try { 
        const res = await api.get('/api/users/profile'); 
        return res.data; 
    } catch (e) { 
        console.error('Error fetching user profile:', e); 
        return null; 
    }
};

const fetchTotalInvestment = async () => { 
    try { 
        const res = await api.get('/api/users/total-investment'); 
        return res.data; 
    } catch (e) { 
        console.error('Error fetching total investment:', e); 
        return { totalInvestment: 0 }; 
    }
};

const fetchTotalProfit = async () => { 
    try { 
        const res = await api.get('/api/users/total-profit-loss'); 
        return res.data; 
    } catch (e) { 
        console.error('Error fetching total profit:', e); 
        return { totalProfitOrLoss: 0 }; 
    }
};

const fetchRecentTransactions = async (userId) => { 
    try { 
        const res = await api.get(`/api/transactions/user/${userId}`); 
        return res.data; 
    } catch (e) { 
        console.error('Error fetching recent transactions:', e); 
        if (e.response?.status === 404 || e.response?.data?.message === "No transactions found for this user") {
            return { transactions: [], message: "No transactions found for this user" };
        }
        return { transactions: [] }; 
    }
};

const generateRepresentativeChartData = (total, labels, dataKey, labelKey) => { 
    if (!total) { 
        return labels.map(label => ({ [labelKey]: label, [dataKey]: 0 })); 
    } 
    const points = labels.length === 6 ? [0.05, 0.15, 0.1, 0.25, 0.2, 0.25] : [0.2, 0.4, 0.4]; 
    return labels.map((label, index) => ({ 
        [labelKey]: label, 
        [dataKey]: Math.round(points[index % points.length] * total) 
    })); 
};

const processMonthlyData = (apiData, fallback) => { 
    if (apiData?.monthlyData?.length > 0) 
        return apiData.monthlyData.map(item => ({ name: item.month, investment: item.amount })); 
    return generateRepresentativeChartData(
        apiData?.totalInvestment || fallback, 
        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], 
        'investment', 
        'name'
    ); 
};

const processYearlyData = (apiData, fallback) => { 
    if (apiData?.yearlyData?.length > 0) 
        return apiData.yearlyData.map(item => ({ year: item.year, profit: item.profit })); 
    return generateRepresentativeChartData(
        apiData?.totalProfit || fallback, 
        ["2022", "2023", "2024"], 
        'profit', 
        'year'
    ); 
};

const parseJwt = (token) => { 
    try { 
        return JSON.parse(atob(token.split('.')[1])); 
    } catch (e) { 
        return null; 
    }
};

const useJWTAuth = () => { 
    const [authState, setAuthState] = useState({ 
        isAuthenticated: false, 
        currentUser: null, 
        loading: true 
    }); 
    
    useEffect(() => { 
        try { 
            const token = localStorage.getItem("authToken");
            const data = localStorage.getItem("userData"); 
            if (token && data) { 
                const payload = parseJwt(token); 
                if (payload && payload.exp * 1000 > Date.now()) { 
                    setAuthState({ 
                        isAuthenticated: true, 
                        currentUser: JSON.parse(data), 
                        loading: false 
                    }); 
                    return; 
                } 
            } 
            setAuthState({ 
                isAuthenticated: false, 
                currentUser: null, 
                loading: false 
            }); 
        } catch (e) { 
            setAuthState({ 
                isAuthenticated: false, 
                currentUser: null, 
                loading: false 
            }); 
        } 
    }, []); 
    
    return authState; 
};

// Reusable Components
const CustomTooltip = React.memo(({ active, payload, label }) => {
    if (active && payload?.length) {
        const formatCurrency = (v) => new Intl.NumberFormat('en-IN', { 
            style: 'currency', 
            currency: 'INR', 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0 
        }).format(v || 0);
        
        return (
            <div className="custom-tooltip">
                <p>{label}</p>
                <p>{`${payload[0].name}: ${formatCurrency(payload[0].value)}`}</p>
            </div>
        );
    }
    return null;
});
CustomTooltip.displayName = 'CustomTooltip';

const MemoizedLineChart = React.memo(({ data, dataKey, stroke, name, yAxisFormatter }) => {
    if (!data || data.length === 0) {
        return (
            <div className="chart-no-data">
                <p>No data available</p>
            </div>
        );
    }
    
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                    dataKey={name === 'investment' ? 'name' : 'year'} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#a0a8c2', fontSize: 12 }} 
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={yAxisFormatter} 
                    tick={{ fill: '#a0a8c2', fontSize: 12 }} 
                />
                <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{ 
                        stroke: `rgba(${stroke === '#8a7cff' ? '138, 124, 255' : '0, 185, 41'}, 0.3)`, 
                        strokeWidth: 2 
                    }} 
                />
                <Line 
                    type="monotone" 
                    dataKey={dataKey} 
                    stroke={stroke} 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                    activeDot={{ r: 8, stroke: stroke, fill: '#fff' }} 
                />
            </LineChart>
        </ResponsiveContainer>
    );
});
MemoizedLineChart.displayName = 'MemoizedLineChart';

// Main Dashboard Component
const Dashboard = ({ setIsAuthenticated }) => {
    const { currentUser, isAuthenticated, loading } = useJWTAuth();
    const navigate = useNavigate();
    const hasRedirected = useRef(false);
    
    // Sidebar state management
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const formatCurrency = useCallback((v) => 
        new Intl.NumberFormat('en-IN', { 
            style: 'currency', 
            currency: 'INR', 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0 
        }).format(v || 0), []
    );
    
    const yAxisFormatter = useCallback((v) => `₹${Math.round(v / 1000)}k`, []);

    // Handle window resize to detect mobile/desktop
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            
            // Auto-close sidebar on mobile when resizing to desktop
            if (!mobile && isSidebarOpen) {
                setIsSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isSidebarOpen]);

    // Close sidebar when clicking outside on mobile
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMobile && isSidebarOpen && 
                !event.target.closest('.sidebar') && 
                !event.target.closest('.mobile-menu-toggle')) {
                setIsSidebarOpen(false);
            }
        };

        if (isSidebarOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isSidebarOpen, isMobile]);

    // Prevent body scroll when mobile sidebar is open
    useEffect(() => {
        if (isMobile && isSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isSidebarOpen, isMobile]);

    useEffect(() => { 
        if (isAuthenticated && currentUser) { 
            initializeFirebaseMessaging(); 
        } 
    }, [isAuthenticated, currentUser]);

    // NEW: Fetch user profile data
    const { data: userProfile, isLoading: isLoadingProfile } = useQuery({ 
        queryKey: ['userProfile'], 
        queryFn: fetchUserProfile, 
        enabled: !!currentUser && isAuthenticated, 
        ...optimizedQueryConfig 
    });

    // Check account status when user profile is loaded
    useEffect(() => {
        if (userProfile && userProfile.isActive === false) {
            // Clear authentication data
            localStorage.removeItem("authToken");
            localStorage.removeItem("userRole");
            localStorage.removeItem("userData");
            
            // Show restriction message and redirect to login
            toast.error("Your account is restricted. Please contact support.");
            navigate('/login');
        }
    }, [userProfile, navigate]);

    // Data fetching
    const { data: totalInvestmentData, isLoading: isLoadingInvestment } = useQuery({ 
        queryKey: ['totalInvestment', currentUser?.id], 
        queryFn: fetchTotalInvestment, 
        enabled: !!currentUser, 
        ...optimizedQueryConfig 
    });
    
    const { data: totalProfitData, isLoading: isLoadingProfit } = useQuery({ 
        queryKey: ['totalProfit', currentUser?.id], 
        queryFn: fetchTotalProfit, 
        enabled: !!currentUser, 
        ...optimizedQueryConfig 
    });
    
    const { data: recentTransactionsData, isLoading: isLoadingTransactions } = useQuery({ 
        queryKey: ['recentTransactions', currentUser?.id], 
        queryFn: () => fetchRecentTransactions(currentUser?.id), 
        enabled: !!currentUser, 
        ...optimizedQueryConfig 
    });

    const investmentChartData = useMemo(() => 
        processMonthlyData(null, totalInvestmentData?.totalInvestment), 
        [totalInvestmentData]
    );
    
    const profitChartData = useMemo(() => 
        processYearlyData(null, totalProfitData?.totalProfitOrLoss), 
        [totalProfitData]
    );
    
    const recentTransactionCount = useMemo(() => 
        recentTransactionsData?.transactions?.length || 0, 
        [recentTransactionsData]
    );

    // NEW: Get display name from profile data
    const displayName = useMemo(() => {
        if (userProfile) {
            if (userProfile.firstName && userProfile.lastName) {
                return `${userProfile.firstName} ${userProfile.lastName}`;
            }
            return userProfile.name || userProfile.firstName || userProfile.email || "User";
        }
        return currentUser?.displayName || currentUser?.name || "User";
    }, [userProfile, currentUser]);

    // Event handlers
    const handleLogout = () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        setIsAuthenticated(false);
        navigate("/login", { replace: true });
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const toggleSidebarCollapse = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };
    
    useEffect(() => { 
        if (!loading && !isAuthenticated && !hasRedirected.current) { 
            hasRedirected.current = true; 
            navigate("/login", { replace: true }); 
        } 
    }, [isAuthenticated, loading, navigate]);

    if (loading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh', 
                backgroundColor: '#161921' 
            }}>
                <CircularProgress />
            </Box>
        );
    }
    
    if (!isAuthenticated || !currentUser) return null;

    return (
        <>
            <div className="dashboard-user theme-dark">
            {/* Mobile menu toggle button */}
            <button 
                className="mobile-menu-toggle"
                onClick={toggleSidebar}
                aria-label="Toggle sidebar"
                style={{ display: isMobile ? 'flex' : 'none' }}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path 
                        d="M3 12H21M3 6H21M3 18H21" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {/* Sidebar overlay for mobile */}
            <div 
                className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
                onClick={closeSidebar}
                style={{ display: isMobile ? 'block' : 'none' }}
            />

            {/* Sidebar with proper state management */}
            <Sidebar 
                onLogout={handleLogout} 
                isOpen={isSidebarOpen}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={toggleSidebarCollapse}
                onClose={closeSidebar}
                className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
                userProfile={userProfile} // Pass profile data to sidebar if needed
            />

            {/* Main content with dynamic classes */}
            <main className={`dashboard__main-content ${isSidebarCollapsed && !isMobile ? 'sidebar-collapsed' : ''}`}>
                <header className="dashboard-content-header">
                    <h1 className="header-title">Dashboard</h1>
                    <p className="header-subtitle">
                        Welcome back, {isLoadingProfile ? "Loading..." : displayName}!
                    </p>
                    <div className="header-stats">
                        <span>Recent Transactions: {recentTransactionCount}</span>
                        {userProfile && (
                            <span>• KYC Status: {userProfile.kycCompleted ? "Verified" : "Pending"}</span>
                        )}
                    </div>
                </header>
                
                <div className="dashboard-grid-cards">
                    <article className="dashboard-card">
                        <div className="card-header">
                            <h3 className="card-title">Total Investment</h3>
                            <span className="data-source">Monthly Breakdown</span>
                        </div>
                        <div className="card-body">
                            <p className="amount">
                                {isLoadingInvestment ? "..." : formatCurrency(totalInvestmentData?.totalInvestment)}
                            </p>
                            <p className="change">Total capital deployed</p>
                            <div className="chart-container-line">
                                {isLoadingInvestment ? (
                                    <div className="chart-overlay-state">
                                        <div className="spinner small"></div>
                                        <span>Loading chart...</span>
                                    </div>
                                ) : (
                                    <MemoizedLineChart 
                                        data={investmentChartData} 
                                        dataKey="investment" 
                                        stroke="#8a7cff" 
                                        name="investment" 
                                        yAxisFormatter={yAxisFormatter} 
                                    />
                                )}
                            </div>
                        </div>
                    </article>

                    <article className="dashboard-card">
                        <div className="card-header">
                            <h3 className="card-title">Total Profit</h3>
                            <span className="data-source">Yearly Breakdown</span>
                        </div>
                        <div className="card-body">
                            <p className="amount">
                                {isLoadingProfit ? "..." : formatCurrency(totalProfitData?.totalProfitOrLoss)}
                            </p>
                            <p className="change positive">Represents your total earnings</p>
                            <div className="chart-container-line">
                                {isLoadingProfit ? (
                                    <div className="chart-overlay-state">
                                        <div className="spinner small"></div>
                                        <span>Loading chart...</span>
                                    </div>
                                ) : (
                                    <MemoizedLineChart 
                                        data={profitChartData} 
                                        dataKey="profit" 
                                        stroke="#00D186" 
                                        name="profit" 
                                        yAxisFormatter={yAxisFormatter} 
                                    />
                                )}
                            </div>
                        </div>
                    </article>
                    
                    <article className="dashboard-card">
                        <div className="card-header">
                            <h3 className="card-title">Recent Activity</h3>
                        </div>
                        <div className="card-body">
                            <p className="amount">{recentTransactionCount}</p>
                            <p className="change">Recent transactions</p>
                            <div className="transaction-list">
                                {isLoadingTransactions ? (
                                    <div className="chart-overlay-state">
                                        <div className="spinner small"></div>
                                        <span>Loading transactions...</span>
                                    </div>
                                ) : (
                                    recentTransactionsData?.transactions?.length > 0 ? 
                                        recentTransactionsData.transactions.slice(0, 4).map((transaction, index) => (
                                            <div key={transaction.id || index} className="transaction-item">
                                                <span className="transaction-type">{transaction.type}</span>
                                                <span className="transaction-amount">
                                                    {formatCurrency(transaction.amount)}
                                                </span>
                                            </div>
                                        )) : (
                                            <div className="chart-overlay-state">
                                                <div className="empty-icon">📊</div>
                                                <span>{recentTransactionsData?.message || "No recent transactions"}</span>
                                            </div>
                                        )
                                )}
                            </div>
                        </div>
                    </article>
                </div>
            </main>
        </div>
        <ToastContainer 
            position="top-right" 
            autoClose={3000} 
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
        />
        </>
    );
};

export default Dashboard;
