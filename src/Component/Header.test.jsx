import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
// Add this import
import { HelmetProvider } from 'react-helmet-async'; 
import Seo from './Seo';

describe('Seo', () => {
  test('renders without crashing', () => {
    // Wrap the component like this
    render(
      <HelmetProvider>
        <Seo title="Test" />
      </HelmetProvider>
    );
  });
});