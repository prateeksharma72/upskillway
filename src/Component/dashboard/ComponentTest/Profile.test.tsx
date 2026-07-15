// src/Component/dashboard/ComponentTest/Profile.test.tsx

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { toast } from 'react-toastify';
import Profile from '../Profile';

// 1. MOCK DEPENDENCIES
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('react-toastify', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
    },
    ToastContainer: () => <div data-testid="toast-container" />,
}));

jest.mock('../Sidebar', () => () => <div data-testid="sidebar">Mocked Sidebar</div>);
jest.mock('../KYCVerification', () => () => <div data-testid="kyc-verification">Mocked KYC Component</div>);
jest.mock('../../../assets/image/logo4.png', () => 'default-profile-image.png');

Object.defineProperty(window, 'localStorage', {
    value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
    },
    writable: true,
});
const mockedLocalStorage = window.localStorage as jest.Mocked<typeof window.localStorage>;

// 2. TEST SUITE
describe('Profile Component', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockedLocalStorage.getItem.mockReturnValue('fake-auth-token');
    });

    const mockProfileData = {
        firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com',
        dob: '1990-01-15', address: '123 Main St', city: 'Anytown', country: 'USA',
        profilePictureUrl: null, kycCompleted: false,
    };

    test('shows loading state and then displays fetched profile data', async () => {
        mockedAxios.get.mockResolvedValue({ data: mockProfileData });
        render(<Profile />);

        expect(screen.getByText(/loading your profile/i)).toBeInTheDocument();

        expect(await screen.findByLabelText(/first name/i)).toHaveValue(mockProfileData.firstName);
        expect(screen.getByLabelText(/last name/i)).toHaveValue(mockProfileData.lastName);
    });

    test('handles API error when fetching profile data', async () => {
        mockedAxios.get.mockRejectedValue({ response: { data: { message: 'Profile not found' } } });
        render(<Profile />);
        
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Could not load your profile.');
        });
    });

    describe('Form Submission', () => {
        test('submits updated data successfully and shows success toast', async () => {
            const user = userEvent.setup();
            
            mockedAxios.get.mockResolvedValue({ data: mockProfileData });
            const updatedUser = { ...mockProfileData, firstName: 'Jonathan', city: 'Newville' };
            mockedAxios.put.mockResolvedValue({ data: { user: updatedUser } });

            render(<Profile />);

            const firstNameInput = await screen.findByLabelText(/first name/i);
            const cityInput = screen.getByLabelText(/city/i);

            await user.clear(firstNameInput);
            await user.type(firstNameInput, 'Jonathan');
            await user.clear(cityInput);
            await user.type(cityInput, 'Newville');

            await user.click(screen.getByRole('button', { name: /save changes/i }));

            // --- THIS IS THE FIX ---
            // Instead of looking for the "Saving..." state which is too brief,
            // we use waitFor to check for the *results* of the submission.
            await waitFor(() => {
                // Assert that the API was called with the correct data
                expect(mockedAxios.put).toHaveBeenCalledWith(
                    expect.stringContaining('/api/users/profile'),
                    {
                        firstName: 'Jonathan',
                        lastName: 'Doe',
                        dob: '1990-01-15',
                        address: '123 Main St',
                        city: 'Newville',
                        country: 'USA',
                    },
                    { headers: { Authorization: `Bearer fake-auth-token` } }
                );

                // Assert that the success toast was shown
                expect(toast.success).toHaveBeenCalledWith('Profile updated successfully!');
            });

            // You can also assert that the form fields have been updated with the response data
            expect(await screen.findByLabelText(/first name/i)).toHaveValue('Jonathan');
            expect(screen.getByLabelText(/city/i)).toHaveValue('Newville');
            
            // And that the button is no longer disabled
            expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
        });

        test('shows an error toast on submission failure', async () => {
            const user = userEvent.setup();
            const errorMessage = "Update failed due to server error";

            mockedAxios.get.mockResolvedValue({ data: mockProfileData });
            mockedAxios.put.mockRejectedValue({ response: { data: { message: errorMessage } } });

            render(<Profile />);

            const saveButton = await screen.findByRole('button', { name: /save changes/i });
            await user.click(saveButton);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith(errorMessage);
            });

            expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled();
        });
    });
});