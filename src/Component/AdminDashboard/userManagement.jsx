// UserManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Style/UserManagement.scss';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingUser, setUpdatingUser] = useState(null); // Track which user is being updated
  const navigate = useNavigate();
  const { onLogout } = useOutletContext() || {};

  const baseUrl = process.env.REACT_APP_API_BASE_URL;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Handle status change for dropdown
  const handleStatusChange = async (userId, newStatus) => {
    if (!baseUrl) {
      toast.error("API base URL is not configured");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      if (onLogout) onLogout();
      else navigate('/login');
      return;
    }

    // Set the user as being updated to show loading state
    setUpdatingUser(userId);

    try {
      let endpoint;
      if (newStatus === 'active') {
        endpoint = `${baseUrl}/api/users/${userId}/activate`;
      } else if (newStatus === 'inactive') {
        endpoint = `${baseUrl}/api/users/${userId}/deactivate`;
      } else {
        toast.error("Invalid status value");
        setUpdatingUser(null);
        return;
      }

      const response = await axios.put(endpoint, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Update the user status in the local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId || user._id === userId 
            ? { ...user, isActive: newStatus === 'active', status: newStatus } 
            : user
        )
      );

      // Show success toast
      toast.success(response.data.message || `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
      
      console.log(`User ${userId} status updated to ${newStatus}:`, response.data);

    } catch (error) {
      console.error('Error updating user status:', error);
      
      // Revert the change if API call fails
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId || user._id === userId 
            ? { ...user, isActive: newStatus === 'inactive', status: newStatus === 'active' ? 'inactive' : 'active' } 
            : user
        )
      );

      let errorMessage = 'Failed to update user status.';
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          errorMessage = "Your session has expired or you lack permission. Please log in again.";
          if (onLogout) onLogout();
          else {
            localStorage.removeItem("authToken");
            localStorage.removeItem("userRole");
            localStorage.removeItem("userData");
            navigate('/login');
          }
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage += ` Server responded with status ${error.response.status}.`;
        }
      } else if (error.request) {
        errorMessage = 'No response received from server. Check API server and network.';
      } else {
        errorMessage += ` Error: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setUpdatingUser(null);
    }
  };

  useEffect(() => {
    if (!baseUrl) {
      setError("API base URL is not configured. Please set REACT_APP_API_BASE_URL in your .env file.");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("authToken");
    const userRole = localStorage.getItem("userRole");

    if (!token || userRole !== "admin") {
      setError("Unauthorized: No valid admin token or role. Please log in.");
      setLoading(false);
      if (onLogout) onLogout();
      else navigate('/login');
      return;
    }

    setLoading(true);
    setError(null);

    axios.get(`${baseUrl}/api/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        let usersData = [];
        if (Array.isArray(response.data)) {
          usersData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          usersData = response.data.users || response.data.data || [];
          if (!Array.isArray(usersData)) {
            console.error('Expected users array, but got:', usersData);
            usersData = [];
            throw new Error('Invalid data format for users list');
          }
        } else {
          console.error('Invalid data format received for users:', response.data);
          throw new Error('Invalid data format received from API');
        }
        
        // Process user data to handle isActive field from backend
        usersData = usersData.map(user => ({
          ...user,
          // Use isActive field from backend to determine status
          status: user.isActive === false ? 'inactive' : 'active',
          // Ensure isActive is a boolean
          isActive: user.isActive !== false
        }));
        
        setUsers(usersData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching users:', err);
        let errorMessage = 'Failed to fetch users.';
        if (err.response) {
          errorMessage += ` Server responded with status ${err.response.status}.`;
          if (err.response.data && err.response.data.message) {
            errorMessage += ` Message: ${err.response.data.message}`;
          }
          if (err.response.status === 401 || err.response.status === 403) {
            errorMessage += " Your session may have expired or you lack permission. Please log in again.";
            if (onLogout) onLogout();
            else {
                localStorage.removeItem("authToken");
                localStorage.removeItem("userRole");
                localStorage.removeItem("userData");
                navigate('/login');
            }
          }
        } else if (err.request) {
          errorMessage += ' No response received from server. Check API server and network.';
        } else {
          errorMessage += ` Error: ${err.message}`;
        }
        setError(errorMessage);
        setLoading(false);
      });
  }, [baseUrl, navigate, onLogout]);

  if (loading && !users.length && !error) {
    return <div className="user-management-page"><p>Loading users...</p></div>;
  }

  return (
    <div className="user-management-page">
      <h2>User Management</h2>

      {loading && users.length > 0 && <p>Updating user list...</p>}
      {error && <p className="error-message" style={{color: 'red', border: '1px solid red', padding: '10px'}}>{error}</p>}
      
      {!loading && !error && users.length === 0 && (
        <p>No users found.</p>
      )}

      {!error && users.length > 0 && (
        <>
          <div className="table-responsive">
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Verified</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id || user._id}>
                    <td>{user.id || 'N/A'}</td> 
                    <td>{user.name || 'N/A'}</td>
                    <td>{user.email || 'N/A'}</td>
                    <td>{user.phone || 'N/A'}</td>
                    <td>{user.role || 'N/A'}</td>
                    <td>
                      <div className="verification-group">
                        <span className={`verification-badge ${user.isEmailVerified ? 'verified' : 'not-verified'}`}>
                          Email {user.isEmailVerified ? '✓' : '✗'}
                        </span>
                        <span className={`verification-badge ${user.isPhoneVerified ? 'verified' : 'not-verified'}`}>
                          Phone {user.isPhoneVerified ? '✓' : '✗'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="status-dropdown">
                        <select 
                          value={user.status || 'active'} 
                          onChange={(e) => handleStatusChange(user.id || user._id, e.target.value)}
                          className={`status-select ${user.status || 'active'}`}
                          disabled={updatingUser === (user.id || user._id)}
                        >
                          <option value="active">
                            {updatingUser === (user.id || user._id) && user.status === 'active' ? 'Updating...' : 'Active'}
                          </option>
                          <option value="inactive">
                            {updatingUser === (user.id || user._id) && user.status === 'inactive' ? 'Updating...' : 'Inactive'}
                          </option>
                        </select>
                        {updatingUser === (user.id || user._id) && (
                          <div className="status-loading">Updating...</div>
                        )}
                      </div>
                    </td>
                    <td>{formatDate(user.createdAt || user.registrationDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button disabled>❮</button>
            <span>1</span>
            <button disabled>❯</button>
          </div>
        </>
      )}
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
    </div>
  );
};

export default UserManagement;
