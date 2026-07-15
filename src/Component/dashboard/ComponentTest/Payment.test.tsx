// src/Component/dashboard/ComponentTest/Payment.test.tsx

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import Payment from '../Payment';

// MOCK DEPENDENCIES
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock child components
jest.mock('../Sidebar', () => () => <div data-testid="sidebar">Mocked Sidebar</div>);

// Wrapper to provide router context with navigation state
const renderComponent = (routeState: any) => {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/dashboard/payment', state: routeState }]}>
      <Routes>
        <Route path="/dashboard/payment" element={<Payment />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('Payment Component', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Manual Payment Flow', () => {
    test('renders manual payment form correctly and allows input', async () => {
      // Because we fixed the component, getByLabelText now works for all fields
      renderComponent({ isManualPayment: true, purchaseDetails: null });
      
      const amountInput = screen.getByLabelText(/amount/i);
      expect(amountInput).toBeEnabled();
      await user.type(amountInput, '250');
      expect(amountInput).toHaveValue(250);

      const cardHolderInput = screen.getByLabelText(/card holder name/i);
      await user.type(cardHolderInput, 'John Doe');
      expect(cardHolderInput).toHaveValue('John Doe');
    });

    test('submits manual payment successfully', async () => {
      renderComponent({ isManualPayment: true, purchaseDetails: null });

      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      await user.type(screen.getByLabelText(/amount/i), '150');
      await user.type(screen.getByLabelText(/card holder name/i), 'Jane Doe');
      await user.type(screen.getByLabelText(/card number/i), '1234567890123456');
      await user.type(screen.getByLabelText(/expiry date/i), '12/25');
      await user.type(screen.getByLabelText(/cvv/i), '123');
      
      await user.click(screen.getByRole('button', { name: /process payment/i }));

      // Assert that the success message appears
      expect(await screen.findByText('Payment processed successfully!')).toBeInTheDocument();
      
      // Assert that the API was called correctly
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/payment/process'),
          expect.objectContaining({
            amount: '150', // Note: input value is a string
            cardHolderName: 'Jane Doe',
            purchaseType: 'manual',
          }),
          expect.any(Object)
        );
      });
    });
  });

  describe('Stock Purchase Payment Flow', () => {
    const stockDetails = { symbol: 'AAPL', quantity: 10, price: 150, totalCost: 1500 };

    test('renders stock purchase details correctly', () => {
      renderComponent({ isManualPayment: false, purchaseDetails: stockDetails });

      expect(screen.getByText(stockDetails.symbol)).toBeInTheDocument();
      // Use querySelector for more specific checks if needed, but getByText is often sufficient
      expect(screen.getByText(`$${stockDetails.totalCost}`)).toBeInTheDocument();

      const amountInput = screen.getByLabelText(/amount/i);
      expect(amountInput).toHaveValue(stockDetails.totalCost);
      expect(amountInput).toBeDisabled();
    });

    test('submits stock purchase payment successfully', async () => {
        renderComponent({ isManualPayment: false, purchaseDetails: stockDetails });
  
        mockedAxios.post.mockResolvedValue({ data: { success: true } });
  
        await user.type(screen.getByLabelText(/card holder name/i), 'Stock Buyer');
        await user.type(screen.getByLabelText(/card number/i), '9876543210987654');
        await user.type(screen.getByLabelText(/expiry date/i), '11/26');
        await user.type(screen.getByLabelText(/cvv/i), '321');
        
        await user.click(screen.getByRole('button', { name: /process payment/i }));
  
        expect(await screen.findByText('Payment processed successfully!')).toBeInTheDocument();

        await waitFor(() => {
          expect(mockedAxios.post).toHaveBeenCalledWith(
            expect.stringContaining('/api/payment/process'),
            expect.objectContaining({
              amount: stockDetails.totalCost,
              purchaseType: 'stock_purchase',
              purchaseDetails: stockDetails,
            }),
            expect.any(Object)
          );
        });
    });

    test('shows an error message on failed payment submission', async () => {
        renderComponent({ isManualPayment: false, purchaseDetails: stockDetails });

        const errorMessage = 'Your card was declined.';
        mockedAxios.post.mockRejectedValue({ response: { data: { message: errorMessage } } });

        // These lines now work because of the component fix
        await user.type(screen.getByLabelText(/card holder name/i), 'Bad Card');
        await user.type(screen.getByLabelText(/card number/i), '1111222233334444');
        await user.type(screen.getByLabelText(/expiry date/i), '01/23');
        await user.type(screen.getByLabelText(/cvv/i), '111');

        await user.click(screen.getByRole('button', { name: /process payment/i }));

        // Wait for the error message to appear in the document
        expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    });
  });
});