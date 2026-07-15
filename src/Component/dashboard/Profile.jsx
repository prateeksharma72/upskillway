// src/components/profile/Profile.jsx

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from "../dashboard/Sidebar";
import "./Style/Profile.scss"; 
import { FaRegBell, FaSearch } from 'react-icons/fa';
import defaultProfileImage from "../../assets/image/logo4.png";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import KYCVerification from './KYCVerification'; // <-- Import the new component


// Use the explicit IP or your env variable
const API_BASE_URL = process.env.REACT_APP_USER_SERVICE_API_BASE_URL ;

const Profile = () => {
  // 1. Expanded State to include all user fields from the backend
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dob: '',
    address: '',
    city: '',
    country: '',
    profilePictureUrl: defaultProfileImage,
    // Add KYC fields to the state
    aadhaarNumber: '',
    panNumber: '',
    aadhaarDocUrl: '',
    panDocUrl: '',
    kycCompleted: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Fetch profile data (now wrapped in useCallback for stability)
  const fetchProfileData = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true); // Set loading true when refetching
    try {
      const profileUrl = `${API_BASE_URL}/api/users/profile`;
      const response = await axios.get(profileUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const user = response.data;
      console.log("Profile.jsx: Fetched user data from API:", user);
      
      // Update state with all fetched data
      setProfileData({
        ...user, // This will map all fields like firstName, kycCompleted, etc.
        dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '', 
        profilePictureUrl: user.profilePictureUrl || defaultProfileImage,
      });

      localStorage.setItem('userData', JSON.stringify(user));
    } catch (error) {
      console.error("Profile.jsx: Error fetching profile data:", error);
      toast.error(error.response?.data?.message || "Could not load your profile.");
    } finally {
      setIsLoading(false);
    }
  }, []); // useCallback dependency array

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]); // Effect runs when component mounts and when fetchProfileData changes (which it won't)

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({ ...prevData, [name]: value }));
  };

  // 3. Handle form submission for basic profile info
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error("Authentication token expired. Please log in again.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Payload for basic info update
      const updatePayload = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        dob: profileData.dob,
        address: profileData.address,
        city: profileData.city,
        country: profileData.country,
      };

      const profileUrl = `${API_BASE_URL}/api/users/profile`;
      const response = await axios.put(profileUrl, updatePayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Profile updated successfully!");
      
      const updatedUser = response.data.user;
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      setProfileData(prev => ({
        ...prev, 
        ...updatedUser,
        dob: updatedUser.dob ? new Date(updatedUser.dob).toISOString().split('T')[0] : '',
      }));
      
    } catch (error) {
      console.error("Profile.jsx: Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeProfilePicture = () => toast.info("Feature coming soon!");
  const handleDeleteAccount = () => toast.warn("Please contact support to delete your account.");

  if (isLoading && !profileData.email) { // Show full-page loader only on initial load
    return (
      <div className="dashboard-profile">
        <Sidebar />
        <main className="main-content-profile">
          <p style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.2rem' }}>Loading Your Profile...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-profile">
      <Sidebar />
      <main className="main-content-profile">
        {/* User Profile Section */}
        <section className="user-profile card">
          {/* ... (Your existing profile form JSX is fine) ... */}
          <h3>User Profile Setting</h3>
          
          <form className="profile-form" onSubmit={handleFormSubmit}>
            {/* Form rows for first name, last name, email etc. */}
             <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input type="text" id="firstName" name="firstName" placeholder="First Name" value={profileData.firstName} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input type="text" id="lastName" name="lastName" placeholder="Last Name" value={profileData.lastName} onChange={handleInputChange} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="profileEmail">Email Address</label>
              <input type="email" id="profileEmail" name="email" placeholder="Email Address" value={profileData.email} readOnly  />
            </div>
            
            <div className="form-group">
              <label htmlFor="dob">Date of Birth</label>
              <input type="date" id="dob" name="dob" value={profileData.dob} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input type="text" id="address" name="address" placeholder="Your Street Address" value={profileData.address} onChange={handleInputChange} />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input type="text" id="city" name="city" placeholder="City" value={profileData.city} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input type="text" id="country" name="country" placeholder="Country" value={profileData.country} onChange={handleInputChange} />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </section>
        
        {/* ----- KYC Verification Section ----- */}
        <KYCVerification 
          initialData={profileData} 
          onKycUpdateSuccess={fetchProfileData} // Pass the fetch function as a callback
        />

      </main>
      <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} />
    </div>
  );
};

export default Profile;