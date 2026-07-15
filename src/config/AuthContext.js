import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axiosConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage
  const initializeAuth = () => {
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedRole = localStorage.getItem('userRole');
      const storedUserData = localStorage.getItem('userData');

      if (storedToken && storedRole && storedUserData) {
        const userData = JSON.parse(storedUserData);
        setToken(storedToken);
        setUserRole(storedRole);
        setCurrentUser(userData);
        setIsAuthenticated(true);
        console.log('Auth initialized from localStorage');
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  // Clear all auth data
  const clearAuthData = () => {
    setCurrentUser(null);
    setToken(null);
    setUserRole(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
  };

  // Set auth data after successful login
  const setAuthData = (authResponse) => {
    const { token, refreshToken, user, role } = authResponse;
    
    setToken(token);
    setUserRole(role);
    setCurrentUser(user);
    setIsAuthenticated(true);
    
    localStorage.setItem('authToken', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    localStorage.setItem('userRole', role);
    localStorage.setItem('userData', JSON.stringify(user));
  };

  // Signup function
  const signup = async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      
      if (response.data.success) {
        setAuthData(response.data);
        return { success: true, data: response.data };
      }
      
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Signup error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Signup failed' 
      };
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      
      if (response.data.success) {
        setAuthData(response.data);
        return { success: true, data: response.data };
      }
      
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Google OAuth login (if your backend supports it)
  const signInWithGoogle = async (googleToken) => {
    try {
      const response = await api.post('/api/auth/google', { token: googleToken });
      
      if (response.data.success) {
        setAuthData(response.data);
        return { success: true, data: response.data };
      }
      
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Google sign in failed' 
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Optional: Call logout endpoint to invalidate token on server
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/api/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with logout even if API call fails
    } finally {
      clearAuthData();
    }
  };

  // Get current token
  const getToken = () => {
    return token || localStorage.getItem('authToken');
  };

  // Get user role
  const getUserRole = () => {
    return userRole || localStorage.getItem('userRole');
  };

  // Check if user is admin
  const isAdmin = () => {
    const role = getUserRole();
    return role === 'admin';
  };

  // Check if user is authenticated
  const isUserAuthenticated = () => {
    return isAuthenticated && !!getToken();
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    try {
      const response = await api.put('/api/auth/profile', updates);
      
      if (response.data.success) {
        const updatedUser = { ...currentUser, ...response.data.user };
        setCurrentUser(updatedUser);
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        return { success: true, data: updatedUser };
      }
      
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Profile update failed' 
      };
    }
  };

  // Verify token validity
  const verifyToken = async () => {
    try {
      const response = await api.get('/api/auth/verify');
      if (response.data.success) {
        return true;
      } else {
        clearAuthData();
        return false;
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      clearAuthData();
      return false;
    }
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/api/auth/refresh', {
        refreshToken: refreshTokenValue
      });

      if (response.data.success) {
        const { token: newToken, refreshToken: newRefreshToken } = response.data;
        setToken(newToken);
        localStorage.setItem('authToken', newToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        return newToken;
      }
      
      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuthData();
      throw error;
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      return { 
        success: response.data.success, 
        message: response.data.message 
      };
    } catch (error) {
      console.error('Password change error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Password change failed' 
      };
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      
      return { 
        success: response.data.success, 
        message: response.data.message 
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Request failed' 
      };
    }
  };

  // Reset password
  const resetPassword = async (token, newPassword) => {
    try {
      const response = await api.post('/api/auth/reset-password', {
        token,
        newPassword
      });
      
      return { 
        success: response.data.success, 
        message: response.data.message 
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Reset failed' 
      };
    }
  };

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Verify token periodically
  useEffect(() => {
    if (isAuthenticated && token) {
      const interval = setInterval(() => {
        verifyToken();
      }, 15 * 60 * 1000); // Check every 15 minutes

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token]);

  const value = {
    // User state
    currentUser,
    token: getToken(),
    userRole: getUserRole(),
    isAuthenticated: isUserAuthenticated(),
    loading,
    
    // Auth methods
    signup,
    login,
    logout,
    signInWithGoogle,
    
    // Utility methods
    getToken,
    getUserRole,
    isAdmin,
    isUserAuthenticated,
    updateUserProfile,
    verifyToken,
    refreshToken,
    changePassword,
    forgotPassword,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};