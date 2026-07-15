import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoginRegister from '../Login';

// Mocks
jest.mock('axios');
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
  ToastContainer: () => <div data-testid="toast-container" />,
}));
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));
jest.mock('../../Component/Header', () => () => <div data-testid="header" />);
jest.mock('../../Component/Footer', () => () => <div data-testid="footer" />);
jest.mock('../../Component/Seo', () => () => <div data-testid="seo" />);
jest.mock('../../assets/image/logo1.png', () => 'logo1-mock');
jest.mock('../../assets/image/logo6.png', () => 'logo6-mock');
jest.mock('../../assets/image/Login_no_bg_v2.gif', () => 'login-animation-mock');

// Mock a valid JWT token for the successful login test
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const renderComponent = (props = {}) => {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <LoginRegister {...props} />
      </MemoryRouter>
    </HelmetProvider>
  );
};

describe('LoginRegister Component', () => {
  beforeEach(() => {
    // Clear all mocks and localStorage before each test to prevent state leakage
    axios.post.mockClear();
    mockNavigate.mockClear();
    toast.success.mockClear();
    toast.error.mockClear();
    localStorage.clear(); // <-- FIX #1: This prevents the failed login test from navigating
  });

  test('renders login form by default', () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: /Log In/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  test('toggles between login and register forms', async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole('button', { name: /Register/i }));
    expect(screen.getByRole('heading', { name: /Register/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Log in/i }));
    expect(screen.getByRole('heading', { name: /Log In/i })).toBeInTheDocument();
  });

  describe('Login Flow', () => {
    test('successfully logs in a user and navigates', async () => {
      const user = userEvent.setup();
      const onLoginSuccess = jest.fn();
      axios.post.mockResolvedValueOnce({ data: { token: mockToken } });
      renderComponent({ onLoginSuccess });

      await user.type(screen.getByLabelText(/Email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/Password/i), 'Password123!');
      
      await user.click(screen.getByRole('button', { name: 'Login' }));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/api/users/login'), expect.any(Object));
        expect(toast.success).toHaveBeenCalledWith('Login Successful!');
        expect(onLoginSuccess).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('shows an error toast on failed login', async () => {
      const user = userEvent.setup();
      axios.post.mockRejectedValueOnce({
        response: { data: { message: 'Invalid credentials' } },
      });
      renderComponent();

      await user.type(screen.getByLabelText(/Email/i), 'wrong@example.com');
      await user.type(screen.getByLabelText(/Password/i), 'wrongpassword');

      await user.click(screen.getByRole('button', { name: 'Login' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
        // This assertion now passes because localStorage was cleared
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Registration Flow', () => {
    test('handles the full registration process successfully', async () => {
      const user = userEvent.setup();
      // Mock the sequence of API calls for registration
      axios.post
        .mockResolvedValueOnce({}) // 1. Initial registration
        .mockResolvedValueOnce({}) // 2. OTP verification
        
      renderComponent();

      // Go to register form
      await user.click(screen.getByRole('button', { name: /Register/i }));
      
      // Fill out the form
      await user.type(screen.getByLabelText(/Name/i), 'Test User');
      await user.type(screen.getByLabelText(/Email/i), 'register@example.com');
      await user.type(screen.getByLabelText(/Phone/i), '1234567890');
      await user.type(screen.getByLabelText(/^Password/i), 'Password123!'); // Use ^ to be specific
      await user.type(screen.getByLabelText(/Confirm Password/i), 'Password123!');
      
      // Submit registration
      await user.click(screen.getByRole('button', { name: /Register/i }));

      // --- FIX #2: Assert what is actually on the screen ---
      // Check for the OTP form title instead of the masked phone number text
      expect(await screen.findByRole('heading', { name: /Verify Your Phone Number/i })).toBeInTheDocument();
      expect(toast.success).toHaveBeenCalledWith('Registration successful! OTP sent to your phone.');
      
      // Enter the OTP
      const otpInputs = screen.getAllByRole('textbox').filter(input => input.id.startsWith('otp-input'));
      // A more robust way to enter OTP across multiple inputs
      await user.type(otpInputs[0], '1');
      await user.type(otpInputs[1], '2');
      await user.type(otpInputs[2], '3');
      await user.type(otpInputs[3], '4');
      await user.type(otpInputs[4], '5');
      await user.type(otpInputs[5], '6');

      // Submit OTP
      await user.click(screen.getByRole('button', { name: /Verify OTP/i }));

      // After successful verification, user should be back on the login page
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Phone number verified successfully! You can now login.');
        expect(screen.getByRole('heading', { name: /Log In/i })).toBeInTheDocument();
      });
    });
  });
});