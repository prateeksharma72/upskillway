import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import axios from 'axios';
import MarketGuides from '../MarketGuides'; // The component to test

// --- Mocks ---
// Mock the entire axios library.
jest.mock('axios');
// FIX: Removed TypeScript syntax. This is now valid JavaScript.
const mockedAxios = axios;

// Mock child components to test the MarketGuides page in isolation.
jest.mock('../Sidebar', () => () => <div data-testid="sidebar" />);

// Define a reusable set of mock blogs for our tests.
const mockBlogs = [
  {
    _id: 'blog1',
    title: 'Expert Market Analysis 2024',
    author: 'Admin',
    content: '<p>This is the full content of the expert market analysis. It provides deep insights.</p>',
    imageUrl: 'http://example.com/analysis.jpg',
    createdAt: '2024-01-15T11:00:00.000Z',
    views: 250,
    likes: 45,
  },
  {
    _id: 'blog2',
    title: 'Top Investment Strategies',
    author: 'TheCapitalTree Team',
    content: '<p>Discover top strategies to maximize your investment returns this year.</p>',
    imageUrl: 'http://example.com/strategies.jpg',
    createdAt: '2024-01-14T09:30:00.000Z',
    views: 300,
    likes: 60,
  },
];

const renderMarketGuidesPage = () => {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <MarketGuides />
      </MemoryRouter>
    </HelmetProvider>
  );
};

describe('MarketGuides Component', () => {

  beforeEach(() => {
    // Because axios is mocked, mockedAxios.get is a jest.Mock instance.
    mockedAxios.get.mockClear();
  });

  test('shows a loading state initially', () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {})); // Never resolves
    renderMarketGuidesPage();
    
    expect(screen.getByText(/Loading articles.../i)).toBeInTheDocument();
  });

  test('fetches and displays a list of blogs on a successful API call', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockBlogs });
    renderMarketGuidesPage();

    // `findBy*` waits for the component to re-render after the API call.
    expect(await screen.findByText('Expert Market Analysis 2024')).toBeInTheDocument();
    expect(screen.getByText('Top Investment Strategies')).toBeInTheDocument();

    const firstAuthorDate = screen.getByText(/By Admin/i);
    expect(firstAuthorDate).toBeInTheDocument();
    const expectedDate = new Date(mockBlogs[0].createdAt).toLocaleDateString();
    expect(firstAuthorDate).toHaveTextContent(expectedDate);

    expect(screen.getByText(/This is the full content of the expert market analysis/)).toBeInTheDocument();
    expect(screen.getByText(/250 Views/i)).toBeInTheDocument();
    
    const readMoreLinks = screen.getAllByRole('link', { name: /Read More →/i });
    expect(readMoreLinks).toHaveLength(2);
  });

  test('displays an error message when the API call fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockedAxios.get.mockRejectedValueOnce(new Error('API is down'));
    renderMarketGuidesPage();

    expect(await screen.findByText(/Failed to load articles. API is down/i)).toBeInTheDocument();
    
    expect(screen.queryByText(/Loading articles.../i)).not.toBeInTheDocument();
    expect(screen.queryByText('Expert Market Analysis 2024')).not.toBeInTheDocument();
    
    consoleErrorSpy.mockRestore();
  });

  test('displays a message when no blogs are returned from the API', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    renderMarketGuidesPage();

    expect(await screen.findByText(/No articles found at the moment/i)).toBeInTheDocument();
  });

  test('renders the main page structure and Sidebar', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    renderMarketGuidesPage();

    expect(await screen.findByRole('heading', { level: 1, name: /Blog & Insights/i })).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });
});