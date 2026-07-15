import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo3 from "../../assets/image/logo3.png";
import "../../assets/styles/Sidebar.scss";
import { FaBars, FaTimes } from 'react-icons/fa';

const Sidebar = ({ onLogout }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [userName, setUserName] = useState('Dashboard'); // Default fallback
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Create axios instance with base URL
  const api = axios.create({ 
    baseURL: process.env.REACT_APP_API_BASE_URL, 
    headers: { 'Content-Type': 'application/json' }
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          console.error('No auth token found');
          setLoading(false);
          return;
        }

        const response = await api.get('/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });

        if (response.status === 200) {
          const userData = response.data;
          // Use firstName if available, otherwise use name, otherwise fallback to 'Dashboard'
          const displayName = userData.firstName || userData.name || 'Dashboard';
          setUserName(displayName);
        } else {
          console.error('Failed to fetch user profile:', response.status);
          // Keep default 'Dashboard' on error
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Keep default 'Dashboard' on error
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Fixed logout handler
  const handleSignOut = () => {
    if (typeof onLogout === 'function') {
      onLogout(); // This will trigger App.jsx to clear auth and redirect to login
    } else {
      console.error("Sidebar: onLogout prop is missing or not a function!");
      // Fallback - clear localStorage and force reload
      localStorage.removeItem("authToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userData");
      window.location.href = '/login';
    }
  };

  // Handle payment navigation with manual payment option
  const handlePaymentNavigation = (e) => {
    e.preventDefault(); // Prevent default NavLink behavior
    closeMobileNav();
    
    // Navigate to payment with a flag indicating it's a manual payment
    navigate('/dashboard/payment', { 
      state: { 
        isManualPayment: true,
        purchaseDetails: null // No specific purchase details for manual payment
      } 
    });
  };

  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
  };

  const closeMobileNav = () => {
    if (isMobileNavOpen) {
      setIsMobileNavOpen(false);
    }
  };

  useEffect(() => {
    if (isMobileNavOpen) {
      const closeNav = () => setIsMobileNavOpen(false);
      window.addEventListener('popstate', closeNav);
      return () => {
        window.removeEventListener('popstate', closeNav);
      };
    }
  }, [isMobileNavOpen]);

  return (
    <div className={`dashboard-container-wrapper ${isMobileNavOpen ? 'mobile-sidebar-open' : ''}`}>
      <button
        className="dashboard__sidebar-toggle"
        onClick={toggleMobileNav}
        aria-label="Toggle navigation"
        aria-expanded={isMobileNavOpen}
      >
        {isMobileNavOpen ? <FaTimes /> : <FaBars />}
      </button>

      <aside className={`dashboard__sidebar ${isMobileNavOpen ? 'is-open' : ''}`}>
        {/* Enhanced Logo Section with Reusable Styling */}
        <div className="dashboard__sidebar-logo">
          {/* Option 1: Simple logo with link wrapper */}
          <a href="/dashboard" onClick={closeMobileNav}>
            <img src={logo3} alt="logo" className="logo1-img" />
          </a>
          <h2 className="dashboard__sidebar-title">
            {loading ? 'Loading...' : userName}
          </h2>
          
          {/* Option 2: Use with brand name instead of title 
          <a href="/dashboard" onClick={closeMobileNav}>
            <img src={logo3} alt="logo" className="logo1-img" />
          </a>
          <span className="brand-name">
            {loading ? 'Loading...' : userName}
          </span>
          */}
        </div>

        <ul className="dashboard__sidebar-menu">
          <li className="dashboard__sidebar-menu-item">
            <NavLink 
              to="/dashboard" 
              end 
              onClick={closeMobileNav} 
              className={({ isActive }) => isActive ? "dashboard__sidebar-menu-item--active" : ""}
            >
              Dashboard
            </NavLink>
          </li>
          <li className="dashboard__sidebar-menu-item">
            <NavLink 
              to="/dashboard/investmenttools" 
              onClick={closeMobileNav} 
              className={({ isActive }) => isActive ? "dashboard__sidebar-menu-item--active" : ""}
            >
              Investment Tool
            </NavLink>
          </li>
          <li className="dashboard__sidebar-menu-item">
            <NavLink 
              to="/dashboard/marketguides" 
              onClick={closeMobileNav} 
              className={({ isActive }) => isActive ? "dashboard__sidebar-menu-item--active" : ""}
            >
              Market Guides
            </NavLink>
          </li>
          <li className="dashboard__sidebar-menu-item">
            <NavLink 
              to="/dashboard/profile" 
              onClick={closeMobileNav} 
              className={({ isActive }) => isActive ? "dashboard__sidebar-menu-item--active" : ""}
            >
              Profile
            </NavLink>
          </li>
          <li className="dashboard__sidebar-menu-item">
            {/* Modified Payment Link */}
            <a 
              href="#"
              onClick={handlePaymentNavigation}
              className="dashboard__sidebar-menu-link"
            >
              Payment
            </a>
          </li>
          <li className="dashboard__sidebar-menu-item">
            <NavLink 
              to="/dashboard/withdrawal" 
              onClick={closeMobileNav} 
              className={({ isActive }) => isActive ? "dashboard__sidebar-menu-item--active" : ""}
            >
              Withdrawal
            </NavLink>
          </li>
          <li 
            className="dashboard__sidebar-signout" 
            onClick={() => { 
              handleSignOut(); 
              closeMobileNav(); 
            }} 
            style={{ cursor: 'pointer' }}
          >
            Sign Out
          </li>
        </ul>
      </aside>
      {isMobileNavOpen && <div className="dashboard__sidebar-overlay" onClick={toggleMobileNav}></div>}
    </div>
  );
};

export default Sidebar;
