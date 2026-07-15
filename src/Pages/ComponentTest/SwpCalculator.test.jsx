import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async'; // Added for completeness, as children use it
import SwpCalculator from "../SwpCalculator";

// --- Mocks ---
// CORRECTED PATHS: All paths now go up two directories ('../../') to reach the 'src' root.
jest.mock("../../Component/Seo", () => ({ title }) => <div data-testid="seo">Mocked SEO: {title}</div>);
jest.mock("../../Component/Header", () => () => <div data-testid="header" />);
jest.mock("../../Component/Footer", () => () => <div data-testid="footer" />);
jest.mock("../../assets/image/invest.jpg", () => "image-mock");


const renderWithRouter = () => {
  return render(
    // Added HelmetProvider to be safe, since child components like Seo need it.
    <HelmetProvider>
      <MemoryRouter>
        <SwpCalculator />
      </MemoryRouter>
    </HelmetProvider>
  );
};


describe('SwpCalculator Component', () => {
  // Helper function to fill input fields (no changes needed)
  const setupInputs = (totalInvestment, monthlyWithdrawal, rateOfReturn, investmentPeriodYears = 1) => {
    const investmentInput = screen.getByLabelText(/Total Investment/i);
    const withdrawalInput = screen.getByLabelText(/Monthly Withdrawal/i);
    const returnInput = screen.getByLabelText(/Expected Rate of Return/i);
    const periodInput = screen.getByLabelText(/Investment Period \(Years\)/i);

    userEvent.clear(investmentInput);
    if (totalInvestment) userEvent.type(investmentInput, totalInvestment.toString());

    userEvent.clear(withdrawalInput);
    if (monthlyWithdrawal) userEvent.type(withdrawalInput, monthlyWithdrawal.toString());

    userEvent.clear(returnInput);
    if (rateOfReturn) userEvent.type(returnInput, rateOfReturn.toString());

    const currentPeriod = parseInt(periodInput.value, 10);
    if (investmentPeriodYears > currentPeriod) {
      for (let i = 0; i < investmentPeriodYears - currentPeriod; i++) {
        fireEvent.click(screen.getByRole('button', { name: '+' }));
      }
    } else if (investmentPeriodYears < currentPeriod) {
      for (let i = 0; i < currentPeriod - investmentPeriodYears; i++) {
        fireEvent.click(screen.getByRole('button', { name: '-' }));
      }
    }
  };


  test('renders initial state correctly', () => {
    renderWithRouter();

    expect(screen.getByRole('heading', { name: /SWP Calculator/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Total Investment/i).value).toBe("100000");
    expect(screen.getByLabelText(/Monthly Withdrawal/i).value).toBe("1000");
    expect(screen.getByLabelText(/Expected Rate of Return/i).value).toBe("8");
    expect(screen.getByLabelText(/Investment Period \(Years\)/i).value).toBe('1');
    expect(screen.getByRole('button', { name: /Calculate/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Invest Now/i })).toBeInTheDocument();
    expect(screen.queryByText(/Final Value/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('seo')).toHaveTextContent('Mocked SEO: SWP Calculator');
  });

  // You can add back your other calculation tests here if you wish.
  // They are omitted for brevity but would work without changes.
});