// src/Component/AdminDashboard/ComponentTest/ManageBlog.test.jsx

// --- STEP 1: Mocks at the top. This is the main fix. ---
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockDelete = jest.fn();

// Mock the axios module, defining its structure inline to avoid the initialization error.
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete, // Added for completeness, though not used in your component
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  })),
}));

// Mock child components to isolate the component under test.
jest.mock('../AdminSidebar', () => () => <div data-testid="sidebar-admin" />);

// --- STEP 2: All imports come after the mocks ---
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ManageBlog from '../ManageBlog'; // The component we are actually testing

// --- STEP 3: Test Setup ---
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockBlogs = [
  { _id: '1', title: 'First Blog Post', author: 'Admin', content: 'Content 1' },
  { _id: '2', title: 'Second Blog Post', author: 'Author', content: 'Content 2' },
];

const renderComponent = () => render(<ManageBlog />);

// --- STEP 4: The Test Suite ---
describe('ManageBlog Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    localStorage.setItem('authToken', 'fake-admin-token');
    jest.clearAllMocks();
  });

  describe('Initial Load', () => {
    test('displays loading state and then renders blogs', async () => {
      mockGet.mockResolvedValue({ data: mockBlogs });
      renderComponent();

      expect(screen.getByText(/Loading blogs/i)).toBeInTheDocument();

      expect(await screen.findByText('First Blog Post')).toBeInTheDocument();
      expect(screen.getByText('Second Blog Post')).toBeInTheDocument();

      expect(mockGet).toHaveBeenCalledWith('/blogs');
    });

    test('displays an error message if fetching fails', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));
      renderComponent();
      expect(await screen.findByText(/Failed to load blog data. Network Error/i)).toBeInTheDocument();
    });

    test('displays a message when no blogs are found', async () => {
        mockGet.mockResolvedValue({ data: [] });
        renderComponent();
        expect(await screen.findByText(/No blogs found. Add one!/i)).toBeInTheDocument();
    });
  });

  describe('Add New Blog', () => {
    test('opens a modal, allows adding a new blog, and refreshes the list', async () => {
      // Start with an empty list
      mockGet.mockResolvedValueOnce({ data: [] });
      renderComponent();
      expect(await screen.findByText(/No blogs found. Add one!/i)).toBeInTheDocument();

      // Click "Add New"
      await user.click(screen.getByRole('button', { name: /Add New/i }));
      const modal = await screen.findByRole('heading', { name: /Add New Blog Post/i });
      expect(modal).toBeInTheDocument();

      // Fill out the form
      await user.type(screen.getByLabelText(/Title/i), 'My New Test Blog');
      await user.type(screen.getByLabelText(/Content/i), 'This is the content.');

      // Mock the POST request for adding and the subsequent GET request for refreshing
      mockPost.mockResolvedValueOnce({ data: { success: true } });
      mockGet.mockResolvedValueOnce({ data: [{ _id: '3', title: 'My New Test Blog', author: 'Admin', content: 'This is the content.' }] });

      // Submit the form
      await user.click(screen.getByRole('button', { name: 'Add Blog' }));
      
      // Assert API calls
      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/blogs', {
          title: 'My New Test Blog',
          content: 'This is the content.',
          author: 'Admin',
          imageUrl: '',
        });
      });
      await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2)); // Initial fetch + refresh

      // Assert modal closes and new blog appears
      expect(await screen.findByText('My New Test Blog')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /Add New Blog Post/i })).not.toBeInTheDocument();
    });
  });

  describe('Edit Blog', () => {
    test('opens the edit modal with correct data and updates a blog', async () => {
        mockGet.mockResolvedValue({ data: mockBlogs });
        renderComponent();

        // Wait for blogs to load and find the "Edit" button for the first blog
        const editButtons = await screen.findAllByRole('button', { name: /Edit/i });
        await user.click(editButtons[0]);

        // Modal should open with pre-filled data
        const titleInput = await screen.findByLabelText(/Title/i);
        expect(titleInput).toHaveValue('First Blog Post');
        expect(screen.getByLabelText(/Author/i)).toHaveValue('Admin');

        // Change the title
        await user.clear(titleInput);
        await user.type(titleInput, 'First Blog Post - Updated');

        // Mock the PUT for update and GET for refresh
        mockPut.mockResolvedValueOnce({ data: { success: true } });
        const updatedBlogs = [{ ...mockBlogs[0], title: 'First Blog Post - Updated' }, mockBlogs[1]];
        mockGet.mockResolvedValueOnce({ data: updatedBlogs });

        // Submit the update
        await user.click(screen.getByRole('button', { name: /Update Blog/i }));

        await waitFor(() => {
            expect(mockPut).toHaveBeenCalledWith('/blogs/1', expect.objectContaining({
                title: 'First Blog Post - Updated'
            }));
        });

        // Assert that the list has been updated
        expect(await screen.findByText('First Blog Post - Updated')).toBeInTheDocument();
    });
  });
});