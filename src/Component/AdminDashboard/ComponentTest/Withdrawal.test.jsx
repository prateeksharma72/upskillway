// --- MOCKS MUST BE AT THE VERY TOP OF THE FILE ---
// This is to ensure Jest hoists them before any other code is executed.

const mockToast = Object.assign(
  jest.fn(),
  { success: jest.fn(), error: jest.fn() }
);

const mockAxiosGet = jest.fn();
const mockAxiosPost = jest.fn();

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: mockAxiosGet,
    post: mockAxiosPost,
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  })),
}));

// Mock react-toastify to intercept calls to `toast()`
jest.mock('react-toastify', () => ({
  ...jest.requireActual('react-toastify'),
  toast: mockToast,
  ToastContainer: () => <div data-testid="toast-container" />, // Mock the container
}));

// =========================================================================
//  IMPORTS (using require due to Jest hoisting behavior with mocks)
// =========================================================================
const React = require('react');
const { render, screen, waitFor, fireEvent, act } = require('@testing-library/react');
const userEvent = require('@testing-library/user-event').default;
require('@testing-library/jest-dom');

const Withdrawal = require('../Withdrawal').default;

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

const mockWithdrawals = [
  { id: 1, amount: 5000, status: 'pending', createdAt: '2023-10-27T10:00:00Z', User: { name: 'John Doe', email: 'john.doe@example.com' } },
  { id: 2, amount: 150000, status: 'approved', createdAt: '2023-10-26T11:30:00Z', User: { name: 'Jane Smith', email: 'jane.smith@example.com' } },
  { id: 3, amount: 750.50, status: 'pending', createdAt: '2023-10-25T09:00:00Z', User: { name: 'Peter Jones', email: 'peter.jones@example.com' } },
];

const renderComponent = () => render(<Withdrawal />);

describe('Withdrawal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.setItem('authToken', 'fake-token');
  });

  test('should fetch and display withdrawals successfully', async () => {
    mockAxiosGet.mockResolvedValue({ data: mockWithdrawals });
    renderComponent();
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Peter Jones')).toBeInTheDocument();
  });


  describe('User Actions', () => {
    // --- FIX: This helper now correctly simulates a user clicking the confirm button ---
    const confirmAction = async () => {
      // 1. Check if the toast function was called.
      if (mockToast.mock.calls.length === 0) {
        throw new Error('The toast confirmation was never triggered.');
      }
      
      // 2. Get the React component that was passed to the toast.
      const lastToastCall = mockToast.mock.calls[mockToast.mock.calls.length - 1];
      const confirmationComponentElement = lastToastCall[0];

      // 3. Render this component in isolation to find and click the button.
      const { getByRole, unmount } = render(confirmationComponentElement);
      const confirmButton = getByRole('button', { name: /confirm/i });

      // 4. Simulate the click, wrapped in act() as it triggers state updates.
      await act(async () => {
        await userEvent.click(confirmButton);
      });

      // 5. Clean up the temporary render.
      unmount();
    };

    test('should approve a withdrawal successfully', async () => {
      mockAxiosGet.mockResolvedValue({ data: mockWithdrawals });
      mockAxiosPost.mockResolvedValue({
        data: { withdrawal: { ...mockWithdrawals[0], status: 'approved' } }
      });

      renderComponent();
      // Find the specific button for John Doe's pending request
      const row = (await screen.findByText('John Doe')).closest('tr');
      const approveButton = screen.getByRole('button', { name: /approve/i });
      
      await userEvent.click(approveButton);
      
      await confirmAction();

      expect(mockAxiosPost).toHaveBeenCalledWith('/api/withdrawals/1/approve', expect.any(Object));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('approved successfully'));
      });
      
      await waitFor(() => {
        expect(row).toHaveTextContent('approved');
      });
    });

    test('should reject a withdrawal successfully', async () => {
      mockAxiosGet.mockResolvedValue({ data: mockWithdrawals });
      mockAxiosPost.mockResolvedValue({
        data: { withdrawal: { ...mockWithdrawals[0], status: 'rejected' } }
      });

      renderComponent();
      const row = (await screen.findByText('John Doe')).closest('tr');
      const rejectButton = screen.getByRole('button', { name: /reject/i });
      
      await userEvent.click(rejectButton);
      
      await confirmAction();

      expect(mockAxiosPost).toHaveBeenCalledWith('/api/withdrawals/1/reject', expect.any(Object));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('rejected successfully'));
      });

      await waitFor(() => {
        expect(row).toHaveTextContent('rejected');
      });
    });

    test('should handle API error when trying to approve', async () => {
      mockAxiosGet.mockResolvedValue({ data: mockWithdrawals });
      const errorMessage = 'Insufficient funds in master account';
      const error = { response: { data: { message: errorMessage } } };
      mockAxiosPost.mockRejectedValue(error);

      renderComponent();
      const approveButton = (await screen.findAllByRole('button', { name: /approve/i }))[0];

      await userEvent.click(approveButton);
      
      // This helper now works correctly
      await confirmAction();
      
      // Wait for the error toast to be called with the correct message
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          expect.objectContaining({
            props: expect.objectContaining({
              children: expect.arrayContaining([
                expect.objectContaining({
                  props: expect.objectContaining({
                    children: expect.stringContaining('Failed to approve')
                  })
                }),
                expect.objectContaining({
                  props: expect.objectContaining({
                    children: expect.stringContaining(errorMessage)
                  })
                })
              ])
            })
          })
        );
      });
      
      // Ensure the UI did NOT change and remains pending
      const row = screen.getByText('John Doe').closest('tr');
      expect(row).toHaveTextContent('pending');
    });
  });
});