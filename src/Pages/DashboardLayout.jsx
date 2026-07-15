// src/Pages/DashboardLayout.jsx
// *** REPLACE YOUR ENTIRE FILE WITH THIS CODE ***

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Component/dashboard/Sidebar'; // Adjust path if needed

// Enhanced styles that combine your existing inline styles with proper CSS classes
const layoutStyle = {
  display: 'flex',
  minHeight: '100vh'
};

const contentStyle = {
  flexGrow: 1,
  
  // Add other styles for your main content area
};

const DashboardLayout = ({ onLogout }) => {
  return (
    <div className="dashboard-layout" style={layoutStyle}>
      {/* The Sidebar is now part of the permanent layout */}
      <Sidebar onLogout={onLogout} />

      {/* The <Outlet> is a placeholder from React Router. */}
      {/* It will render the correct child component (Dashboard, Profile, Payment, etc.) */}
      <main className="dashboard-content" style={contentStyle}>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;