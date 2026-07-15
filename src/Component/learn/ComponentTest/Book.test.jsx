import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
// CORRECTED: Go up two levels to find the Book.jsx component
import Book from '../Book';

// --- Mocks ---
// CORRECTED PATHS: Go up THREE directories ('../../../') to reach the 'src' root.
jest.mock('../../../Component/Header', () => () => <div data-testid="header" />);
jest.mock('../../../Component/Footer', () => () => <div data-testid="footer" />);

// CORRECTED PATHS for static image assets
jest.mock('../../../assets/image/business1.jpg', () => 'business1-mock');
jest.mock('../../../assets/image/business2.jpg', () => 'business2-mock');
jest.mock('../../../assets/image/business3.jpg', () => 'business3-mock');
jest.mock('../../../assets/image/business4.jpg', () => 'business4-mock');
jest.mock('../../../assets/image/business5.png', () => 'business5-mock');
jest.mock('../../../assets/image/business6.jpg', () => 'business6-mock');
jest.mock('../../../assets/image/business7.jpg', () => 'business7-mock');


const renderBookPage = () => {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <Book />
      </MemoryRouter>
    </HelmetProvider>
  );
};

describe('Book Page', () => {
  test('renders main structure and all headings', () => {
    renderBookPage();
    expect(screen.getByRole('heading', { level: 2, name: /Learning Paths/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Recommended Books/i })).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  test('renders the sidebar with correct navigation links', () => {
    renderBookPage();
    expect(screen.getByRole('link', { name: /Investment Learning/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Books/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Short60/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Blog/i })).toBeInTheDocument();
  });

  test('displays all book cards from the data array', () => {
    renderBookPage();
    const bookTitles = screen.getAllByRole('heading', { level: 3 });
    expect(bookTitles).toHaveLength(8);
    const bookImages = screen.getAllByRole('img');
    expect(bookImages).toHaveLength(8);
  });

  test('renders specific book titles and authors correctly', () => {
    renderBookPage();
    expect(screen.getByRole('heading', { name: /The Intelligent Investor/i })).toBeInTheDocument();
    expect(screen.getByText(/by Benjamin Graham/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /The Psychology of Money/i })).toBeInTheDocument();
    expect(screen.getByText(/by Morgan Housel/i)).toBeInTheDocument();
  });

  test('handles and renders duplicate book entries correctly', () => {
    renderBookPage();
    const duplicateTitles = screen.getAllByRole('heading', { name: /Small Business Big Money/i });
    expect(duplicateTitles).toHaveLength(3);
    const duplicateAuthors = screen.getAllByText(/by Akinola Alabi/i);
    expect(duplicateAuthors).toHaveLength(3);
  });
});