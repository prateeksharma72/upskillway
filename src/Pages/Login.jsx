import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Header from "../Component/Header";
import Footer from "../Component/Footer";
import Seo from "../Component/Seo";
import logo1 from "../assets/image/logo1.png";
import authIllustration from "../assets/image/Saly-14.png";
import "../assets/styles/Login.scss";

const baseUrl = process.env.REACT_APP_API_BASE_URL;

const ADMIN_EMAILS = [
  "gaurav@example.com",
  "gaurav@example.com",
];

// Enhanced InputField component with better validation feedback
const InputField = ({ 
  label, 
  type, 
  id, 
  registerProps, 
  error, 
  showToggle, 
  showPassword, 
  togglePassword,
  isPhoneInput = false,
  phoneValue = "",
  onPhoneChange,
  validationState = null, // 'valid', 'invalid', or null
  helpText = null
}) => (
  <div className="form-group">
    <label htmlFor={id}>
      {label}
      {registerProps?.required && <span className="required-asterisk">*</span>}
    </label>
    <div style={{ position: 'relative' }}>
      {isPhoneInput ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{
            padding: '0.85rem 1rem',
            backgroundColor: '#f0f0f0',
            border: `2px solid ${error ? '#ff4757' : validationState === 'valid' ? '#2ed573' : 'rgba(255, 255, 255, 0.2)'}`,
            borderRight: 'none',
            borderRadius: '12px 0 0 12px',
            fontSize: '1rem',
            color: '#333',
            fontWeight: '500'
          }}>
            +91
          </span>
          <input
            type="tel"
            id={id}
            value={phoneValue}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
              if (onPhoneChange) {
                onPhoneChange(value);
              }
            }}
            placeholder="Enter your phone number"
            style={{
              width: '100%',
              padding: '0.85rem 1rem',
              border: `2px solid ${error ? '#ff4757' : validationState === 'valid' ? '#2ed573' : 'rgba(255, 255, 255, 0.2)'}`,
              borderLeft: 'none',
              borderRadius: '0 12px 12px 0',
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              color: '#333',
              boxSizing: 'border-box'
            }}
            maxLength="10"
            className={error ? 'input-error' : validationState === 'valid' ? 'input-valid' : ''}
          />
          {validationState === 'valid' && (
            <div style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#2ed573',
              fontSize: '16px'
            }}>
              ✓
            </div>
          )}
        </div>
      ) : (
        <>
          <input
            type={showToggle && !showPassword ? "password" : type}
            id={id}
            {...registerProps}
            placeholder={`Enter your ${label.toLowerCase()}`}
            className={error ? 'input-error' : validationState === 'valid' ? 'input-valid' : ''}
            style={{
              border: `2px solid ${error ? '#ff4757' : validationState === 'valid' ? '#2ed573' : 'rgba(255, 255, 255, 0.2)'}`,
            }}
          />
          <div style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            gap: '5px'
          }}>
            {validationState === 'valid' && (
              <span style={{ color: '#2ed573', fontSize: '16px' }}>✓</span>
            )}
            {showToggle && (
              <button
                type="button"
                onClick={togglePassword}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#666'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
    {error && (
      <div className="error-message">
        <span className="error-icon">⚠️</span>
        <p className="error">{error.message}</p>
      </div>
    )}
    {helpText && !error && (
      <p className="help-text">{helpText}</p>
    )}
  </div>
);

// Enhanced validation helper
const ValidationHelper = ({ title, checks }) => (
  <div className="validation-helper">
    <h4 className="validation-title">{title}</h4>
    <ul className="validation-list">
      {checks.map((check, index) => (
        <li key={index} className={`validation-item ${check.status}`}>
          <span className="validation-icon">
            {check.status === 'valid' ? '✅' : check.status === 'invalid' ? '❌' : '⚪'}
          </span>
          {check.text}
        </li>
      ))}
    </ul>
  </div>
);

const LoginRegister = ({ onLoginSuccess }) => {
  // All state variables
  const [isRegister, setIsRegister] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState(Array(6).fill(""));
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [registrationData, setRegistrationData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpError, setOtpError] = useState("");
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [resetToken, setResetToken] = useState("");
  const [phoneInputValue, setPhoneInputValue] = useState("");
  
  // New validation states
  const [validationStates, setValidationStates] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [showValidationHelper, setShowValidationHelper] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    clearErrors,
    trigger,
    getValues,
    setValue
  } = useForm({
    mode: 'onChange', // Enable real-time validation
    reValidateMode: 'onChange'
  });

  const watchedPassword = watch("password");
  const watchedEmail = watch("email");
  const watchedName = watch("name");
  const watchedConfirmPassword = watch("confirmPassword");

  // Enhanced validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return { isValid: false, message: "Email is required" };
    if (!emailRegex.test(email)) return { isValid: false, message: "Please enter a valid email address" };
    return { isValid: true, message: "" };
  };

  const validatePassword = (password) => {
    if (!password) return { isValid: false, message: "Password is required", checks: [] };
    
    const checks = [
      { text: "At least 8 characters", status: password.length >= 8 ? 'valid' : 'invalid' },
      { text: "Contains uppercase letter", status: /[A-Z]/.test(password) ? 'valid' : 'invalid' },
      { text: "Contains lowercase letter", status: /[a-z]/.test(password) ? 'valid' : 'invalid' },
      { text: "Contains a number", status: /\d/.test(password) ? 'valid' : 'invalid' },
      { text: "Contains special character", status: /[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'valid' : 'invalid' }
    ];
    
    const isValid = checks.every(check => check.status === 'valid');
    return { 
      isValid, 
      message: isValid ? "" : "Password doesn't meet requirements",
      checks 
    };
  };

  const validatePhone = (phone) => {
    if (!phone) return { isValid: false, message: "Phone number is required" };
    if (phone.length !== 10) return { isValid: false, message: "Phone number must be exactly 10 digits" };
    if (!/^[6-9]\d{9}$/.test(phone)) return { isValid: false, message: "Please enter a valid Indian mobile number (starting with 6-9)" };
    return { isValid: true, message: "" };
  };

  const validateName = (name) => {
    if (!name) return { isValid: false, message: "Name is required" };
    if (name.length < 2) return { isValid: false, message: "Name must be at least 2 characters" };
    if (!/^[a-zA-Z\s]+$/.test(name)) return { isValid: false, message: "Name should only contain letters and spaces" };
    return { isValid: true, message: "" };
  };

  // Real-time validation effect
  useEffect(() => {
    if (isRegister) {
      const newValidationStates = {};
      
      // Validate name
      if (watchedName) {
        const nameValidation = validateName(watchedName);
        newValidationStates.name = nameValidation.isValid ? 'valid' : 'invalid';
      }
      
      // Validate email
      if (watchedEmail) {
        const emailValidation = validateEmail(watchedEmail);
        newValidationStates.email = emailValidation.isValid ? 'valid' : 'invalid';
      }
      
      // Validate phone
      if (phoneInputValue) {
        const phoneValidation = validatePhone(phoneInputValue);
        newValidationStates.phone = phoneValidation.isValid ? 'valid' : 'invalid';
      }
      
      // Validate password
      if (watchedPassword) {
        const passwordValidation = validatePassword(watchedPassword);
        newValidationStates.password = passwordValidation.isValid ? 'valid' : 'invalid';
      }

      // Validate confirm password
      if (watchedConfirmPassword && watchedPassword) {
        newValidationStates.confirmPassword = watchedConfirmPassword === watchedPassword ? 'valid' : 'invalid';
      }
      
      setValidationStates(newValidationStates);
    }
  }, [watchedName, watchedEmail, phoneInputValue, watchedPassword, watchedConfirmPassword, isRegister]);

  const getUserRole = (email, backendRole = null) => {
    if (backendRole === "admin") return "admin";
    if (ADMIN_EMAILS.includes(email.toLowerCase())) return "admin";
    return "user";
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole");

    if (token && role) {
      navigate(role === "admin" ? "/adminDashboard" : "/dashboard");
    }

    const urlResetToken = searchParams.get('token');
    if (urlResetToken) {
      setResetToken(urlResetToken);
      setShowResetPassword(true);
      setShowForgotPassword(false);
      setIsRegister(false);
    }
  }, [navigate, searchParams]);

  useEffect(() => {
    if (location.pathname === '/login' && !searchParams.get('token')) {
      setIsRegister(false);
      setShowOtpField(false);
      setShowForgotPassword(false);
      setShowResetPassword(false);
      setIsOtpVerified(false);
      setEnteredOtp(Array(6).fill(""));
      setOtpError("");
      setOtpAttempts(0);
      setPhoneInputValue("");
      setValidationStates({});
      setFormErrors({});
      reset();
    }
  }, [location.pathname, searchParams, reset]);

  const onLogin = async (data) => {
    setLoading(true);
    setFormErrors({});
    
    try {
      // Pre-validate login data
      const emailValidation = validateEmail(data.email);
      if (!emailValidation.isValid) {
        setFormErrors(prev => ({ ...prev, email: emailValidation.message }));
        toast.error(emailValidation.message);
        return;
      }

      console.log('Attempting login with:', { email: data.email });

      const res = await axios.post(`${baseUrl}/api/users/login`, {
        email: data.email,
        password: data.password,
      });

      const token = res.data.token;
      if (token) {
        const payload = parseJwt(token);
        const userRole = getUserRole(data.email, payload.role);
        const user = {
          id: payload.userId,
          email: data.email,
          role: userRole,
        };

        if (res.data.user && res.data.user.isActive === false) {
          toast.error("Your account is restricted. Please contact support.");
          setFormErrors({ general: "Account restricted. Contact support for assistance." });
          return;
        }

        localStorage.setItem("authToken", token);
        localStorage.setItem("userRole", userRole);
        localStorage.setItem("userData", JSON.stringify(user));

        toast.success("Login Successful! Redirecting...");

        if (typeof onLoginSuccess === "function") {
          onLoginSuccess(token, userRole, user);
        }

        setTimeout(() => {
          navigate(userRole === "admin" ? "/adminDashboard" : "/dashboard");
        }, 1000);
      } else {
        toast.error("Login failed: No token received");
        setFormErrors({ general: "Login failed. Please try again." });
      }
    } catch (error) {
      console.error("Login error:", error);
      
      let errorMessage = "Login failed";
      if (error.response?.status === 401) {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (error.response?.status === 403) {
        errorMessage = "Your account is restricted. Please contact support.";
      } else if (error.response?.status === 404) {
        errorMessage = "Account not found. Please register first or check your email address.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
      setFormErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (data) => {
    onLogin(data);
  };

  const handleForgotPassword = async (data) => {
    setLoading(true);
    setFormErrors({});
    
    try {
      const emailValidation = validateEmail(data.email);
      if (!emailValidation.isValid) {
        setFormErrors({ email: emailValidation.message });
        toast.error(emailValidation.message);
        return;
      }

      await axios.post(`${baseUrl}/api/users/forgot-password`, {
        email: data.email,
      });
      toast.success("Password reset link sent to your email!");
      setShowForgotPassword(false);
      reset();
    } catch (error) {
      console.error("Forgot password error:", error);
      const errorMessage = error.response?.status === 404 
        ? "No account found with this email address."
        : error.response?.data?.message || "Failed to send reset link";
      toast.error(errorMessage);
      setFormErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (data) => {
    setLoading(true);
    setFormErrors({});
    
    try {
      const passwordValidation = validatePassword(data.newPassword);
      if (!passwordValidation.isValid) {
        setFormErrors({ newPassword: passwordValidation.message });
        toast.error(passwordValidation.message);
        return;
      }

      await axios.post(`${baseUrl}/api/users/reset-password`, {
        token: resetToken,
        newPassword: data.newPassword,
      });
      toast.success("Password reset successfully! You can now login with your new password.");
      setShowResetPassword(false);
      setResetToken("");
      reset();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("Reset password error:", error);
      const errorMessage = error.response?.status === 400
        ? "Invalid or expired reset token. Please request a new password reset."
        : error.response?.data?.message || "Failed to reset password";
      toast.error(errorMessage);
      setFormErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => {
    setIsRegister(!isRegister);
    setShowOtpField(false);
    setIsOtpVerified(false);
    setEnteredOtp(Array(6).fill(""));
    setOtpError("");
    setOtpAttempts(0);
    setShowForgotPassword(false);
    setShowResetPassword(false);
    setPhoneInputValue("");
    setValidationStates({});
    setFormErrors({});
    setShowValidationHelper(false);
    reset();
  };

  const showForgotPasswordForm = () => {
    setShowForgotPassword(true);
    setIsRegister(false);
    setShowOtpField(false);
    setShowResetPassword(false);
    setFormErrors({});
    reset();
  };

  const backToLogin = () => {
    setShowForgotPassword(false);
    setShowResetPassword(false);
    setIsRegister(false);
    setShowOtpField(false);
    setResetToken("");
    setPhoneInputValue("");
    setValidationStates({});
    setFormErrors({});
    setShowValidationHelper(false);
    reset();
  };

  useEffect(() => {
    if (showOtpField) {
      setTimeout(() => {
        document.getElementById("otp-input-0")?.focus();
      }, 100);
    }
  }, [showOtpField]);

  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  // FIXED REGISTRATION HANDLER - This is the main fix
  const handleRegistration = async (data) => {
    console.log('handleRegistration called with data:', data);
    console.log('Phone input value:', phoneInputValue);
    
    setLoading(true);
    setFormErrors({});
    
    try {
      // Comprehensive validation before submission
      const validations = {
        name: validateName(data.name),
        email: validateEmail(data.email),
        phone: validatePhone(phoneInputValue),
        password: validatePassword(data.password)
      };

      console.log('Validation results:', validations);

      const hasErrors = Object.values(validations).some(v => !v.isValid);
      
      if (hasErrors) {
        const newErrors = {};
        Object.keys(validations).forEach(key => {
          if (!validations[key].isValid) {
            newErrors[key] = validations[key].message;
          }
        });
        setFormErrors(newErrors);
        toast.error("Please fix the validation errors before continuing.");
        console.log('Validation errors found:', newErrors);
        return;
      }

      if (data.password !== data.confirmPassword) {
        setFormErrors({ confirmPassword: "Passwords do not match" });
        toast.error("Passwords do not match");
        console.log('Passwords do not match');
        return;
      }

      const fullPhoneNumber = `+91${phoneInputValue}`;
      
      const registrationPayload = {
        name: data.name,
        email: data.email,
        phone: fullPhoneNumber,
        password: data.password,
        confirmPassword: data.confirmPassword
      };

      console.log('Sending registration request with payload:', registrationPayload);
      console.log('API URL:', `${baseUrl}/api/users/register`);

      const response = await axios.post(`${baseUrl}/api/users/register`, registrationPayload);

      console.log('Registration response:', response.data);

      toast.success("Registration successful! OTP sent to your phone.");
      setPhoneNumber(fullPhoneNumber);
      setRegistrationData({ ...data, phone: fullPhoneNumber });
      setShowOtpField(true);
      setOtpCooldown(60);
      setOtpAttempts(0);
      setOtpError("");
    } catch (error) {
      console.error("Registration error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      let errorMessage = "Registration failed";
      
      if (error.response?.status === 409) {
        if (error.response.data.message.includes('email')) {
          errorMessage = "An account with this email already exists. Please login instead.";
          setFormErrors({ email: errorMessage });
        } else if (error.response.data.message.includes('phone')) {
          errorMessage = "An account with this phone number already exists.";
          setFormErrors({ phone: errorMessage });
        } else {
          errorMessage = "Account already exists. Please login instead.";
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
      setFormErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (otpCooldown > 0) return;
    setLoading(true);
    try {
      await axios.post(`${baseUrl}/api/users/resend-otp`, { phone: phoneNumber });
      toast.success("OTP Resent!");
      setOtpCooldown(60);
      setEnteredOtp(Array(6).fill(""));
      setOtpError("");
      document.getElementById("otp-input-0")?.focus();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error resending OTP. Please try registration again.";
      toast.error(errorMessage);
      setOtpError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    const sanitizedValue = value.replace(/[^0-9]/g, "");
    const newOtp = [...enteredOtp];
    newOtp[index] = sanitizedValue;
    setEnteredOtp(newOtp);
    setOtpError("");

    if (sanitizedValue && index < 5) {
      setTimeout(() => {
        document.getElementById(`otp-input-${index + 1}`)?.focus();
      }, 50);
    }

    if (sanitizedValue && index === 5 && newOtp.every(digit => digit !== "")) {
      setTimeout(() => {
        verifyOtp(null, newOtp.join(""));
      }, 100);
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !enteredOtp[index] && index > 0) {
      setTimeout(() => {
        document.getElementById(`otp-input-${index - 1}`)?.focus();
      }, 50);
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      document.getElementById(`otp-input-${index - 1}`)?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      document.getElementById(`otp-input-${index + 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    const newOtp = Array(6).fill("");
    for (let i = 0; i < paste.length; i++) {
      newOtp[i] = paste[i];
    }
    setEnteredOtp(newOtp);
    setOtpError("");

    const nextEmptyIndex = newOtp.findIndex(digit => digit === "");
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    setTimeout(() => {
      document.getElementById(`otp-input-${focusIndex}`)?.focus();
    }, 50);

    if (paste.length === 6) {
      setTimeout(() => {
        verifyOtp(null, paste);
      }, 100);
    }
  };

  const verifyOtp = async (e, otpValue = null) => {
    if (e) e.preventDefault();

    const otp = otpValue || enteredOtp.join("");

    if (otp.length !== 6) {
      setOtpError("Please enter a complete 6-digit OTP");
      return;
    }

    setLoading(true);
    setOtpError("");

    try {
      await axios.post(`${baseUrl}/api/users/verify-phone`, {
        phone: phoneNumber,
        otp: otp,
      });
      
      toast.success("Phone number verified successfully! You can now login.");
      
      setIsRegister(false);
      setShowOtpField(false);
      setIsOtpVerified(false);
      setEnteredOtp(Array(6).fill(""));
      setOtpError("");
      setOtpAttempts(0);
      setPhoneInputValue("");
      setValidationStates({});
      setFormErrors({});
      reset();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "OTP Verification Failed";
      setOtpError(errorMessage);
      setOtpAttempts(prev => prev + 1);
      
      setEnteredOtp(Array(6).fill(""));
      setTimeout(() => {
        document.getElementById("otp-input-0")?.focus();
      }, 100);
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch (error) {
      console.error("JWT parse error", error);
      return {};
    }
  };

  const formatPhoneNumber = (phone) => {
    const cleanPhone = phone.replace('+91', '');
    if (cleanPhone.length <= 4) return `+91 ${cleanPhone}`;
    return `+91 ${cleanPhone.slice(0, -4).replace(/./g, '*')}${cleanPhone.slice(-4)}`;
  };

  // Render different forms based on state
  const renderForm = () => {
    // General error display component
    const GeneralError = () => (
      formErrors.general && (
        <div className="general-error-message">
          <span className="error-icon">⚠️</span>
          <p>{formErrors.general}</p>
          {formErrors.general.includes("register first") && (
            <button 
              type="button" 
              onClick={() => {
                setIsRegister(true);
                setFormErrors({});
              }}
              className="error-action-btn"
            >
              Go to Register →
            </button>
          )}
          {formErrors.general.includes("already exists") && (
            <button 
              type="button" 
              onClick={() => {
                setIsRegister(false);
                setFormErrors({});
              }}
              className="error-action-btn"
            >
              Go to Login →
            </button>
          )}
        </div>
      )
    );

    if (showResetPassword) {
      return (
        <>
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">Enter your new password</p>
          <GeneralError />
          <form className="auth-form" onSubmit={handleSubmit(handleResetPassword)}>
            <InputField
              label="New Password"
              type="password"
              id="newPassword"
              showToggle
              showPassword={showNewPassword}
              togglePassword={() => setShowNewPassword(!showNewPassword)}
              registerProps={register("newPassword", {
                required: "New password is required",
                validate: (value) => validatePassword(value).isValid || validatePassword(value).message
              })}
              error={errors.newPassword || (formErrors.newPassword && { message: formErrors.newPassword })}
              helpText="Password must be at least 8 characters with uppercase, lowercase, number, and special character"
            />
            
            {watch("newPassword") && (
              <ValidationHelper 
                title="Password Requirements"
                checks={validatePassword(watch("newPassword")).checks || []}
              />
            )}
            
            <InputField
              label="Confirm New Password"
              type="password"
              id="confirmNewPassword"
              showToggle
              showPassword={showConfirmNewPassword}
              togglePassword={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
              registerProps={register("confirmNewPassword", {
                required: "Confirm new password is required",
                validate: (val) => val === watch("newPassword") || "Passwords do not match"
              })}
              error={errors.confirmNewPassword}
            />
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? (
                <span className="button-loading">
                  <span className="spinner"></span>
                  Resetting...
                </span>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
          <button 
            type="button" 
            onClick={backToLogin}
            className="back-to-login"
          >
            ← Back to Login
          </button>
        </>
      );
    }

    if (showForgotPassword) {
      return (
        <>
          <h2 className="auth-title">Forgot Password</h2>
          <p className="auth-subtitle">Enter your email to receive a reset link</p>
          <GeneralError />
          <form className="auth-form" onSubmit={handleSubmit(handleForgotPassword)}>
            <InputField 
              label="Email" 
              type="email" 
              id="forgotEmail" 
              registerProps={register("email", { 
                required: "Email is required",
                validate: (value) => validateEmail(value).isValid || validateEmail(value).message
              })} 
              error={errors.email || (formErrors.email && { message: formErrors.email })}
              validationState={watchedEmail ? (validateEmail(watchedEmail).isValid ? 'valid' : 'invalid') : null}
              helpText="We'll send a password reset link to this email"
            />
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? (
                <span className="button-loading">
                  <span className="spinner"></span>
                  Sending...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
          <button 
            type="button" 
            onClick={backToLogin}
            className="back-to-login"
          >
            ← Back to Login
          </button>
        </>
      );
    }

    if (isRegister) {
      return (
        <>
          <h2 className="auth-title">Register</h2>
          <p className="auth-subtitle">Create an account to get started</p>
          <GeneralError />
          
          {!showOtpField ? (
            <form className="auth-form" onSubmit={handleSubmit(handleRegistration)}>
              <InputField 
                label="Name" 
                type="text" 
                id="name" 
                registerProps={register("name", { 
                  required: "Name is required",
                  validate: (value) => validateName(value).isValid || validateName(value).message
                })} 
                error={errors.name || (formErrors.name && { message: formErrors.name })}
                validationState={validationStates.name}
                helpText="Enter your full name (letters and spaces only)"
              />
              
              <InputField 
                label="Email" 
                type="email" 
                id="email" 
                registerProps={register("email", { 
                  required: "Email is required",
                  validate: (value) => validateEmail(value).isValid || validateEmail(value).message
                })} 
                error={errors.email || (formErrors.email && { message: formErrors.email })}
                validationState={validationStates.email}
                helpText="We'll use this email for login and important notifications"
              />
              
              <InputField 
                label="Phone" 
                type="tel" 
                id="phone" 
                isPhoneInput={true}
                phoneValue={phoneInputValue}
                onPhoneChange={(value) => {
                  setPhoneInputValue(value);
                  // Set the phone value in react-hook-form for validation
                  setValue("phone", value);
                  if (errors.phone) {
                    clearErrors('phone');
                  }
                  if (formErrors.phone) {
                    setFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.phone;
                      return newErrors;
                    });
                  }
                }}
                registerProps={register("phone", { 
                  required: "Phone is required",
                  validate: () => {
                    const validation = validatePhone(phoneInputValue);
                    return validation.isValid || validation.message;
                  }
                })} 
                error={errors.phone || (formErrors.phone && { message: formErrors.phone })}
                validationState={validationStates.phone}
                helpText="We'll send OTP to this number for verification"
              />
              
              <InputField 
                label="Password" 
                type="password" 
                id="password" 
                showToggle 
                showPassword={showPassword} 
                togglePassword={() => setShowPassword(!showPassword)} 
                registerProps={register("password", { 
                  required: "Password is required",
                  validate: (value) => validatePassword(value).isValid || validatePassword(value).message
                })} 
                error={errors.password || (formErrors.password && { message: formErrors.password })}
                validationState={validationStates.password}
              />
              
              {watchedPassword && (
                <ValidationHelper 
                  title="Password Requirements"
                  checks={validatePassword(watchedPassword).checks || []}
                />
              )}
              
              <InputField 
                label="Confirm Password" 
                type="password" 
                id="confirmPassword" 
                showToggle 
                showPassword={showPassword} 
                togglePassword={() => setShowPassword(!showPassword)} 
                registerProps={register("confirmPassword", { 
                  required: "Confirm password is required", 
                  validate: (val) => val === watch("password") || "Passwords do not match" 
                })} 
                error={errors.confirmPassword || (formErrors.confirmPassword && { message: formErrors.confirmPassword })}
                validationState={validationStates.confirmPassword}
              />
              
              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? (
                  <span className="button-loading">
                    <span className="spinner"></span>
                    Registering...
                  </span>
                ) : (
                  "Register"
                )}
              </button>
            </form>
          ) : (
            <div className="otp-section">
              <div className="otp-header">
                <div className="otp-icon">📱</div>
                <h3 className="otp-title">Verify Your Phone Number</h3>
                <p className="otp-subtitle">
                  We've sent a 6-digit code to<br />
                  <strong>{formatPhoneNumber(phoneNumber)}</strong>
                </p>
              </div>
              
              <form onSubmit={verifyOtp} className="otp-form">
                <div className="otp-inputs-container">
                  <div className="otp-inputs">
                    {enteredOtp.map((val, i) => (
                      <input 
                        key={i} 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength="1" 
                        value={val} 
                        onChange={(e) => handleOtpChange(e.target.value, i)}
                        onKeyDown={(e) => handleOtpKeyDown(e, i)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        id={`otp-input-${i}`} 
                        className={`otp-input ${otpError ? 'error' : ''} ${val ? 'filled' : ''}`}
                        autoComplete="off"
                      />
                    ))}
                  </div>
                  {otpError && (
                    <div className="otp-error">
                      <span className="error-icon">⚠️</span>
                      {otpError}
                    </div>
                  )}
                </div>
                
                <button 
                  type="submit" 
                  className="auth-button otp-verify-btn" 
                  disabled={loading || enteredOtp.join("").length !== 6}
                >
                  {loading ? (
                    <span className="button-loading">
                      <span className="spinner"></span>
                      Verifying...
                    </span>
                  ) : (
                    "Verify OTP"
                  )}
                </button>
              </form>
              
              <div className="otp-footer">
                <p className="otp-help-text">Didn't receive the code?</p>
                <button 
                  type="button"
                  onClick={resendOtp} 
                  disabled={otpCooldown > 0 || loading}
                  className="resend-button"
                >
                  {otpCooldown > 0 ? (
                    <span>
                      <span className="cooldown-icon">⏱️</span>
                      Resend in {otpCooldown}s
                    </span>
                  ) : (
                    <span>
                      <span className="resend-icon">📤</span>
                      Resend OTP
                    </span>
                  )}
                </button>
                
                {otpAttempts > 2 && (
                  <div className="otp-warning">
                    <span className="warning-icon">🚨</span>
                    Multiple failed attempts. Please check your phone number or contact support.
                  </div>
                )}
                
                <div className="otp-help-section">
                  <details className="otp-troubleshoot">
                    <summary>Not receiving OTP? Click here for help</summary>
                    <div className="troubleshoot-content">
                      <ul>
                        <li>Check if your phone has network coverage</li>
                        <li>Verify the phone number is correct</li>
                        <li>Check spam/blocked messages</li>
                        <li>Wait a few minutes and try resending</li>
                        <li>Contact support if issue persists</li>
                      </ul>
                    </div>
                  </details>
                </div>
              </div>
              
              <button 
                type="button" 
                onClick={toggleForm}
                className="back-to-login"
              >
                ← Back to Registration
              </button>
            </div>
          )}
          <p className="toggle-message">
            Already have an account? 
            <button onClick={toggleForm} className="toggle-button">Log in</button>
          </p>
        </>
      );
    }

    // Default login form
    return (
      <>
        <h2 className="auth-title-log">Log In</h2>
        <p className="auth-subtitle">Welcome back! Please sign in to your account</p>
        <GeneralError />
        
        <form className="auth-form-log" onSubmit={handleSubmit(handleLogin)}>
          <InputField 
            label="Email" 
            type="email" 
            id="loginEmail" 
            registerProps={register("email", { 
              required: "Email is required",
              validate: (value) => validateEmail(value).isValid || validateEmail(value).message
            })} 
            error={errors.email || (formErrors.email && { message: formErrors.email })}
            validationState={watchedEmail ? (validateEmail(watchedEmail).isValid ? 'valid' : 'invalid') : null}
            helpText="Enter the email address you registered with"
          />
          
          <InputField 
            label="Password" 
            type="password" 
            id="loginPassword" 
            showToggle 
            showPassword={showLoginPassword} 
            togglePassword={() => setShowLoginPassword(!showLoginPassword)} 
            registerProps={register("password", { required: "Password is required" })} 
            error={errors.password}
          />
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? (
              <span className="button-loading">
                <span className="spinner"></span>
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>
        
        <div className="auth-links">
          <button 
            type="button" 
            onClick={showForgotPasswordForm}
            className="forgot-password-link"
          >
            Forgot Password?
          </button>
        </div>
        
        <p className="toggle-message-log">
          Don't have an account? 
          <button onClick={toggleForm} className="toggle-button">Register</button>
        </p>
        
        <div className="login-help-section">
          <details className="login-troubleshoot">
            <summary>Having trouble logging in?</summary>
            <div className="troubleshoot-content">
              <ul>
                <li><strong>Forgot your password?</strong> Click "Forgot Password" above</li>
                <li><strong>Account not found?</strong> You may need to register first</li>
                <li><strong>Account restricted?</strong> Contact our support team</li>
                <li><strong>Email not recognized?</strong> Check for typos or try registering</li>
              </ul>
            </div>
          </details>
        </div>
      </>
    );
  };

  return (
    <div className="auth-container">
      <Seo
        title={showResetPassword ? "Reset Password" : showForgotPassword ? "Forgot Password" : isRegister ? "Register" : "Login"}
        description={showResetPassword ? "Reset your password" : showForgotPassword ? "Reset your password" : isRegister ? "Create your account" : "Log in to your account"}
        page={showResetPassword ? "Reset Password" : showForgotPassword ? "Forgot Password" : isRegister ? "Register" : "Login"}
        keywords="wealth, financial freedom, risk management, strategies"
      />
      <Header />
      <div className="main-login">
        <div className="illustration-section">
          <div className="illustration-copy">
            <h3 className="illustration-subtitle">{showResetPassword ? "" : showForgotPassword ? "" : isRegister ? "Sign Up to" : "Sign in to"}</h3>
            <h1 className="illustration-title">The Capital Tree</h1>
            {!showResetPassword && !showForgotPassword && (
              <p className="illustration-helper">
                {isRegister ? (
                  <>
                    If you don’t have an account register<br />You can <span className="illustration-link">Register here !</span>
                  </>
                ) : (
                  <>
                    If you don’t have an account register<br />You can <span className="illustration-link">Register here !</span>
                  </>
                )}
              </p>
            )}
          </div>
          <div className="illustration-image">
            <img src={authIllustration} alt="Illustration" />
          </div>
        </div>
        <div className="auth-card">
          <div className="logo-section1">
            <img src={logo1} alt="Logo" className="logo1-img" />
            <h1 className="brand-name">TheCapitalTree</h1>
          </div>

          {renderForm()}
        </div>
      </div>
      <Footer />
      <ToastContainer 
        position="top-right" 
        autoClose={5000}
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

export default LoginRegister;
