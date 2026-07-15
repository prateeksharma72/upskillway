import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import InvestmentTools from '../InvestmentTools';
import useFetchData from '../hooks/useFetchData';

// --- Mocks ---
jest.mock('../hooks/useFetchData');
jest.mock('../hooks/useChartZoom', () => () => ({
  brushDomain: { startIndex: null, endIndex: null },
  handleBrushUpdate: jest.fn(), handleWheelZoom: jest.fn(), resetZoom: jest.fn(), setBrushDomain: jest.fn(),
}));

// --- FIX IS HERE ---
// Use a more robust mocking pattern by defining and returning a mock component.
// This ensures React is correctly in scope when the JSX is evaluated.
jest.mock('../Sidebar', () => {
    const MockSidebar = () => <div data-testid="sidebar" />;
    return MockSidebar;
});

jest.mock('../shared/DataCard', () => {
    const MockDataCard = ({ title } = {}) => (
        <div data-testid="data-card">
            <h2>{title}</h2>
        </div>
    );
    return MockDataCard;
});

jest.mock('../shared/DataTable', () => {
    const MockDataTable = ({ title } = {}) => (
        <div data-testid="data-table">
            <h2>{title}</h2>
        </div>
    );
    return MockDataTable;
});

jest.mock('../shared/LoadingSpinner', () => {
    const MockLoadingSpinner = () => <div data-testid="loading-spinner" />;
    return MockLoadingSpinner;
});

jest.mock('../shared/ErrorMessage', () => {
    const MockErrorMessage = ({ message } = {}) => <div data-testid="error-message">{message}</div>;
    return MockErrorMessage;
});

jest.mock('../shared/InputForm', () => {
    const MockInputForm = ({ onSubmit, isLoading } = {}) => (
        <form data-testid="input-form" onSubmit={(e) => { e.preventDefault(); onSubmit({ symbol: 'TEST' }); }}>
            <button type="submit" disabled={isLoading}>Fetch Data</button>
        </form>
    );
    return MockInputForm;
});

jest.mock('../shared/ChartDisplay', () => {
    const MockChartDisplay = ({ chartBaseTitle } = {}) => <div data-testid="chart-display">{chartBaseTitle}</div>;
    return MockChartDisplay;
});

jest.mock('../shared/BuyStockModal', () => {
    const MockBuyStockModal = ({ isOpen } = {}) => (isOpen ? <div data-testid="buy-stock-modal" /> : null);
    return MockBuyStockModal;
});


// Helper for rendering
const renderComponent = () => {
    return render(
      <HelmetProvider>
        <MemoryRouter>
          <InvestmentTools />
        </MemoryRouter>
      </HelmetProvider>
    );
};

describe('InvestmentTools Component', () => {
  let localStorageMock;

  beforeEach(() => {
    localStorageMock = (() => {
      let store = {};
      return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        clear: () => { store = {}; },
      };
    })();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    useFetchData.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      makeRequest: jest.fn(),
      clear: jest.fn(),
    });
  });

  describe('Authentication Handling', () => {
    test('renders access denied message when not logged in', () => {
      renderComponent();
      expect(screen.getByRole('heading', { name: /Access Denied/i })).toBeInTheDocument();
      expect(screen.getByText(/You need to be logged in to use the Investment Tools/i)).toBeInTheDocument();
    });

    test('renders the main tool when logged in', () => {
      localStorageMock.setItem('authToken', 'fake-token');
      renderComponent();
      expect(screen.getByRole('heading', { name: /Investment Tool/i })).toBeInTheDocument();
    });
  });

  describe('User Interaction and API Calls', () => {
    beforeEach(() => {
      localStorageMock.setItem('authToken', 'fake-token');
    });

    test('renders the initial state with placeholder text', () => {
      renderComponent();
      expect(screen.getByText(/Select API and parameters to fetch data/i)).toBeInTheDocument();
    });

    test('calls makeRequest on form submission', async () => {
      const user = userEvent.setup();
      const mockMakeRequest = jest.fn();
      useFetchData.mockReturnValue({
        data: null, loading: false, error: null, makeRequest: mockMakeRequest, clear: jest.fn(),
      });
      
      renderComponent();
      
      const submitButton = screen.getByRole('button', { name: /Fetch Data/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMakeRequest).toHaveBeenCalledWith(expect.stringContaining('/api/market/quote/TEST'));
      });
    });
  });

  describe('Data Display', () => {
    beforeEach(() => {
      localStorageMock.setItem('authToken', 'fake-token');
    });

    test('renders DataCard for Global Quote data', () => {
      useFetchData.mockReturnValue({
        data: { symbol: 'AAPL', price: '150.00' },
        loading: false, error: null, makeRequest: jest.fn(), clear: jest.fn(),
      });
      renderComponent();
      expect(screen.getByTestId('data-card')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Global Quote for AAPL/i })).toBeInTheDocument();
    });

    test('renders Chart and Table for time series data', async () => {
      const user = userEvent.setup();
      useFetchData.mockReturnValue({
        data: { 
          metaData: { '2. Symbol': 'IBM' },
          data: [{ date: '2023-01-01', close: 130.00 }]
        },
        loading: false, error: null, makeRequest: jest.fn(), clear: jest.fn(),
      });
      renderComponent();
      
      await user.selectOptions(screen.getByRole('combobox'), 'daily');

      expect(await screen.findByTestId('chart-display')).toBeInTheDocument();
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });

    test('shows loading spinner when loading', () => {
      useFetchData.mockReturnValue({
        data: null, loading: true, error: null, makeRequest: jest.fn(), clear: jest.fn(),
      });
      renderComponent();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    test('shows error message on error', () => {
      useFetchData.mockReturnValue({
        data: null, loading: false, error: 'Failed to fetch', makeRequest: jest.fn(), clear: jest.fn(),
      });
      renderComponent();
      expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to fetch');
    });
  });
});