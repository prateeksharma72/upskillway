import React from 'react';
import Sidebar from '../components/Sidebar'; // Assuming your Sidebar path
import { Outlet } from 'react-router-dom';
import './DashboardLayout.scss'; // Changed to .scss

const DashboardLayout = ({ setIsAuthenticated }) => {
  return (
    <div className="dashboard-layout">
      <Sidebar setIsAuthenticated={setIsAuthenticated} />
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;