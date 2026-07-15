import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import About from '../About'; // Correct path to the component being tested

// --- Mocks ---
// CORRECTED PATHS: Go up two directories ('../../') to reach the 'src' root folder.
jest.mock('../../Component/Header', () => () => <div data-testid="header" />);
jest.mock('../../Component/Footer', () => () => <div data-testid="footer" />);
jest.mock('../../Component/Seo', () => () => <div data-testid="seo" />);

// CORRECTED PATHS: Also fix the paths for the image assets.
jest.mock('../../assets/image/About.png', () => 'about-img-mock');
jest.mock('../../assets/image/about2.png', () => 'about2-img-mock');
jest.mock('../../assets/image/About3.png', () => 'about3-img-mock');


const renderAboutPage = () => {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <About />
      </MemoryRouter>
    </HelmetProvider>
  );
};

describe('About Page', () => {
  test('renders main headings and structural components', () => {
    renderAboutPage();

    expect(screen.getByRole('heading', { level: 1, name: /About The Capital Tree/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Why Choose Us/i })).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('seo')).toBeInTheDocument();
  });

  test('displays all key descriptive paragraphs', () => {
    renderAboutPage();

    expect(screen.getByText(/blend innovative strategies with rigorous analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/next-generation investment platform dedicated to helping/i)).toBeInTheDocument();
    expect(screen.getByText(/Join us in/i)).toBeInTheDocument();
  });

  test('renders all four "Why Choose Us" feature cards', () => {
    renderAboutPage();

    expect(screen.getByText(/Proven track record with high monthly gains/i)).toBeInTheDocument();
    expect(screen.getByText(/Professional portfolio management/i)).toBeInTheDocument();
    expect(screen.getByText(/Secure & transparent investment platform/i)).toBeInTheDocument();
    expect(screen.getByText(/Personalized investment solutions for diverse financial goals/i)).toBeInTheDocument();
  });

  test('renders all images with their correct alt text', () => {
    renderAboutPage();

    expect(screen.getByAltText(/Trading Image/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Shutterstock Image/i)).toBeInTheDocument();
    expect(screen.getByAltText(/portfolio Image/i)).toBeInTheDocument();
  });
});