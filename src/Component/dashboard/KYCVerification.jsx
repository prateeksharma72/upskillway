// src/components/profile/KYCVerification.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Style/Profile.scss'; // Assuming KYC styles can reuse Profile's SCSS

// Get the base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_USER_SERVICE_API_BASE_URL ;

const KYCVerification = ({ initialData, onKycUpdateSuccess }) => {
  // State for text inputs (Aadhaar/PAN numbers)
  const [kycData, setKycData] = useState({
    aadhaarNumber: '',
    panNumber: '',
  });

  // State for file inputs
  const [files, setFiles] = useState({
    aadhaarDoc: null,
    panDoc: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill the form with existing user data when the component loads
  useEffect(() => {
    if (initialData) {
      setKycData({
        aadhaarNumber: initialData.aadhaarNumber || '',
        panNumber: initialData.panNumber || '',
      });
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setKycData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles.length > 0) {
      setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!kycData.aadhaarNumber || !kycData.panNumber || !files.aadhaarDoc || !files.panDoc) {
      toast.warn("Please fill all fields and upload both documents.");
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('authToken');

    try {
      // --- Step 1: Upload Documents ---
      const formData = new FormData();
      formData.append('aadhaarDoc', files.aadhaarDoc);
      formData.append('panDoc', files.panDoc);

      const uploadUrl = `${API_BASE_URL}/api/users/profile/upload`;
      const uploadResponse = await axios.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      const { aadhaarDocUrl, panDocUrl } = uploadResponse.data;
      
      if (!aadhaarDocUrl || !panDocUrl) {
          throw new Error("File upload did not return the expected URLs.");
      }

      // --- Step 2: Update Profile with URLs and Numbers ---
      const updatePayload = {
        ...kycData, // aadhaarNumber, panNumber
        aadhaarDocUrl,
        panDocUrl,
      };

      const profileUrl = `${API_BASE_URL}/api/users/profile`;
      await axios.put(profileUrl, updatePayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("KYC details submitted successfully for verification!");
      if (onKycUpdateSuccess) {
        onKycUpdateSuccess(); // Notify parent component to refetch data
      }

    } catch (error) {
      console.error("KYC Submission Error:", error);
      toast.error(error.response?.data?.message || "An error occurred during KYC submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If KYC is already completed, show a success message
  if (initialData.kycCompleted) {
    return (
      <section className="kyc-verification card">
        <h3>KYC Verification</h3>
        <div className="kyc-verified-status">
          <span role="img" aria-label="check-mark">✅</span>
          Your KYC is verified. No further action is needed.
        </div>
      </section>
    );
  }

  // Otherwise, show the form
  return (
    <section className="kyc-verification card">
      <h3>KYC Verification</h3>
      <p>Please provide your Aadhaar and PAN details for verification.</p>
      
      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="aadhaarNumber">Aadhaar Number</label>
          <input
            type="text"
            id="aadhaarNumber"
            name="aadhaarNumber"
            placeholder="Enter 12-digit Aadhaar Number"
            value={kycData.aadhaarNumber}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="aadhaarDoc">Upload Aadhaar Document (PDF, JPG, PNG)</label>
          <input
            type="file"
            id="aadhaarDoc"
            name="aadhaarDoc"
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
            required
          />
          {files.aadhaarDoc && <span className="file-name">Selected: {files.aadhaarDoc.name}</span>}
          {initialData.aadhaarDocUrl && !files.aadhaarDoc && <span className="file-name">Previously uploaded. <a href={initialData.aadhaarDocUrl} target="_blank" rel="noopener noreferrer">View</a></span>}
        </div>

        <div className="form-group">
          <label htmlFor="panNumber">PAN Number</label>
          <input
            type="text"
            id="panNumber"
            name="panNumber"
            placeholder="Enter 10-character PAN"
            value={kycData.panNumber}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="panDoc">Upload PAN Document (PDF, JPG, PNG)</label>
          <input
            type="file"
            id="panDoc"
            name="panDoc"
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
            required
          />
          {files.panDoc && <span className="file-name">Selected: {files.panDoc.name}</span>}
          {initialData.panDocUrl && !files.panDoc && <span className="file-name">Previously uploaded. <a href={initialData.panDocUrl} target="_blank" rel="noopener noreferrer">View</a></span>}
        </div>

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Submitting KYC..." : "Submit for Verification"}
        </button>
      </form>
    </section>
  );
};

export default KYCVerification;