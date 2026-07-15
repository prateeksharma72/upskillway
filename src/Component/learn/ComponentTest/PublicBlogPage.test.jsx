import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import axios from 'axios';
import PublicBlogPage from '../Blog'; // Your corrected import path

// --- Mocks ---
jest.mock('axios', () => ({
  get: jest.fn(),
}));

jest.mock('../../../Component/Header', () => () => <div data-testid="header" />);
jest.mock('../../../Component/Footer', () => () => <div data-testid="footer" />);
jest.mock('../../../Component/Seo', () => () => <div data-testid="seo" />);

const mockBlogs = [
  {
    _id: '1',
    title: 'First Amazing Blog Post',
    author: 'John Doe',
    content: '<p>This is the full content of the first blog post.</p>',
    imageUrl: 'http://example.com/image1.jpg',
    createdAt: '2023-10-27T10:00:00.000Z',
    views: 150,
    likes: 25,
  },
];

const renderBlogPage = () => {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <PublicBlogPage />
      </MemoryRouter>
    </HelmetProvider>
  );
};

describe('PublicBlogPage Component', () => {

  beforeEach(() => {
    axios.get.mockClear();
  });

  // VVV THIS IS THE CORRECTED TEST VVV
  test('shows a loading state on initial render', async () => {
    axios.get.mockResolvedValue({ data: [] });
    renderBlogPage();
    
    // The loading text appears immediately, so we can check for it.
    expect(screen.getByText(/Loading articles.../i)).toBeInTheDocument();

    // IMPORTANT: We must now wait for the component to finish its async work
    // before the test ends. This prevents the "act" warning.
    await screen.findByText(/No articles found at the moment/i);
  });
  // ^^^ END OF CORRECTED TEST ^^^

  test('fetches and displays a list of blogs on successful API call', async () => {
    axios.get.mockResolvedValueOnce({ data: mockBlogs });
    renderBlogPage();

    expect(await screen.findByText('First Amazing Blog Post')).toBeInTheDocument();
    
    const authorDateElement = screen.getByText(/By John Doe/i);
    expect(authorDateElement).toHaveTextContent(/on/i);

    expect(screen.getByText(/150 Views/i)).toBeInTheDocument();
  });

  test('displays an error message when the API call fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(new Error('Network error'));
    renderBlogPage();
    expect(await screen.findByText(/Failed to load articles/i)).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  test('displays a message when no blogs are returned from the API', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    renderBlogPage();
    expect(await screen.findByText(/No articles found at the moment/i)).toBeInTheDocument();
  });

  test('renders the sidebar navigation with correct links', async () => {
    axios.get.mockResolvedValue({ data: [] });
    renderBlogPage();
    await screen.findByText(/No articles found at the moment/i);

    expect(screen.getByRole('link', { name: /Investment Learning/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Books/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Short60/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Blog/i })).toBeInTheDocument();
  });
});