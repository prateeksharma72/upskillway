import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Learn from '../Learn'; // The component being tested

// --- Mocks ---
// These paths are correct assuming your test file is in 'src/Pages/ComponentTest/'
jest.mock('../../Component/Header', () => () => <div data-testid="header" />);
jest.mock('../../Component/Footer', () => () => <div data-testid="footer" />);
jest.mock('../../Component/Seo', () => () => <div data-testid="seo" />);


/**
 * A helper function to render the component with all necessary providers.
 */
const renderLearnPage = () => {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <Learn />
      </MemoryRouter>
    </HelmetProvider>
  );
};

describe('Learn Page', () => {
  test('renders main headings and structural components', () => {
    renderLearnPage();

    expect(screen.getByRole('heading', { level: 1, name: /Empower Yourself with Investment Knowledge/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Learning Paths/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /What You’ll Learn/i })).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('seo')).toBeInTheDocument();
  });

  test('renders the sidebar navigation with correct links', () => {
    renderLearnPage();

    expect(screen.getByRole('link', { name: /Investment Learning/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Books/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Short60/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Blog/i })).toBeInTheDocument();
  });

  test('displays all four "What You’ll Learn" cards', () => {
    renderLearnPage();

    // CORRECTED QUERIES: We add the colon (:) to the end of each heading name.
    // This makes the query specific enough to find only the card headings and avoid the error.
    expect(screen.getByRole('heading', { level: 3, name: /Investment Basics:/i })).toBeInTheDocument();
    expect(screen.getByText(/Insights into emerging investment opportunities/i)).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 3, name: /Market Trends & Analysis:/i })).toBeInTheDocument();
    expect(screen.getByText(/Smart strategies to secure and grow your financial future/i)).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 3, name: /Risk Management:/i })).toBeInTheDocument();
    expect(screen.getByText(/Strategies to minimize risks and maximize returns/i)).toBeInTheDocument();
    
    expect(screen.getByRole('heading', { level: 3, name: /Wealth Growth Strategies:/i })).toBeInTheDocument();
    expect(screen.getByText(/How to create sustainable long-term wealth/i)).toBeInTheDocument();
  });

  test('renders the final paragraph in the main content', () => {
    renderLearnPage();
    
    expect(screen.getByText(/Stay ahead with our expert insights/i)).toBeInTheDocument();
  });
});