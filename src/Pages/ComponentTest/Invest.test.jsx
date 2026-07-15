import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Invest from '../Invest'; // Correct path to the component being tested

// --- Mocks ---
// CORRECTED PATHS: All paths now go up two directories ('../../') to reach the 'src' root.
jest.mock('../../Component/Header', () => () => <div data-testid="header" />);
jest.mock('../../Component/Footer', () => () => <div data-testid="footer" />);
jest.mock('../../Component/Seo', () => () => <div data-testid="seo" />);

// CORRECTED PATHS for static assets
jest.mock('../../assets/image/invest1.jpg', () => 'philosophy-img-mock');
jest.mock('../../assets/image/timeline.png', () => 'timeline-img-mock');


/**
 * A helper function to render the component with all necessary providers.
 */
const renderInvestPage = () => {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <Invest />
      </MemoryRouter>
    </HelmetProvider>
  );
};

describe('Invest Page', () => {
  // Use fake timers to control the setTimeout in the component's useEffect
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders all main headings and structural components', () => {
    renderInvestPage();

    expect(screen.getByRole('heading', { level: 1, name: /Grow Your Wealth/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Investment Philosophy/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Key Benefits/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Our Investment Process/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Performance Highlights/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Take the next step/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Regulatory and Compliance Notes/i })).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('seo')).toBeInTheDocument();
  });

  test('renders all key benefit cards', () => {
    renderInvestPage();

    expect(screen.getByRole('heading', { level: 3, name: /Consistent Returns/i })).toBeInTheDocument();
    expect(screen.getByText(/Targeting 3-5% monthly gains/i)).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 3, name: /Expert Management/i })).toBeInTheDocument();
    expect(screen.getByText(/Professionally curated portfolios/i)).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 3, name: /Flexible Investment Options/i })).toBeInTheDocument();
    expect(screen.getByText(/Tailored plans for different financial goals/i)).toBeInTheDocument();
    
    expect(screen.getByRole('heading', { level: 3, name: /Transparency & Security/i })).toBeInTheDocument();
    expect(screen.getByText(/Regular performance reports/i)).toBeInTheDocument();
  });

  test('renders call-to-action section with correct links', () => {
    renderInvestPage();

    expect(screen.getByRole('link', { name: /Get Started/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Schedule a Free Consultation/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Learn More About Our Funds/i })).toBeInTheDocument();
  });

  test('renders images with correct alt text', () => {
    renderInvestPage();

    expect(screen.getByAltText(/Investment philosophy at The Capital Tree/i)).toBeInTheDocument();
    expect(screen.getByAltText(/timeline/i)).toBeInTheDocument();
  });

  test('asynchronously displays performance highlights list items', () => {
    renderInvestPage();
    
    act(() => {
      jest.runAllTimers();
    });

    expect(screen.getByText(/Average annual returns exceeding 36%/i)).toBeInTheDocument();
    expect(screen.getByText(/Strong risk-adjusted returns/i)).toBeInTheDocument();
    expect(screen.getByText(/Proven track record of consistent monthly payouts/i)).toBeInTheDocument();
    expect(screen.getByText(/Optimized risk management/i)).toBeInTheDocument();
    expect(screen.getByText(/Maximizing returns while maintaining a balanced risk profile/i)).toBeInTheDocument();
    expect(screen.getByText(/Strategic investment approaches/i)).toBeInTheDocument();
    expect(screen.getByText(/Adaptive market strategies/i)).toBeInTheDocument();
  });
});