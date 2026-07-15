import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from '../Sidebar';

// 1. MOCK DEPENDENCIES
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    // THE CRITICAL FIX IS HERE: Added {children} inside the <a> tag.
    NavLink: jest.fn(({ children, to, onClick, className }) => (
        <a href={to} onClick={onClick} className={typeof className === 'function' ? className({ isActive: false }) : className}>
            {children}
        </a>
    )),
}));

jest.mock('react-icons/fa', () => ({
    FaBars: () => <div data-testid="bars-icon" />,
    FaTimes: () => <div data-testid="times-icon" />,
}));

// Mock the image asset with the correct relative path from the component
jest.mock('../../../assets/image/logo3.png', () => 'logo.png');

// Mock console.error to check for the fallback warning without polluting the test output
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock localStorage for testing authentication state
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: key => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: key => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.location for the sign-out fallback test
const location = window.location;
delete window.location;
window.location = { ...location, href: '' };


// 2. TEST SUITE
describe('Sidebar Component', () => {

    const mockOnLogout = jest.fn();

    // Clear all mocks before each test to ensure isolation
    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.clear();
    });

    test('renders correctly with all navigation links', () => {
        render(<Sidebar onLogout={mockOnLogout} />);

        // Check for static elements
        expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
        expect(screen.getByRole('img', { name: /logo/i })).toBeInTheDocument();

        // Check for all navigation links with the correct paths
        expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
        expect(screen.getByRole('link', { name: 'Investment Tool' })).toHaveAttribute('href', '/dashboard/investmenttools');
        expect(screen.getByRole('link', { name: 'Market Guides' })).toHaveAttribute('href', '/dashboard/marketguides');
        expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/dashboard/profile');
        expect(screen.getByRole('link', { name: 'Withdrawal' })).toHaveAttribute('href', '/dashboard/withdrawal');
        
        // The Payment link is a special case (it's an <a> tag with an onClick handler)
        expect(screen.getByRole('link', { name: 'Payment' })).toHaveAttribute('href', '#');
        expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    describe('Sign Out Functionality', () => {
        test('calls onLogout prop when it is provided as a function', async () => {
            const user = userEvent.setup();
            render(<Sidebar onLogout={mockOnLogout} />);

            const signOutButton = screen.getByText('Sign Out');
            await user.click(signOutButton);
            
            // Verify the primary action occurred
            expect(mockOnLogout).toHaveBeenCalledTimes(1);

            // Verify fallback actions did NOT occur
            expect(mockConsoleError).not.toHaveBeenCalled();
            expect(window.location.href).toBe('');
        });

        test('uses fallback to clear localStorage and redirect if onLogout is not a function', async () => {
            const user = userEvent.setup();
            localStorage.setItem('authToken', 'test-token');
            render(<Sidebar onLogout={null} />);

            const signOutButton = screen.getByText('Sign Out');
            await user.click(signOutButton);

            // It should clear localStorage and redirect using window.location
            expect(localStorage.getItem('authToken')).toBeNull();
            expect(window.location.href).toBe('/login');

            // The component's error handler should have been called with the correct message
            expect(mockConsoleError).toHaveBeenCalledWith("Sidebar: onLogout prop is missing or not a function!");
        });
    });

    describe('Payment Navigation', () => {
        test('calls navigate with correct state when Payment link is clicked', async () => {
            const user = userEvent.setup();
            render(<Sidebar onLogout={mockOnLogout} />);

            const paymentLink = screen.getByRole('link', { name: 'Payment' });
            await user.click(paymentLink);

            expect(mockNavigate).toHaveBeenCalledWith('/dashboard/payment', {
                state: {
                    isManualPayment: true,
                    purchaseDetails: null
                }
            });
        });
    });

    describe('Mobile Navigation', () => {
        test('toggles the mobile sidebar visibility on button click', async () => {
            const user = userEvent.setup();
            render(<Sidebar onLogout={mockOnLogout} />);

            const sidebar = screen.getByRole('complementary');
            const toggleButton = screen.getByRole('button', { name: /toggle navigation/i });
            
            expect(sidebar).not.toHaveClass('is-open');
            expect(screen.getByTestId('bars-icon')).toBeInTheDocument();

            // Open sidebar
            await user.click(toggleButton);
            expect(sidebar).toHaveClass('is-open');
            expect(screen.getByTestId('times-icon')).toBeInTheDocument();
            expect(document.querySelector('.dashboard__sidebar-overlay')).toBeInTheDocument();

            // Close sidebar
            await user.click(toggleButton);
            expect(sidebar).not.toHaveClass('is-open');
        });

        test('closes the mobile sidebar when a navigation link is clicked', async () => {
            const user = userEvent.setup();
            render(<Sidebar onLogout={mockOnLogout} />);
            
            const sidebar = screen.getByRole('complementary');
            const toggleButton = screen.getByRole('button', { name: /toggle navigation/i });

            // Open the sidebar
            await user.click(toggleButton);
            expect(sidebar).toHaveClass('is-open');

            // Click a link
            const profileLink = screen.getByRole('link', { name: 'Profile' });
            await user.click(profileLink);

            // Expect the sidebar to be closed
            expect(sidebar).not.toHaveClass('is-open');
        });

        test('closes the mobile sidebar when the overlay is clicked', async () => {
            const user = userEvent.setup();
            render(<Sidebar onLogout={mockOnLogout} />);

            const sidebar = screen.getByRole('complementary');
            const toggleButton = screen.getByRole('button', { name: /toggle navigation/i });
            
            // Open the sidebar
            await user.click(toggleButton);
            expect(sidebar).toHaveClass('is-open');

            // Find and click the overlay
            const overlay = document.querySelector('.dashboard__sidebar-overlay');
            expect(overlay).toBeInTheDocument();
            await user.click(overlay);

            // Expect the sidebar to be closed
            expect(sidebar).not.toHaveClass('is-open');
        });
    });
});