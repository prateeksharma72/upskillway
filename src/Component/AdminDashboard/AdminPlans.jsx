import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // Keep axios for creating the instance
import './Style/AdminPlans.scss';

const baseUrl = process.env.REACT_APP_API_BASE_URL;
// --- Environment Variables for API Base URLs ---
const plansApiBaseUrl = process.env.REACT_APP_PLANS_API_BASE_URL;
const userServiceApiBaseUrl = process.env.REACT_APP_USER_SERVICE_API_BASE_URL;
const externalDataApiBaseUrl = process.env.REACT_APP_EXTERNAL_DATA_API_BASE_URL;
const externalDataApiKey = process.env.REACT_APP_EXTERNAL_DATA_API_KEY; // For the external API

// --- Axios Instance with Authorization Header ---
// *** CHANGE: Added 'export' so this can be imported and mocked in tests ***
export const apiClient = axios.create({
    baseURL: `${baseUrl}/api`, // Set the base URL for all requests from this client
});

// Add a request interceptor to include the token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        // console.log('Request Headers for debugging:', config.headers);
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- AdminPlans Component ---
const AdminPlans = () => {
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [currentPlan, setCurrentPlan] = useState(null); // For editing
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
    });

    // Fetch all plans
    const fetchPlans = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('authToken'); // Check if token exists for better UX before API call
        if (!token) {
            setError("Authorization token not found. Please ensure you are logged in.");
            setIsLoading(false);
            setPlans([]); // Clear plans if no token
            return;
        }

        try {
            const response = await apiClient.get('/plans'); // Uses apiClient, which includes the token
            setPlans(response.data || []);
        } catch (e) {
            let errorMessage = "Failed to fetch plans.";
            if (e.response) {
                errorMessage = e.response.data?.message || `Error ${e.response.status}: ${e.response.statusText}`;
                if (e.response.status === 401 || e.response.status === 403) {
                    errorMessage += " (Authorization failed. Your session might have expired or token is invalid. Please try logging in again.)";
                }
            } else if (e.request) {
                errorMessage = "No response from server. Check network connection.";
            } else {
                errorMessage = e.message;
            }
            setError(errorMessage);
            console.error("Failed to fetch plans:", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' ? (value === '' ? '' : parseFloat(value) < 0 ? '0' : value) : value }));
    };

    const resetFormAndCloseModal = () => {
        setFormData({ name: '', description: '', price: '' });
        setCurrentPlan(null);
        setShowFormModal(false);
        setError(null);
    };

    const handleAddPlanClick = () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setError("Cannot add plan: Authorization token not found. Please log in.");
            // Optionally, you could redirect to login here or show a more prominent message.
            return;
        }
        setCurrentPlan(null);
        setFormData({ name: '', description: '', price: '' });
        setShowFormModal(true);
    };

    const handleEditPlanClick = (plan) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setError("Cannot edit plan: Authorization token not found. Please log in.");
            return;
        }
        setCurrentPlan(plan);
        setFormData({
            name: plan.name,
            description: plan.description || '',
            price: plan.price.toString(),
        });
        setShowFormModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const token = localStorage.getItem('authToken');
        if (!token) {
            setError("Cannot save plan: Authorization token not found. Please log in.");
            setIsLoading(false);
            return;
        }

        const { name, description, price } = formData;
        if (!name.trim() || price === '' || parseFloat(price) < 0) {
            setError("Plan Name and a valid Price (>= 0) are required.");
            return;
        }

        setIsLoading(true);

        const planData = {
            name: name.trim(),
            description: description.trim(),
            price: parseFloat(price),
        };

        try {
            if (currentPlan && currentPlan.id) {
                await apiClient.put(`/plans/${currentPlan.id}`, planData);
            } else {
                await apiClient.post('/plans', planData);
            }
            resetFormAndCloseModal();
            fetchPlans(); // Refresh the list
        } catch (e) {
            let errorMessage = "Failed to save plan.";
             if (e.response) {
                errorMessage = e.response.data?.message || `Error ${e.response.status}: ${e.response.statusText}`;
                if (e.response.status === 401 || e.response.status === 403) {
                    errorMessage += " (Authorization failed. Check token or permissions. You might need to log in again.)";
                }
            } else if (e.request) {
                errorMessage = "No response from server while saving.";
            } else {
                errorMessage = e.message;
            }
            setError(errorMessage); // Show error within the modal
            console.error("Failed to save plan:", e);
            setIsLoading(false); // Stop loading as the operation failed and modal likely stays open
        }
        // On success, isLoading will be handled by fetchPlans or reset by modal closing.
    };

    const handleDeletePlan = async (planId) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setError("Cannot delete plan: Authorization token not found. Please log in.");
            return;
        }

        if (!window.confirm("Are you sure you want to delete this plan? This action cannot be undone.")) {
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await apiClient.delete(`/plans/${planId}`);
            fetchPlans(); // Refresh the list
        } catch (e) {
            let errorMessage = "Failed to delete plan.";
            if (e.response) {
                errorMessage = e.response.data?.message || `Error ${e.response.status}: ${e.response.statusText}`;
                if (e.response.status === 401 || e.response.status === 403) {
                    errorMessage += " (Authorization failed. Check token or permissions. You might need to log in again.)";
                }
            } else if (e.request) {
                errorMessage = "No response from server while deleting.";
            } else {
                errorMessage = e.message;
            }
            setError(errorMessage);
            console.error("Failed to delete plan:", e);
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-plans-page">
            <div className="page-header">
                <h1>Manage Investment Plans</h1>
                <button onClick={handleAddPlanClick} className="btn btn-primary btn-add-plan">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    Add New Plan
                </button>
            </div>

            {/* Global Error Message for fetch/delete or token issues */}
            {error && !showFormModal && <div className="global-error-message">{error}</div>}
            
            {isLoading && plans.length === 0 && !error && <div className="loading-indicator">Loading plans...</div>}

            {showFormModal && (
                <div className="modal-overlay" data-testid="modal-overlay" onClick={resetFormAndCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-button" onClick={resetFormAndCloseModal}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24" height="24">
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                            </svg>
                        </button>
                        <h2>{currentPlan ? 'Edit Plan' : 'Create New Plan'}</h2>
                        {/* Form-specific error (can also show token errors here if an action is tried within the modal) */}
                        {error && showFormModal && <p className="form-error-message">{error}</p>}
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="name">Plan Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Growth Portfolio"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="description">Description (Optional)</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Briefly describe this plan..."
                                    rows="4"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="price">Price (₹)</label>
                                <input
                                    type="number"
                                    id="price"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 99.99"
                                    required
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={resetFormAndCloseModal} disabled={isLoading}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                    {isLoading ? 'Saving...' : (currentPlan ? 'Update Plan' : 'Create Plan')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {!showFormModal && (
                <div className="plans-grid">
                    {/* Only show "No plans found" if not loading and no error related to token being missing for fetchPlans */}
                    {plans.length === 0 && !isLoading && (!error || (error && !error.toLowerCase().includes("token not found"))) && (
                         <div className="empty-state">
                            <p>No investment plans found.</p>
                            <p>Click "Add New Plan" to get started!</p>
                        </div>
                    )}
                    {/* If there is an error and it IS about token not found, the global error message will show. */}
                    
                    {plans.map(plan => (
                        <div key={plan.id} className="plan-card">
                            <div className="plan-card-content">
                                <div className="plan-card-header">
                                    <h3>{plan.name}</h3>
                                    <span className="plan-price">${parseFloat(plan.price).toFixed(2)}</span>
                                 </div>
                                <p className="plan-description">
                                    {plan.description || <span className="no-description">No description provided.</span>}
                                </p>
                                <div className="plan-meta">
                                    <small>ID: {plan.id}</small>
                                    <small>Created: {new Date(plan.createdAt).toLocaleDateString()}</small>
                                    <small>Last Updated: {new Date(plan.updatedAt).toLocaleDateString()}</small>
                                </div>
                            </div>
                            <div className="plan-card-actions">
                                <button onClick={() => handleEditPlanClick(plan)} className="btn btn-icon btn-edit" title="Edit Plan">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </button>
                                <button 
                                    onClick={() => handleDeletePlan(plan.id)} 
                                    className="btn btn-icon btn-delete" 
                                    disabled={isLoading}
                                    title="Delete Plan"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.19-2.34.343a.75.75 0 00-.5.832l.995 6.967c.23.159.48.298.745.414V17a1 1 0 001 1h4a1 1 0 001-1v-4.745a5.38 5.38 0 00.745-.414l.995-6.967a.75.75 0 00-.5-.832c-.76-.153-1.545-.266-2.34-.343V3.75A2.75 2.75 0 008.75 1zM7.5 3.75c0-.69.56-1.25 1.25-1.25s1.25.56 1.25 1.25v.443c-.455.042-.914.101-1.37.174A4.34 4.34 0 007.5 4.193V3.75zM8.75 6a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-4.5A.75.75 0 008.75 6z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminPlans;
