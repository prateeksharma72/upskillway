import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import axios from 'axios';
import Support from '../Support';

// --- Mocks ---
jest.mock('axios', () => ({
  get: jest.fn(),
}));
const mockedAxios = axios;

// Mock child components
jest.mock('../../Component/Header', () => () => <div data-testid="header" />);
jest.mock('../../Component/Footer', () => () => <div data-testid="footer" />);
jest.mock('../../Component/Seo', () => () => <div data-testid="seo" />);

const mockFaqs = [
  { id: 1, question: "How do I reset my password?", answer: "You can reset your password by going to the login page and clicking on 'Forgot Password'." },
  { id: 2, question: "What are the support hours?", answer: "Our support team is available 24/7." },
];

const renderSupportPage = () => {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <Support />
      </MemoryRouter>
    </HelmetProvider>
  );
};

describe('Support Page', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    mockedAxios.get.mockClear();
  });

  test('renders static content and contact information correctly', () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    renderSupportPage();

    expect(screen.getByRole('heading', { name: /How can we help?/i })).toBeInTheDocument();
    // FIX: Corrected placeholder text to match the component.
    expect(screen.getByPlaceholderText(/Search questions.../i)).toBeInTheDocument();
    // Note: The search box has no button, so that assertion is removed.

    expect(screen.getByRole('link', { name: /Call Us/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Email Us/i })).toBeInTheDocument();
    expect(screen.getByTitle(/The Capital Tree Location/i)).toBeInTheDocument();
  });

  test('fetches and displays FAQs, with answers initially hidden', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockFaqs });
    renderSupportPage();

    // Wait for questions to appear
    const firstQuestion = await screen.findByText(mockFaqs[0].question);
    expect(firstQuestion).toBeInTheDocument();
    expect(screen.getByText(mockFaqs[1].question)).toBeInTheDocument();

    // FIX: Assert that the answer is in the document but NOT VISIBLE.
    // This requires your component's CSS to correctly hide the element.
    const firstAnswer = screen.getByText(mockFaqs[0].answer);
    expect(firstAnswer).toBeInTheDocument(); // It exists in the DOM
    expect(firstAnswer).not.toBeVisible();   // But it's hidden by CSS
  });

  test('toggles FAQ answer visibility on click', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockFaqs });
    renderSupportPage();

    const firstQuestionButton = await screen.findByRole('button', { name: mockFaqs[0].question });
    const firstAnswer = screen.getByText(mockFaqs[0].answer);

    // Initial state: answer is not visible
    expect(firstAnswer).not.toBeVisible();

    // First click: answer becomes visible
    await user.click(firstQuestionButton);
    await waitFor(() => {
      expect(firstAnswer).toBeVisible();
    });

    // Second click: answer becomes hidden again
    await user.click(firstQuestionButton);
    await waitFor(() => {
      // FIX: Check for visibility, not presence in the DOM.
      expect(firstAnswer).not.toBeVisible();
    });
  });

  test('filters FAQs based on search term', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockFaqs });
    renderSupportPage();

    // Wait for initial render
    expect(await screen.findByText(mockFaqs[0].question)).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Search questions.../i);

    // Search for a term that only matches the second FAQ
    await user.type(searchInput, 'support hours');
    
    // The first question should no longer be in the document
    expect(screen.queryByText(mockFaqs[0].question)).not.toBeInTheDocument();
    // The second question should still be there
    expect(screen.getByText(mockFaqs[1].question)).toBeInTheDocument();
  });
});