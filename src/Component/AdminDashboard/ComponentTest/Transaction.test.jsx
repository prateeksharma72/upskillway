// --- MOCKS MUST BE AT THE VERY TOP OF THE FILE ---
const mockAxiosGet = jest.fn();

// FIX: This mock is now more realistic. It provides the .create() method
// that the component's apiClient expects, allowing the component to initialize
// without crashing and letting us control the `get` method's responses.
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: mockAxiosGet,
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  })),
}));

// Mock child components for isolation
jest.mock('../SidebarAdmin', () => () => <div data-testid="sidebar-admin" />);

// =========================================================================
//  IMPORTS
// =========================================================================
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AdminTransactionPage from '../transcation'; 
import { MemoryRouter } from 'react-router-dom';

// =========================================================================
//  TEST SETUP
// =========================================================================

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockDailyTransactions = [
  { id: 1, type: 'deposit', amount: 100, createdAt: new Date().toISOString(), plan: { name: 'Starter Plan' } },
];
const mockAllTransactions = [
    ...mockDailyTransactions,
  { id: 2, type: 'investment', amount: 500, createdAt: new Date().toISOString(), plan: { name: 'Mega Plan' } },
];

const renderComponent = () => {
  return render(
    <MemoryRouter>
      <AdminTransactionPage />
    </MemoryRouter>
  );
};

describe('AdminTransactionPage Component', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    test('shows an authentication error if no token is found', async () => {
        localStorage.clear(); // Ensure no token exists
        // Mock the API to return an auth error
        mockAxiosGet.mockRejectedValue({ response: { status: 401, data: { message: 'Authentication required' } } });
        
        renderComponent();
        
        // The component should catch the 401 error and display the message
        expect(await screen.findByText(/Authentication failed/i)).toBeInTheDocument();
    });
  });

  describe('With Authentication', () => {
    beforeEach(() => {
        // Set the token before each test in this block
        localStorage.setItem('authToken', 'fake-admin-token');
    });

    test('renders tabs and fetches initial data successfully', async () => {
        // The component first fetches 'daily' data on load
        mockAxiosGet.mockResolvedValueOnce({ data: mockDailyTransactions });

        renderComponent();

        // Check for the initial data from the "daily" fetch
        expect(await screen.findByText('Starter Plan')).toBeInTheDocument();
        // Check that the daily tab is active
        expect(screen.getByRole('button', { name: /Daily/i })).toHaveClass('active');

        // Now, simulate a user clicking a different tab
        const allTab = screen.getByRole('button', { name: /All Transactions/i });

        // Mock the *next* API call that will happen when the "All" tab is clicked
        mockAxiosGet.mockResolvedValueOnce({ data: mockAllTransactions });

        await user.click(allTab);

        // Check for the new data from the "all" fetch
        expect(await screen.findByText('Mega Plan')).toBeInTheDocument();
        // The previously loaded data should still be visible
        expect(screen.getByText('Starter Plan')).toBeInTheDocument();
        // Check that the active tab has changed
        expect(allTab).toHaveClass('active');
        expect(screen.getByRole('button', { name: /Daily/i })).not.toHaveClass('active');
    });

    test('handles API configuration error', async () => {
        const errorMessage = 'API endpoint not configured. Please contact support.';
        // Simulate a complete failure of the axios instance
        mockAxiosGet.mockRejectedValue(new Error(errorMessage));

        renderComponent();

        expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('TransactionTable Component', () => {
    beforeEach(() => {
        localStorage.setItem('authToken', 'fake-admin-token');
    });

    test('handles invalid date strings gracefully', async () => {
        const transactionsWithBadDate = [
            { id: 1, type: 'deposit', amount: 100, createdAt: 'not-a-real-date', plan: { name: 'Bad Date Plan' } }
        ];
        mockAxiosGet.mockResolvedValue({ data: transactionsWithBadDate });

        renderComponent();

        expect(await screen.findByText('Bad Date Plan')).toBeInTheDocument();
        // The component should render a fallback text instead of crashing
        expect(screen.getByText('Invalid Date')).toBeInTheDocument();
    });
  });
});