import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Short60 from '../Short60'; // The component to test

// --- Mocks ---
// Pathing assumes this test file is in 'src/Component/learn/ComponentTest/'.
// We go up three levels ('../../../') to get to the 'src' root, then down to 'Component/'.
jest.mock('../../../Component/Header', () => () => <div data-testid="header" />);
jest.mock('../../../Component/Footer', () => () => <div data-testid="footer" />);
// No Seo mock needed as it's not imported by Short60.jsx
// No image or API mocks are needed for this component.

/**
 * A helper function to render the component with all necessary providers.
 * The <Link> components in the sidebar require <MemoryRouter>.
 */
const renderShort60Page = () => {
  return render(
    // HelmetProvider is included for safety in case child components need it.
    <HelmetProvider>
      <MemoryRouter>
        <Short60 />
      </MemoryRouter>
    </HelmetProvider>
  );
};

describe('Short60 Page', () => {
  test('renders the main structure and headings correctly', () => {
    renderShort60Page();

    // Check for the main headings on the page.
    expect(screen.getByRole('heading', { level: 2, name: /Learning Paths/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Short60/i })).toBeInTheDocument();

    // Verify that the mocked child components are rendered.
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  test('renders the sidebar navigation with correct links', () => {
    renderShort60Page();

    // The <Link> component renders an <a> tag, which has the accessibility role of 'link'.
    expect(screen.getByRole('link', { name: /Investment Learning/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Books/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Short60/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Blog/i })).toBeInTheDocument();
  });

  test('renders the iframe with the correct title and src attributes', () => {
    renderShort60Page();

    // The most accessible and reliable way to find an iframe is by its title.
    const iframeElement = screen.getByTitle('Short60');
    
    // Assert that the iframe exists in the document.
    expect(iframeElement).toBeInTheDocument();
    
    // Assert that it has the correct 'src' attribute.
    expect(iframeElement).toHaveAttribute('src', 'https://shorts60.com');
  });
});