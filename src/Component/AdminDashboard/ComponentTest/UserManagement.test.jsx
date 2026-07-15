import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import axios from 'axios';
import UserManagement from '../UserManagement'; // Adjust the import path as needed

// 1. MOCK DEPENDENCIES
jest.mock('axios');
// --- FIX IS HERE ---
// This line now works correctly because the file is named .tsx
const mockedAxios = axios;

// We need to mock useOutletContext as this component depends on it.
const mockNavigate = jest.fn();
const mockOnLogout = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useOutletContext: () => ({ onLogout: mockOnLogout }),
}));

// Mock localStorage to control authentication state in tests
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Helper to render the component within a router context
const renderComponent = () => {
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<UserManagement />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

// 2. TEST SUITE
describe('UserManagement Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  const mockUsers = [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', phone: '123-456-7890', role: 'user', isEmailVerified: true, isPhoneVerified: false, createdAt: '2023-10-01T10:00:00Z' },
    { id: 2, name: 'Bob Williams', email: 'bob@example.com', phone: '098-765-4321', role: 'user', isEmailVerified: false, isPhoneVerified: true, createdAt: '2023-09-15T12:30:00Z' },
    { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', phone: null, role: 'editor', isEmailVerified: true, isPhoneVerified: true, createdAt: '2023-08-20T14:00:00Z' },
  ];

  describe('Authentication and Authorization', () => {
    test('shows unauthorized message and calls onLogout if no auth token is present', () => {
      renderComponent();
      expect(screen.getByText(/Unauthorized/i)).toBeInTheDocument();
      expect(mockOnLogout).toHaveBeenCalledTimes(1);
    });

    test('shows unauthorized message and calls onLogout if user role is not admin', () => {
      localStorageMock.setItem('authToken', 'fake-user-token');
      localStorageMock.setItem('userRole', 'user');
      renderComponent();
      expect(screen.getByText(/Unauthorized/i)).toBeInTheDocument();
      expect(mockOnLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('API Data Fetching and Display', () => {
    beforeEach(() => {
      localStorageMock.setItem('authToken', 'fake-admin-token');
      localStorageMock.setItem('userRole', 'admin');
    });

    test('displays loading state initially', () => {
      mockedAxios.get.mockReturnValue(new Promise(() => {}));
      renderComponent();
      expect(screen.getByText(/Loading users.../i)).toBeInTheDocument();
    });

    test('fetches and displays user data successfully', async () => {
      mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } });
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText(/Loading users.../i)).not.toBeInTheDocument();
      });

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      const aliceRow = screen.getByText('Alice Johnson').closest('tr');
      expect(aliceRow).toHaveTextContent('Email ✓ | Phone ✗');
      expect(aliceRow).toHaveTextContent('Oct 1, 2023');
    });

    test('displays a message when no users are found', async () => {
      mockedAxios.get.mockResolvedValue({ data: { users: [] } });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/No users found/i)).toBeInTheDocument();
      });
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('API Error Handling', () => {
    beforeEach(() => {
      localStorageMock.setItem('authToken', 'fake-admin-token');
      localStorageMock.setItem('userRole', 'admin');
    });

    test('displays a generic error message on network failure', async () => {
      const errorMessage = 'Network Error';
      mockedAxios.get.mockRejectedValue(new Error(errorMessage));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch users/i)).toBeInTheDocument();
        expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument();
      });
    });

    test('displays a server error message and logs out on 401 Unauthorized', async () => {
      const serverMessage = 'Invalid or expired token';
      mockedAxios.get.mockRejectedValue({
        response: { status: 401, data: { message: serverMessage } }
      });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Your session may have expired/i)).toBeInTheDocument();
        expect(screen.getByText(new RegExp(serverMessage))).toBeInTheDocument();
      });
      expect(mockOnLogout).toHaveBeenCalledTimes(1);
    });
  });
});