import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import AdminOverview from '../AdminOverview'; // Adjust import path if needed

// 1. MOCK DEPENDENCIES
// We need to mock useOutletContext to provide data to the component
const mockUseOutletContext = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // Keep original router behavior
  useOutletContext: () => mockUseOutletContext(), // Return our mock function's result
}));

// Helper to render the component within a router context
const renderComponent = () => {
  return render(
    <MemoryRouter>
      <AdminOverview />
    </MemoryRouter>
  );
};

// 2. TEST SUITE
describe('AdminOverview Component', () => {
  
  beforeEach(() => {
    // Clear the mock implementation before each test
    mockUseOutletContext.mockClear();
  });

  describe('Rendering Based on Context Data', () => {
    test('displays loading state when activatedInvestment data is null', () => {
      // Arrange: Mock the context to return null for the data object
      mockUseOutletContext.mockReturnValue({
        userData: { name: 'Admin' },
        onLogout: jest.fn(),
        activatedInvestment: null, // This triggers the loading state
      });
      
      renderComponent();

      // Assert: Check for loading text within the card
      const card = screen.getByRole('heading', { name: /Activated Investment/i }).closest('.card');
      expect(card).toHaveClass('loading');
      expect(screen.getByText(/Loading data.../i)).toBeInTheDocument();
      
      // The other card should render normally
      expect(screen.getByText(/System Online/i)).toBeInTheDocument();
    });

    test('displays all data correctly when context provides full data', () => {
      // Arrange: Mock the context with a full, successful data payload
      const mockInvestmentData = {
        totalInvestment: 125500.75,
        weeklyChange: 1200.50,
        dailyProfit: 350.25,
        activePlanCount: 15,
        planGrowth: 5,
        serverUptime: '99.98%',
        error: false,
      };
      mockUseOutletContext.mockReturnValue({
        onLogout: jest.fn(),
        activatedInvestment: mockInvestmentData,
      });

      renderComponent();

      // Assert: Check for all formatted data points
      expect(screen.getByRole('heading', { name: /\$125,500.75/ })).toBeInTheDocument();
      expect(screen.getByText(/\$1,200.50 since last week/i)).toBeInTheDocument();
      expect(screen.getByText(/Profit today: \$350.25/i)).toBeInTheDocument();
      expect(screen.getByText(/15 \+5% ↑/)).toBeInTheDocument();
      expect(screen.getByText(/Uptime: 99.98%/i)).toBeInTheDocument();
    });

    test('displays an error message when the context data has an error flag', () => {
      // Arrange: Mock the context with an error state
      mockUseOutletContext.mockReturnValue({
        onLogout: jest.fn(),
        activatedInvestment: { error: true },
      });

      renderComponent();

      // Assert: The specific error message should be visible
      expect(screen.getByText(/Could not load investment data/i)).toBeInTheDocument();
      // Ensure no financial data is rendered
      expect(screen.queryByRole('heading', { name: /\$/ })).not.toBeInTheDocument();
    });

    test('renders gracefully when optional data fields are missing', () => {
      // Arrange: Mock data with only the required fields
      const mockPartialData = {
        totalInvestment: 50000,
        error: false,
        // weeklyChange, dailyProfit, etc. are missing
      };
      mockUseOutletContext.mockReturnValue({
        onLogout: jest.fn(),
        activatedInvestment: mockPartialData,
      });

      renderComponent();

      // Assert: The required data is there, and the component does not crash
      expect(screen.getByRole('heading', { name: /\$50,000.00/ })).toBeInTheDocument();
      // Assert: The optional fields are not rendered
      expect(screen.queryByText(/since last week/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Profit today/i)).not.toBeInTheDocument();
    });
  });

  describe('User Actions', () => {
    test('calls the onLogout function from context when the logout button is clicked', () => {
      // Arrange: Provide a mock function to the context
      const mockLogoutFn = jest.fn();
      mockUseOutletContext.mockReturnValue({
        onLogout: mockLogoutFn,
        activatedInvestment: { totalInvestment: 100 },
      });

      renderComponent();
      
      const logoutButton = screen.getByRole('button', { name: /Log Out/i });
      
      // Act
      fireEvent.click(logoutButton);

      // Assert
      expect(mockLogoutFn).toHaveBeenCalledTimes(1);
    });
  });
});