// src/Component/Footer.test.jsx
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom'; // Import MemoryRouter
import Footer from './Footer';

describe('Footer', () => {
  test('renders without crashing', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    ); // <--- This will now pass
  });
});