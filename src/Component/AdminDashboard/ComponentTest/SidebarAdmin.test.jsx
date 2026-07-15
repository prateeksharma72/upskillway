import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import SidebarAdmin from '../AdminSidebar'; // Adjust the import path if needed
import logo3 from '../../assets/image/logo3.png';

// 1. MOCK DEPENDENCIES
// Mock the navigate function to spy on its calls
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // Keep original NavLink, etc.
  useNavigate: () => mockNavigate,
}));

// Mock static assets like images
jest.mock('../../assets/image/logo3.png', () => 'logo3.png');

// Mock localStorage to control it during tests
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Helper to render the component within a router, allowing us to set the initial route
const renderComponent = (props = {}, initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="*" element={<SidebarAdmin {...props} />} />
      </Routes>
    </MemoryRouter>
  );
};


// 2. TEST SUITE
describe('SidebarAdmin Component', () => {

  beforeEach(() => {
    // Clear all mock implementations and call history before each test
    jest.clearAllMocks();
  });

  describe('Rendering and Props', () => {
    test('renders all navigation links and the title', () => {
      renderComponent();
      
      expect(screen.getByRole('heading', { name: /Admin Dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Invest Dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /User Management/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Manage Blog/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Transactions/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Withdrawals/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Plans/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument();
    });

    test('applies the "open" class when isOpen prop is true', () => {
      renderComponent({ isOpen: true });
      // The <aside> element has a "complementary" role
      const sidebarElement = screen.getByRole('complementary');
      expect(sidebarElement).toHaveClass('admin-sidebar open');
    });

    test('does not apply the "open" class when isOpen prop is false or absent', () => {
      renderComponent({ isOpen: false });
      const sidebarElement = screen.getByRole('complementary');
      expect(sidebarElement).not.toHaveClass('open');
    });
  });

  describe('Navigation and Active Links', () => {
    test('applies "active-link" class to the correct NavLink based on the current route', () => {
      // Set the initial route to the User Management page
      const initialRoute = '/adminDashboard/userManagement';
      renderComponent({}, initialRoute);
      
      const userManagementLink = screen.getByRole('link', { name: /User Management/i });
      const dashboardLink = screen.getByRole('link', { name: /Invest Dashboard/i });

      // Assert that the active link has the class and others do not
      expect(userManagementLink).toHaveClass('active-link');
      expect(dashboardLink).not.toHaveClass('active-link');
    });

    test('applies "active-link" class to the main dashboard link only on exact match due to "end" prop', () => {
      const initialRoute = '/adminDashboard';
      renderComponent({}, initialRoute);

      const dashboardLink = screen.getByRole('link', { name: /Invest Dashboard/i });
      expect(dashboardLink).toHaveClass('active-link');
    });
  });

  describe('Sign Out Logic', () => {
    test('calls the onLogout prop function when it is provided', async () => {
      const user = userEvent.setup();
      const mockOnLogout = jest.fn();
      
      renderComponent({ onLogout: mockOnLogout });
      
      const signOutButton = screen.getByRole('button', { name: /Sign Out/i });
      await user.click(signOutButton);
      
      // Assert that the provided function was called
      expect(mockOnLogout).toHaveBeenCalledTimes(1);

      // Assert that the fallback logic was NOT executed
      expect(localStorage.removeItem).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('clears localStorage and navigates to /login when onLogout prop is not provided', async () => {
      const user = userEvent.setup();
      // Ensure spies on localStorage methods are set up
      const removeItemSpy = jest.spyOn(window.localStorage, 'removeItem');

      renderComponent(); // Render without the onLogout prop
      
      const signOutButton = screen.getByRole('button', { name: /Sign Out/i });
      await user.click(signOutButton);
      
      // Assert that the fallback logic was executed
      expect(removeItemSpy).toHaveBeenCalledWith('authToken');
      expect(removeItemSpy).toHaveBeenCalledWith('userRole');
      expect(removeItemSpy).toHaveBeenCalledWith('userData');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});