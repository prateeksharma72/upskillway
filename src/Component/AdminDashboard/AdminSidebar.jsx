// SidebarAdmin.jsx
import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import logo3 from "../../assets/image/logo3.png";
import './Style/AdminSidebar.scss' // Styles for this specific sidebar

const SidebarAdmin = ({ onLogout, isMobileOpen, onMobileClose, userData }) => {
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Close sidebar when clicking outside or pressing escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileOpen && !isSigningOut) {
        onMobileClose();
      }
    };

    if (isMobileOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen, onMobileClose, isSigningOut]);

  const handleSignOut = async () => {
    // Prevent multiple sign out attempts
    if (isSigningOut) {
      console.log('SidebarAdmin: Sign out already in progress');
      return;
    }

    console.log('SidebarAdmin: Sign out clicked');
    setIsSigningOut(true);
    
    try {
      // Close mobile sidebar first if open
      if (onMobileClose && isMobileOpen) {
        onMobileClose();
      }

      // Small delay to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Use the passed onLogout function - this should handle everything
      if (typeof onLogout === 'function') {
        await onLogout();
      } else {
        // Fallback logout logic
        console.log('SidebarAdmin: Using fallback logout');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userData');
        
        // Navigate with replace to prevent back navigation issues
        navigate('/login', { replace: true });
      }
    } catch (error) {
      console.error('SidebarAdmin: Error during sign out:', error);
      // Even if there's an error, still try to logout
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userData');
      navigate('/login', { replace: true });
    } finally {
      // Reset the signing out state after a delay
      setTimeout(() => {
        setIsSigningOut(false);
      }, 1000);
    }
  };

  const handleNavClick = () => {
    // Close sidebar on mobile when a nav item is clicked (but not during sign out)
    if (onMobileClose && window.innerWidth <= 768 && !isSigningOut) {
      onMobileClose();
    }
  };

  const handleOverlayClick = (e) => {
    // Close sidebar when clicking on overlay (but not during sign out)
    if (e.target.classList.contains('admin-sidebar__overlay') && !isSigningOut) {
      onMobileClose();
    }
  };

  // Prevent clicks inside sidebar from closing it
  const handleSidebarClick = (e) => {
    e.stopPropagation();
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="admin-sidebar__overlay" 
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}
      
      <aside 
        className={`admin-sidebar ${isMobileOpen ? "open" : ""} ${isSigningOut ? "signing-out" : ""}`}
        onClick={handleSidebarClick}
        role="navigation"
        aria-label="Admin navigation"
      >
        {/* Updated logo section with new structure */}
        <div className="admin-sidebar__logo-section">
          <a href="/adminDashboard">
            <img src={logo3} alt="Admin Logo" />
          </a>
          <span className="brand-name">Admin Dashboard</span>
        </div>
        
        <nav className="admin-sidebar__nav">
          <ul className="admin-sidebar__menu">
            <li className="admin-sidebar__menu-item">
              <NavLink 
                to="/adminDashboard" 
                end 
                className={({ isActive }) => 
                  `${isActive ? "active-link" : ""} ${isSigningOut ? "disabled" : ""}`
                }
                onClick={!isSigningOut ? handleNavClick : (e) => e.preventDefault()}
                aria-label="Dashboard"
                style={isSigningOut ? { pointerEvents: 'none', opacity: 0.6 } : {}}
              >
                <span className="admin-sidebar__menu-icon">📊</span>
                <span className="admin-sidebar__menu-text">Dashboard</span>
              </NavLink>
            </li>
            <li className="admin-sidebar__menu-item">
              <NavLink 
                to="/adminDashboard/userManagement" 
                className={({ isActive }) => 
                  `${isActive ? "active-link" : ""} ${isSigningOut ? "disabled" : ""}`
                }
                onClick={!isSigningOut ? handleNavClick : (e) => e.preventDefault()}
                aria-label="User Management"
                style={isSigningOut ? { pointerEvents: 'none', opacity: 0.6 } : {}}
              >
                <span className="admin-sidebar__menu-icon">👥</span>
                <span className="admin-sidebar__menu-text">User Management</span>
              </NavLink>
            </li>
            <li className="admin-sidebar__menu-item">
              <NavLink 
                to="/adminDashboard/manageBlog" 
                className={({ isActive }) => 
                  `${isActive ? "active-link" : ""} ${isSigningOut ? "disabled" : ""}`
                }
                onClick={!isSigningOut ? handleNavClick : (e) => e.preventDefault()}
                aria-label="Manage Blog"
                style={isSigningOut ? { pointerEvents: 'none', opacity: 0.6 } : {}}
              >
                <span className="admin-sidebar__menu-icon">📝</span>
                <span className="admin-sidebar__menu-text">Manage Blog</span>
              </NavLink>
            </li>
            <li className="admin-sidebar__menu-item">
              <NavLink 
                to="/adminDashboard/transaction" 
                className={({ isActive }) => 
                  `${isActive ? "active-link" : ""} ${isSigningOut ? "disabled" : ""}`
                }
                onClick={!isSigningOut ? handleNavClick : (e) => e.preventDefault()}
                aria-label="Transactions"
                style={isSigningOut ? { pointerEvents: 'none', opacity: 0.6 } : {}}
              >
                <span className="admin-sidebar__menu-icon">💰</span>
                <span className="admin-sidebar__menu-text">Transactions</span>
              </NavLink>
            </li>
            <li className="admin-sidebar__menu-item">
              <NavLink 
                to="/adminDashboard/withdrawals" 
                className={({ isActive }) => 
                  `${isActive ? "active-link" : ""} ${isSigningOut ? "disabled" : ""}`
                }
                onClick={!isSigningOut ? handleNavClick : (e) => e.preventDefault()}
                aria-label="Withdrawals"
                style={isSigningOut ? { pointerEvents: 'none', opacity: 0.6 } : {}}
              >
                <span className="admin-sidebar__menu-icon">🏦</span>
                <span className="admin-sidebar__menu-text">Withdrawals</span>
              </NavLink>
            </li>
            <li className="admin-sidebar__menu-item">
              <NavLink 
                to="/adminDashboard/adminPlans" 
                className={({ isActive }) => 
                  `${isActive ? "active-link" : ""} ${isSigningOut ? "disabled" : ""}`
                }
                onClick={!isSigningOut ? handleNavClick : (e) => e.preventDefault()}
                aria-label="Plans"
                style={isSigningOut ? { pointerEvents: 'none', opacity: 0.6 } : {}}
              >
                <span className="admin-sidebar__menu-icon">📋</span>
                <span className="admin-sidebar__menu-text">Plans</span>
              </NavLink>
            </li>
          </ul>
        </nav>
        
        {/* User info section (optional) */}
        {userData && (
          <div className="admin-sidebar__user-info">
            <div className="admin-sidebar__user-avatar">
              {/* Add user avatar if available */}
            </div>
            <div className="admin-sidebar__user-details">
              {/* Add user details if needed */}
            </div>
          </div>
        )}
        
        <div 
          className={`admin-sidebar__signout ${isSigningOut ? 'signing-out' : ''}`}
          onClick={!isSigningOut ? handleSignOut : undefined}
          role="button"
          tabIndex={isSigningOut ? -1 : 0}
          aria-label={isSigningOut ? "Signing out..." : "Sign out"}
          aria-disabled={isSigningOut}
          style={isSigningOut ? { pointerEvents: 'none', opacity: 0.6 } : {}}
          onKeyDown={!isSigningOut ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSignOut();
            }
          } : undefined}
        >
          <span className="admin-sidebar__signout-icon">
            {isSigningOut ? '⏳' : '🚪'}
          </span>
          <span className="admin-sidebar__signout-text">
            {isSigningOut ? 'Signing Out...' : 'Sign Out'}
          </span>
        </div>
      </aside>
    </>
  );
};

export default SidebarAdmin;
