import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Homepage from '../Homepage'; // Assumes Homepage.jsx is in src/Pages/

// --- Mocks ---
// CORRECTED PATHS: Go up two directories ('../../') to reach the 'src' root.
jest.mock('../../Component/Header', () => () => <div data-testid="header" />);
jest.mock('../../Component/Footer', () => () => <div data-testid="footer" />);
jest.mock("../../Component/Seo", () => () => <div data-testid="seo" />);
jest.mock('../../assets/image/home-img.jpg', () => 'test-image');


/**
 * Helper function to render the component with all necessary providers.
 */
const renderHomepage = () => {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    </HelmetProvider>
  );
};

describe('Homepage', () => {
  test('renders main content', () => {
    renderHomepage();
    expect(screen.getByText('"Cultivating Growth" One Investment at a Time')).toBeInTheDocument();
    expect(screen.getByText('Get Started Today')).toBeInTheDocument();
    expect(screen.getByText('Learn About Our Strategy')).toBeInTheDocument();
  });

  test('shows plans when Get Started button clicked', () => {
    renderHomepage();
    fireEvent.click(screen.getByText('Get Started Today'));
    expect(screen.getByText('Choose Your Plan')).toBeInTheDocument();
  });

  test('shows strategy when Learn Strategy button clicked', () => {
    renderHomepage();
    fireEvent.click(screen.getByText('Learn About Our Strategy'));
    expect(screen.getByText('Our Investment Strategy')).toBeInTheDocument();
  });

  test('only shows one section at a time', () => {
    renderHomepage();
    
    // Show plans
    fireEvent.click(screen.getByText('Get Started Today'));
    expect(screen.getByText('Choose Your Plan')).toBeInTheDocument();
    
    // Switch to strategy
    fireEvent.click(screen.getByText('Learn About Our Strategy'));
    expect(screen.queryByText('Choose Your Plan')).not.toBeInTheDocument();
    expect(screen.getByText('Our Investment Strategy')).toBeInTheDocument();
  });
});